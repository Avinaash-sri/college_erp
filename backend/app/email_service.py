import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app import models

logger = logging.getLogger("erp_email_service")

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

    is_configured = bool(host and username and password)

    return {
        "host": host if host else None,
        "port": port,
        "username": username if username else None,
        "password": password if password else None,
        "from_email": from_email,
        "from_name": from_name,
        "use_tls": use_tls,
        "is_configured": is_configured
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

def send_smtp_message(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str,
    custom_config: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Sends an email using configured SMTP settings (with SSL or STARTTLS support).
    Accurately validates the recipient address, redacts sensitive details from logs,
    and returns exact status ('Sent', 'Failed', 'Email Not Configured', 'Blocked').
    """
    # 1. Recipient validation
    if not to_email or not to_email.strip() or "@" not in to_email or "." not in to_email.split("@")[-1]:
        logger.warning(f"Blocked email attempt: Invalid or missing parent recipient email '{to_email}'")
        return {
            "status": "Blocked",
            "message": "Blocked: Missing or invalid parent recipient email address.",
            "preview": html_content,
            "subject": subject,
            "error": "MISSING_PARENT_EMAIL"
        }

    clean_to_email = to_email.strip().lower()
    config = custom_config or get_effective_smtp_config(db)

    # 2. Check if SMTP credentials are configured
    if not config["is_configured"]:
        logger.warning(
            f"SMTP credentials not configured. Email to {clean_to_email} was not dispatched via SMTP."
        )
        return {
            "status": "Email Not Configured",
            "message": "SMTP credentials are not configured in backend environment or system settings. Real email was not delivered.",
            "preview": html_content,
            "subject": subject,
            "error": "SMTP_NOT_CONFIGURED"
        }

    # 3. Deliver via real SMTP
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{config['from_name']} <{config['from_email']}>"
        msg["To"] = clean_to_email

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        host = config["host"]
        port = config["port"]
        username = config["username"]
        password = config["password"]

        # Support SSL on port 465 vs STARTTLS on port 587/25
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=12) as server:
                server.login(username, password)
                server.sendmail(config["from_email"], clean_to_email, msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                if config["use_tls"]:
                    server.starttls()
                server.login(username, password)
                server.sendmail(config["from_email"], clean_to_email, msg.as_string())

        logger.info(f"Successfully submitted email via SMTP to {clean_to_email}")
        return {
            "status": "Sent",
            "message": f"Email successfully accepted by SMTP server for delivery to {clean_to_email}",
            "preview": html_content,
            "subject": subject,
            "error": None
        }
    except Exception as e:
        # Redact any passwords/tokens from exception string
        safe_err = str(e)
        import re
        safe_err = re.sub(r':([^:@]+)@', ':****@', safe_err)
        safe_err = re.sub(r'password[:=]\s*\S+', 'password: ****', safe_err, flags=re.IGNORECASE)
        logger.error(f"SMTP Delivery Failed to {clean_to_email}: {safe_err}")
        return {
            "status": "Failed",
            "message": f"SMTP Error: {safe_err}",
            "preview": html_content,
            "subject": subject,
            "error": safe_err
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
    db: Optional[Session] = None
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
        db=db
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
        db=db
    )

