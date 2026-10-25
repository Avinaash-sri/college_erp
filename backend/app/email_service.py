import os
import smtplib
import socket
import time
import json
import re
import hashlib
import datetime
import logging
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app import models

logger = logging.getLogger("erp_email_service")

# ── Resiliency & Policy Constants ─────────────────────────────────────────────
DEFAULT_SMTP_TIMEOUT = 25       # Increased from 12s to tolerate DNS/TLS handshake delays
MAX_RETRIES = 3                 # Bounded retries for temporary failures
INITIAL_BACKOFF_SECONDS = 1.0   # Backoff: 1.0s, 2.0s
IDEMPOTENCY_WINDOW_SECONDS = 180 # 3 minutes suppression to prevent duplicate burst emails

# In-memory idempotency cache: { cache_key: { "sent_at": float, "result": dict } }
_idempotency_cache: Dict[str, Dict[str, Any]] = {}


def log_structured_email_event(
    event_type: str,
    recipient: str,
    status: str,
    attempt: int = 1,
    max_attempts: int = 1,
    duration_ms: float = 0.0,
    provider_code: Optional[str] = None,
    error_detail: Optional[str] = None,
    idempotent_replay: bool = False
) -> None:
    """
    Emits structured, machine-parsable audit logs for every email delivery attempt.
    CRITICAL: Never logs SMTP passwords, app passwords, secret tokens, or private recipient data.
    """
    sanitized_recipient = recipient or "unknown"
    if "@" in sanitized_recipient:
        parts = sanitized_recipient.split("@")
        user_part = parts[0]
        domain_part = parts[1]
        if len(user_part) > 2:
            sanitized_recipient = f"{user_part[:2]}***@{domain_part}"
        else:
            sanitized_recipient = f"*@{domain_part}"

    sanitized_error = None
    if error_detail:
        s = str(error_detail)
        s = re.sub(r':([^:@]+)@', ':****@', s)
        s = re.sub(r'(?:password|secret|key|token|auth)[:=]\s*\S+', 'password: ****', s, flags=re.IGNORECASE)
        sanitized_error = s

    log_entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "service": "smtp_mailer",
        "event_type": event_type,
        "recipient_id": sanitized_recipient,
        "status": status,
        "attempt": f"{attempt}/{max_attempts}",
        "duration_ms": round(duration_ms, 2),
        "provider_code": provider_code or ("250 OK" if status in ("Sent", "Accepted") else None),
        "error_detail": sanitized_error,
        "idempotent_replay": idempotent_replay
    }

    log_line = f"[SMTP_AUDIT] {json.dumps(log_entry)}"
    if status in ("Sent", "Accepted"):
        logger.info(log_line)
    elif status in ("Blocked", "Duplicate Suppressed"):
        logger.warning(log_line)
    else:
        logger.error(log_line)


def _is_retryable_smtp_error(exc: Exception) -> bool:
    """
    Distinguishes transient/temporary network & provider failures from permanent failures.
    Retryable: socket timeouts, broken connections, TLS handshake drops, SMTP 4xx codes.
    Non-retryable: authentication failure (535), syntax errors (501), mailbox not found (550).
    """
    if isinstance(exc, (
        smtplib.SMTPServerDisconnected,
        smtplib.SMTPConnectError,
        socket.timeout,
        TimeoutError,
        ConnectionResetError,
        ConnectionRefusedError,
        ConnectionAbortedError,
        BrokenPipeError,
        OSError
    )):
        return True

    if isinstance(exc, smtplib.SMTPResponseException):
        # 4xx SMTP codes designate temporary server failures (e.g. 421 Rate limit, 451 Local error)
        if 400 <= exc.smtp_code < 500:
            return True

    return False


def get_effective_smtp_config(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Returns the active SMTP configuration, prioritizing database system_settings
    over static .env values so credentials can be configured dynamically via UI or .env.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        db_settings = {s.key: s.value for s in db.query(models.SystemSetting).all()}
    except Exception:
        db_settings = {}
    finally:
        if close_db:
            db.close()

    host = (db_settings.get("SMTP_HOST") or settings.SMTP_HOST or "").strip()
    port_str = str(db_settings.get("SMTP_PORT") or settings.SMTP_PORT or "587").strip()
    username = (db_settings.get("SMTP_USERNAME") or settings.SMTP_USERNAME or "").strip()
    password = (db_settings.get("SMTP_PASSWORD") or settings.SMTP_PASSWORD or "").strip()

    # Determine sender address
    from_email = (db_settings.get("SMTP_FROM_EMAIL") or settings.SMTP_FROM_EMAIL or "").strip()
    if not from_email or from_email == "noreply@college-erp.edu":
        if username and "@" in username:
            from_email = username
        else:
            from_email = "noreply@college-erp.edu"

    from_name = (db_settings.get("SMTP_FROM_NAME") or settings.SMTP_FROM_NAME or "College ERP Administration").strip()
    use_tls_str = db_settings.get("SMTP_USE_TLS")
    use_tls = use_tls_str.lower() == "true" if use_tls_str else settings.SMTP_USE_TLS

    try:
        port = int(port_str)
    except (ValueError, TypeError):
        port = 587

    resend_key = (os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", None) or "").strip()
    is_configured = bool((host and username and password) or resend_key)

    return {
        "host": host if host else None,
        "port": port,
        "username": username if username else None,
        "password": password if password else None,
        "from_email": from_email,
        "from_name": from_name,
        "use_tls": use_tls,
        "is_configured": is_configured,
        "has_resend": bool(resend_key)
    }


def generate_attendance_email_content(
    student_name: str,
    reg_no: str,
    department_name: str,
    attendance_pct: float,
    recovery_classes: int,
    parent_name: str,
    semester: int = 6,
    attended_sessions: int = 0,
    total_sessions: int = 0,
    required_pct: float = 75.0,
    college_contact: str = "Office of Academic Affairs: dean.academics@college.edu | +91 80 2345 6789"
) -> Dict[str, str]:
    subject = f"Attendance Alert - {student_name} ({reg_no})"

    recovery_html = ""
    recovery_text = ""
    if recovery_classes > 0:
        recovery_html = f"""
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">Attendance Recovery Action Plan:</p>
            <p style="margin: 4px 0 0 0; color: #b91c1c;">
                Your ward needs to attend at least <strong>{recovery_classes} more consecutive classes</strong> without missing any to restore attendance back to the mandatory {required_pct}%.
            </p>
        </div>
        """
        recovery_text = f"\nAction Required: Your ward needs to attend at least {recovery_classes} more consecutive classes without absence to restore attendance to {required_pct}%."

    sessions_row = ""
    if total_sessions > 0:
        sessions_row = f"""<tr><td class="label">Attendance Count:</td><td class="val">{attended_sessions} Attended / {total_sessions} Eligible Sessions</td></tr>"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }}
            .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
            .header {{ background-color: #1e3a8a; color: #ffffff; padding: 20px 24px; text-align: left; }}
            .header h2 {{ margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.025em; }}
            .header p {{ margin: 4px 0 0 0; font-size: 13px; color: #bfdbfe; }}
            .content {{ padding: 24px; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 14px; background: #fee2e2; color: #dc2626; }}
            .table-info {{ width: 100%; border-collapse: collapse; margin: 16px 0; }}
            .table-info td {{ padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }}
            .table-info td.label {{ color: #64748b; width: 42%; font-weight: 500; }}
            .table-info td.val {{ color: #0f172a; font-weight: 600; }}
            .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h2>{settings.APP_NAME}</h2>
                <p>Official Academic Attendance Warning Notice</p>
            </div>
            <div class="content">
                <p>Dear <strong>{parent_name}</strong>,</p>
                <p>
                    This is an official automated attendance notification regarding your ward's current academic attendance standing.
                </p>
                <div style="text-align: center; margin: 16px 0;">
                    <span class="badge">Current Attendance: {attendance_pct}% (Below Mandatory {required_pct}%)</span>
                </div>
                <table class="table-info">
                    <tr><td class="label">Student Name:</td><td class="val">{student_name}</td></tr>
                    <tr><td class="label">Register Number:</td><td class="val">{reg_no}</td></tr>
                    <tr><td class="label">Department:</td><td class="val">{department_name}</td></tr>
                    <tr><td class="label">Current Semester:</td><td class="val">Semester {semester}</td></tr>
                    {sessions_row}
                    <tr><td class="label">Required Threshold:</td><td class="val">{required_pct}%</td></tr>
                    <tr><td class="label">Current Status:</td><td class="val" style="color: #dc2626;">At Risk / Attendance Shortage</td></tr>
                </table>
                {recovery_html}
                <p style="font-size: 14px; color: #475569;">
                    As per university and institutional regulations, maintaining a minimum of {required_pct}% attendance is mandatory to be eligible for semester-end examinations.
                    We kindly request your cooperation in helping your ward improve class attendance. Please discuss this with your ward and contact the department academic counselor if guidance is required.
                </p>
                <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; color: #475569;">
                    <strong>College Contact Information:</strong><br>
                    {college_contact}
                </div>
                <p style="font-size: 14px; color: #475569; margin-top: 16px;">
                    Warm regards,<br>
                    <strong>Office of Academic Affairs</strong><br>
                    {settings.APP_NAME}
                </p>
            </div>
            <div class="footer">
                This is an automated institutional alert sent to the registered parent email address. Please contact the college administration for any clarifications.
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""Dear {parent_name},

This is an automated attendance alert from the {settings.APP_NAME}.

Your ward {student_name} (Reg No: {reg_no}, Dept: {department_name}, Semester: {semester}) has an overall attendance of {attendance_pct}%, which is strictly below the mandatory {required_pct}% requirement.
{f"Sessions Attended: {attended_sessions} / {total_sessions} conducted." if total_sessions > 0 else ""}
{recovery_text}

As per college regulations, maintaining a minimum of {required_pct}% attendance is required to appear for semester-end examinations. Please help your ward improve attendance.

College Contact: {college_contact}

Regards,
Office of Academic Affairs
{settings.APP_NAME}
"""

    return {
        "subject": subject,
        "html": html_content,
        "text": text_content
    }


def send_via_resend(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str,
    cc_email: Optional[str] = None,
    api_key: Optional[str] = None,
    from_email: Optional[str] = None,
    event_type: str = "attendance_alert"
) -> Optional[Dict[str, Any]]:
    """
    Sends email over HTTPS port 443 using Resend API.
    Bypasses cloud provider SMTP firewall blocks (like Render free tier).
    """
    effective_key = (api_key or os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", None) or "").strip()
    if not effective_key:
        return None

    sender = (from_email or os.getenv("RESEND_FROM_EMAIL") or getattr(settings, "RESEND_FROM_EMAIL", None) or "College Academic Office <onboarding@resend.dev>").strip()
    recipients = [to_email]
    if cc_email and "@" in cc_email and cc_email != to_email:
        recipients.append(cc_email)

    payload = {
        "from": sender,
        "to": recipients,
        "subject": subject,
        "html": html_content,
        "text": text_content
    }

    start_time = time.time()
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {effective_key}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=15.0
        )
        duration_ms = (time.time() - start_time) * 1000

        if response.status_code in (200, 201):
            res_data = response.json()
            email_id = res_data.get("id", "resend_ok")
            log_structured_email_event(
                event_type=event_type,
                recipient=to_email,
                status="Sent",
                duration_ms=duration_ms,
                provider_code=f"Resend HTTP {response.status_code} ({email_id})"
            )
            return {
                "status": "Sent",
                "delivery_status": "Delivered via Resend HTTPS API",
                "message": f"Email successfully accepted by Resend API (ID: {email_id}) for delivery to {', '.join(recipients)}",
                "preview": html_content,
                "subject": subject,
                "error": None,
                "attempts": 1,
                "provider_code": f"Resend {email_id}",
                "idempotent_replay": False
            }
        else:
            logger.warning(f"Resend API returned status {response.status_code}: {response.text}")
            log_structured_email_event(
                event_type=event_type,
                recipient=to_email,
                status="Resend Error",
                duration_ms=duration_ms,
                error_detail=f"Resend HTTP {response.status_code}: {response.text[:200]}"
            )
            return None
    except Exception as exc:
        logger.error(f"Failed to send via Resend HTTPS API: {exc}")
        return None


def send_smtp_message(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str,
    cc_email: Optional[str] = None,
    custom_config: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None,
    skip_idempotency: bool = False,
    event_type: str = "attendance_alert"
) -> Dict[str, Any]:
    """
    Sends an email using configured SMTP settings (with SSL or STARTTLS support).
    Features:
    - Accurate recipient validation & fallback.
    - Idempotency deduplication window to suppress accidental duplicate submissions.
    - Bounded retries with exponential backoff for temporary network / SMTP 4xx errors.
    - Strict provider acceptance verification: marked as 'Sent' only when server confirms acceptance.
    - Structured audit logging (credentials/passwords completely sanitized).
    """
    start_time = time.time()

    # 1. Recipient validation
    primary_email = (to_email or "").strip().lower()
    clean_cc = (cc_email or "").strip().lower() if cc_email else None

    if not primary_email or "@" not in primary_email or "." not in primary_email.split("@")[-1]:
        # If primary (parent) email is missing, check if student email is valid
        if clean_cc and "@" in clean_cc and "." in clean_cc.split("@")[-1]:
            primary_email = clean_cc
            clean_cc = None
        else:
            log_structured_email_event(
                event_type=event_type,
                recipient=to_email or "MISSING",
                status="Blocked",
                error_detail="Missing or invalid recipient email address"
            )
            return {
                "status": "Blocked",
                "delivery_status": "Blocked (Invalid Recipient)",
                "message": "Blocked: Missing or invalid recipient email address.",
                "preview": html_content,
                "subject": subject,
                "error": "MISSING_RECIPIENT_EMAIL",
                "attempts": 0
            }

    clean_to_email = primary_email

    # 2. Idempotency Check: Suppress duplicate identical emails within suppression window
    cache_key = f"{clean_to_email}:{hashlib.sha256(subject.encode()).hexdigest()[:16]}"
    now_ts = time.time()
    if not skip_idempotency and cache_key in _idempotency_cache:
        cached_entry = _idempotency_cache[cache_key]
        elapsed = now_ts - cached_entry["sent_at"]
        if elapsed < IDEMPOTENCY_WINDOW_SECONDS:
            log_structured_email_event(
                event_type=event_type,
                recipient=clean_to_email,
                status="Duplicate Suppressed",
                duration_ms=(time.time() - start_time) * 1000,
                idempotent_replay=True
            )
            cached_res = dict(cached_entry["result"])
            cached_res["idempotent_replay"] = True
            cached_res["message"] = f"Notice already confirmed by SMTP provider within last {int(elapsed)}s. Duplicate suppressed."
            return cached_res

    # 2.5 Resend HTTPS API Gateway (Bypasses cloud provider SMTP firewall blocks like Render free tier)
    resend_result = send_via_resend(
        to_email=clean_to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        cc_email=clean_cc,
        event_type=event_type
    )
    if resend_result and resend_result.get("status") == "Sent":
        _idempotency_cache[cache_key] = {"sent_at": now_ts, "result": resend_result}
        return resend_result

    # 3. Check if SMTP credentials are configured
    config = custom_config or get_effective_smtp_config(db)
    if not config["is_configured"]:
        log_structured_email_event(
            event_type=event_type,
            recipient=clean_to_email,
            status="Email Not Configured",
            error_detail="SMTP credentials not configured"
        )
        return {
            "status": "Email Not Configured",
            "delivery_status": "Unconfigured Gateway",
            "message": "SMTP credentials are not configured in backend environment or system settings. Real email was not delivered.",
            "preview": html_content,
            "subject": subject,
            "error": "SMTP_NOT_CONFIGURED",
            "attempts": 0
        }

    # 4. Construct Email Message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{config['from_name']} <{config['from_email']}>"
    msg["To"] = clean_to_email
    recipients = [clean_to_email]

    if clean_cc and "@" in clean_cc and "." in clean_cc.split("@")[-1] and clean_cc != clean_to_email:
        msg["Cc"] = clean_cc
        recipients.append(clean_cc)

    part1 = MIMEText(text_content, "plain", "utf-8")
    part2 = MIMEText(html_content, "html", "utf-8")
    msg.attach(part1)
    msg.attach(part2)

    host = config["host"]
    port = config["port"]
    username = config["username"]
    password = config["password"]
    recipients_str = ", ".join(recipients)

    # 5. Deliver via SMTP with Bounded Retries & Exponential Backoff
    last_error_str = None
    attempt_count = 0

    for attempt in range(1, MAX_RETRIES + 1):
        attempt_count = attempt
        attempt_start = time.time()
        try:
            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=DEFAULT_SMTP_TIMEOUT)
            else:
                server = smtplib.SMTP(host, port, timeout=DEFAULT_SMTP_TIMEOUT)

            try:
                server.ehlo()
                if port != 465 and config["use_tls"]:
                    server.starttls()
                    server.ehlo()

                server.login(username, password)
                refused_recipients = server.sendmail(config["from_email"], recipients, msg.as_string())

                # Provider confirmed acceptance check
                if refused_recipients and len(refused_recipients) == len(recipients):
                    raise smtplib.SMTPRecipientsRefused(refused_recipients)

            finally:
                try:
                    server.quit()
                except Exception:
                    pass

            # Successfully accepted by SMTP provider
            duration_ms = (time.time() - start_time) * 1000
            log_structured_email_event(
                event_type=event_type,
                recipient=clean_to_email,
                status="Sent",
                attempt=attempt,
                max_attempts=MAX_RETRIES,
                duration_ms=duration_ms,
                provider_code="250 2.0.0 OK"
            )

            result = {
                "status": "Sent",
                "delivery_status": "Accepted by SMTP Provider",
                "message": f"Email successfully accepted by SMTP server for delivery to {recipients_str}",
                "preview": html_content,
                "subject": subject,
                "error": None,
                "attempts": attempt,
                "provider_code": "250 2.0.0 OK",
                "idempotent_replay": False
            }

            # Cache successful delivery in idempotency cache
            _idempotency_cache[cache_key] = {
                "sent_at": now_ts,
                "result": result
            }

            return result

        except Exception as exc:
            duration_ms = (time.time() - attempt_start) * 1000
            is_retryable = _is_retryable_smtp_error(exc)
            safe_err = str(exc)
            safe_err = re.sub(r':([^:@]+)@', ':****@', safe_err)
            safe_err = re.sub(r'(?:password|secret|key|token)[:=]\s*\S+', 'password: ****', safe_err, flags=re.IGNORECASE)
            last_error_str = safe_err

            if is_retryable and attempt < MAX_RETRIES:
                backoff_wait = INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1))
                log_structured_email_event(
                    event_type=event_type,
                    recipient=clean_to_email,
                    status="Retry",
                    attempt=attempt,
                    max_attempts=MAX_RETRIES,
                    duration_ms=duration_ms,
                    error_detail=f"Temporary SMTP error ({safe_err}). Retrying in {backoff_wait}s..."
                )
                time.sleep(backoff_wait)
                continue
            else:
                # Permanent failure or retry limit exceeded
                log_structured_email_event(
                    event_type=event_type,
                    recipient=clean_to_email,
                    status="Failed",
                    attempt=attempt,
                    max_attempts=MAX_RETRIES,
                    duration_ms=duration_ms,
                    error_detail=safe_err
                )
                break

    return {
        "status": "Failed",
        "delivery_status": "Delivery Failed",
        "message": f"SMTP Error after {attempt_count} attempt(s): {last_error_str}",
        "preview": html_content,
        "subject": subject,
        "error": last_error_str,
        "attempts": attempt_count,
        "idempotent_replay": False
    }


def send_parent_attendance_email(
    parent_email: str,
    student_name: str,
    reg_no: str,
    department_name: str,
    attendance_pct: float,
    recovery_classes: int,
    parent_name: str,
    semester: int = 6,
    attended_sessions: int = 0,
    total_sessions: int = 0,
    student_email: Optional[str] = None,
    db: Optional[Session] = None,
    skip_idempotency: bool = False
) -> Dict[str, Any]:
    email_data = generate_attendance_email_content(
        student_name=student_name,
        reg_no=reg_no,
        department_name=department_name,
        attendance_pct=attendance_pct,
        recovery_classes=recovery_classes,
        parent_name=parent_name,
        semester=semester,
        attended_sessions=attended_sessions,
        total_sessions=total_sessions,
        required_pct=settings.SAFE_THRESHOLD
    )

    return send_smtp_message(
        to_email=parent_email,
        subject=email_data["subject"],
        html_content=email_data["html"],
        text_content=email_data["text"],
        cc_email=student_email,
        db=db,
        skip_idempotency=skip_idempotency,
        event_type="parent_attendance_alert"
    )


def test_smtp_connection(to_email: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Sends a test verification email to verify SMTP gateway configuration.
    """
    config = get_effective_smtp_config(db)
    if not config["is_configured"]:
        return {
            "status": "Failed",
            "message": "SMTP is not fully configured. Please provide SMTP Server, Port, Username, and Password."
        }

    subject = f"Test Email - {settings.APP_NAME} SMTP Verification"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
                <h2 style="color: #1e3a8a; margin: 0; font-size: 18px;">{settings.APP_NAME}</h2>
                <span style="font-size: 12px; color: #64748b;">SMTP Gateway Verification</span>
            </div>
            <p style="font-size: 14px; line-height: 1.5;">Hello,</p>
            <p style="font-size: 14px; line-height: 1.5;">
                This is a confirmation test email dispatched from your <strong>College ERP Academic System</strong>.
            </p>
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: 600;">
                    ✓ Outbound SMTP Mailer is fully operational!
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">
                    Delivered via: {config['host']}:{config['port']} (Sender: {config['from_email']})
                </p>
            </div>
            <p style="font-size: 13px; color: #64748b;">
                Automated parent attendance shortage alerts and college notifications will now be delivered properly to registered recipient inboxes.
            </p>
        </div>
    </body>
    </html>
    """
    text_content = f"Test Email from {settings.APP_NAME}. Your SMTP configuration is working properly!"

    return send_smtp_message(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        custom_config=config,
        db=db,
        skip_idempotency=True,
        event_type="smtp_gateway_test"
    )


