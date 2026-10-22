import asyncio
import datetime
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.email_service import send_smtp_message
from app.config import settings

logger = logging.getLogger("erp_assignment_scheduler")

_scheduler_running = False
_scheduler_task: Optional[asyncio.Task] = None

def generate_assignment_reminder_email(
    student_name: str,
    reg_no: str,
    assignment_title: str,
    subject_name: str,
    due_date_str: str,
    portal_link: str,
    reminder_count: int = 1
) -> Dict[str, str]:
    subject = f"Urgent: Assignment Submission Pending - {assignment_title} ({subject_name})"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background-color: #b91c1c; padding: 24px; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; }}
            .header p {{ margin: 4px 0 0; font-size: 13px; opacity: 0.9; }}
            .content {{ padding: 24px; }}
            .alert-box {{ background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #ef4444; border-radius: 6px; padding: 16px; margin: 16px 0; }}
            .alert-title {{ font-size: 14px; font-weight: 700; color: #991b1b; margin: 0 0 6px; }}
            .alert-text {{ font-size: 13px; color: #b91c1c; margin: 0; line-height: 1.5; }}
            .details-table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }}
            .details-table td {{ padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }}
            .details-table .label {{ font-weight: 600; color: #64748b; width: 35%; }}
            .details-table .val {{ color: #0f172a; font-weight: 500; }}
            .btn-container {{ text-align: center; margin: 24px 0 16px; }}
            .btn {{ display: inline-block; background-color: #1e40af; color: #ffffff !important; padding: 12px 28px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px; }}
            .footer {{ background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Academic Assignment Reminder</h1>
                <p>Cloud-Based College Academic Operations Portal</p>
            </div>
            <div class="content">
                <p style="font-size: 14px; line-height: 1.5;">Dear <strong>{student_name}</strong> ({reg_no}),</p>
                
                <div class="alert-box">
                    <p class="alert-title">Pending Submission Warning (Notice #{reminder_count})</p>
                    <p class="alert-text">
                        Our records indicate that you have <strong>not submitted</strong> the required assignment for <strong>{subject_name}</strong>. Please upload your submission before the deadline to avoid grade forfeiture.
                    </p>
                </div>

                <table class="details-table">
                    <tr>
                        <td class="label">Assignment Title:</td>
                        <td class="val">{assignment_title}</td>
                    </tr>
                    <tr>
                        <td class="label">Course / Subject:</td>
                        <td class="val">{subject_name}</td>
                    </tr>
                    <tr>
                        <td class="label">Submission Deadline:</td>
                        <td class="val" style="color: #b91c1c; font-weight: 700;">{due_date_str}</td>
                    </tr>
                    <tr>
                        <td class="label">Current Status:</td>
                        <td class="val"><span style="background-color: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">PENDING — NOT SUBMITTED</span></td>
                    </tr>
                </table>

                <div class="btn-container">
                    <a href="{portal_link}" class="btn">Open Student Assignment Portal</a>
                </div>

                <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                    If you submit a file or Google Drive link, this automated reminder service will stop immediately. Please ensure your Google Drive sharing permissions allow your course faculty to access the document.
                </p>
            </div>
            <div class="footer">
                Automated Institutional Notification &bull; Antigravity ERP Academic Office &bull; UTC Stored
            </div>
        </div>
    </body>
    </html>
    """

    text = f"""ACADEMIC ASSIGNMENT REMINDER (Notice #{reminder_count})
Dear {student_name} ({reg_no}),

Our records indicate that your assignment '{assignment_title}' for {subject_name} has NOT been submitted.

Assignment: {assignment_title}
Subject: {subject_name}
Deadline: {due_date_str}
Status: PENDING — NOT SUBMITTED

Please submit your work immediately via the student portal:
{portal_link}

This is an automated hourly notification dispatched while your submission remains pending.
"""
    return {"subject": subject, "html": html, "text": text}


def process_pending_assignment_reminders(db: Optional[Session] = None, manual_assignment_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Core persistent reminder service function:
    1. Queries active published assignments whose reminders are enabled.
    2. Determines eligible pending students whose next_reminder_at <= now.
    3. Verifies student has NOT submitted.
    4. Dispatches email reminder using actual registered student email address.
    5. Records log in assignment_reminder_logs.
    6. Updates next_reminder_at based on assignment.reminder_interval_minutes (default 60 mins).
    7. Idempotent: safe against server restarts, crashes, and network retries.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    now = datetime.datetime.utcnow()
    sent_count = 0
    failed_count = 0
    skipped_count = 0
    details = []

    try:
        # Find eligible assignments
        query = db.query(models.Assignment).filter(models.Assignment.status == "published")
        if manual_assignment_id:
            query = query.filter(models.Assignment.id == manual_assignment_id)

        assignments = query.all()

        for asgn in assignments:
            # Check deadline + grace period (e.g. stop reminders 24h after deadline unless allow_late)
            due_datetime = datetime.datetime.combine(asgn.due_date, datetime.time(23, 59))
            if asgn.due_time and ":" in asgn.due_time:
                try:
                    h, m = map(int, asgn.due_time.split(":")[:2])
                    due_datetime = datetime.datetime.combine(asgn.due_date, datetime.time(h, m))
                except Exception:
                    pass

            # If deadline passed and late submissions not allowed, stop reminders
            if now > due_datetime and not asgn.allow_late:
                continue

            interval_mins = asgn.reminder_interval_minutes or 60

            # Get eligible student records
            eligibilities = db.query(models.AssignmentEligibility).filter(
                models.AssignmentEligibility.assignment_id == asgn.id,
                models.AssignmentEligibility.is_excluded == False
            ).all()

            for elig in eligibilities:
                student = elig.student
                if not student or not student.email:
                    continue

                # 1. Check if student already submitted!
                submission = db.query(models.AssignmentSubmission).filter(
                    models.AssignmentSubmission.assignment_id == asgn.id,
                    models.AssignmentSubmission.student_id == student.id
                ).first()

                if submission and submission.status in ["Submitted", "Late", "Graded"]:
                    # Student has already submitted! Stop reminders!
                    continue

                # 2. Check schedule: is it time for next reminder?
                is_due_for_reminder = False
                if manual_assignment_id:
                    is_due_for_reminder = True
                elif elig.next_reminder_at is None or now >= elig.next_reminder_at:
                    is_due_for_reminder = True

                # Idempotency safety: do not re-send if sent within the last 5 minutes
                if elig.last_reminder_sent_at:
                    elapsed = (now - elig.last_reminder_sent_at).total_seconds()
                    if elapsed < 300 and not manual_assignment_id:
                        skipped_count += 1
                        continue

                if not is_due_for_reminder:
                    skipped_count += 1
                    continue

                # 3. Dispatch Email
                portal_url = f"{settings.FRONTEND_URL}/student/assignments"
                due_str = due_datetime.strftime("%d %b %Y %I:%M %p UTC")
                subject_name = asgn.subject.name if asgn.subject else "Course Assignment"

                reminder_num = (elig.reminder_count or 0) + 1
                email_content = generate_assignment_reminder_email(
                    student_name=student.name,
                    reg_no=student.reg_no,
                    assignment_title=asgn.title,
                    subject_name=subject_name,
                    due_date_str=due_str,
                    portal_link=portal_url,
                    reminder_count=reminder_num
                )

                send_res = send_smtp_message(
                    to_email=student.email,
                    subject=email_content["subject"],
                    html_content=email_content["html"],
                    text_content=email_content["text"],
                    db=db
                )

                delivery_status = send_res.get("status", "Failed")
                err_msg = send_res.get("error")

                # 4. Update next scheduled time in DB
                next_time = now + datetime.timedelta(minutes=interval_mins)
                elig.last_reminder_sent_at = now
                elig.next_reminder_at = next_time
                elig.reminder_count = reminder_num

                # 5. Log in audit table
                rem_log = models.AssignmentReminderLog(
                    assignment_id=asgn.id,
                    student_id=student.id,
                    recipient_email=student.email,
                    sent_at=now,
                    status=delivery_status,
                    attempt_count=reminder_num,
                    error_message=err_msg,
                    next_scheduled_time=next_time
                )
                db.add(rem_log)
                db.commit()

                if delivery_status in ["Sent", "Simulated"]:
                    sent_count += 1
                else:
                    failed_count += 1

                details.append({
                    "student_id": student.id,
                    "student_name": student.name,
                    "email": student.email,
                    "status": delivery_status,
                    "reminder_count": reminder_num,
                    "next_reminder_at": next_time.isoformat()
                })

        return {
            "status": "success",
            "sent_count": sent_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count,
            "details": details,
            "timestamp": now.isoformat()
        }

    except Exception as e:
        logger.error(f"Error executing assignment reminder service: {e}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
            "sent_count": sent_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count
        }
    finally:
        if close_db:
            db.close()


async def _reminder_daemon_loop():
    """
    Persistent background worker loop that awakens periodically to process pending reminders.
    Runs reliably throughout the application lifecycle.
    """
    global _scheduler_running
    logger.info("Assignment Hourly Email Reminder Service started in background.")
    while _scheduler_running:
        try:
            # Run reminder process in thread to avoid blocking async event loop
            await asyncio.to_thread(process_pending_assignment_reminders)
        except Exception as e:
            logger.error(f"Error in background reminder loop: {e}")

        # Sleep for 60 seconds before next check
        try:
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            break

    logger.info("Assignment Hourly Email Reminder Service stopped.")


def start_assignment_scheduler():
    global _scheduler_running, _scheduler_task
    if _scheduler_running:
        return
    _scheduler_running = True
    _scheduler_task = asyncio.create_task(_reminder_daemon_loop())


def stop_assignment_scheduler():
    global _scheduler_running, _scheduler_task
    _scheduler_running = False
    if _scheduler_task:
        _scheduler_task.cancel()
        _scheduler_task = None
