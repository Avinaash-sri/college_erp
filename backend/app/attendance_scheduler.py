"""
Attendance Auto-Scheduler
=========================
Runs a daily background job (default: 11:00 PM) that:
1. Scans every student's overall attendance percentage
2. For any student below 75%, checks eligibility (deduplication)
3. Sends parent email alert via existing email_service
4. Logs result in AttendanceAlert table

Follows the same async-loop pattern as assignment_scheduler.py.
"""

import asyncio
import datetime
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.config import settings
from app.attendance_service import (
    get_student_overall_stats,
    calculate_recovery_classes,
    check_attendance_alert_eligibility,
)
from app.email_service import send_parent_attendance_email

logger = logging.getLogger("erp_attendance_scheduler")

_scheduler_running = False
_scheduler_task: Optional[asyncio.Task] = None

# ── Configurable via environment or settings ──────────────────────────────────
SCHEDULE_HOUR   = getattr(settings, 'ATTENDANCE_ALERT_HOUR',   23)  # 11 PM
SCHEDULE_MINUTE = getattr(settings, 'ATTENDANCE_ALERT_MINUTE',  0)
CURRENT_TERM    = getattr(settings, 'ACADEMIC_TERM', '2025-26 Term 2')


def run_attendance_alert_scan(db: Session) -> dict:
    """
    Core scan logic — call this from the scheduler or manually from an API endpoint.
    Returns a summary dict with counts.
    """
    students = db.query(models.Student).all()
    total = len(students)
    sent = 0
    skipped = 0
    failed = 0
    errors = []

    logger.info(f"[AttendanceScheduler] Scanning {total} students for attendance alerts...")

    for student in students:
        try:
            attended, total_sessions, pct, risk_status, recovery = get_student_overall_stats(db, student.id)

            # Skip students who are above 75%
            if pct >= settings.SAFE_THRESHOLD:
                skipped += 1
                continue

            # Determine prior percentage (last alert's recorded pct, or assume above 75 if none)
            last_alert = (
                db.query(models.AttendanceAlert)
                .filter(models.AttendanceAlert.student_id == student.id)
                .order_by(models.AttendanceAlert.sent_at.desc())
                .first()
            )
            prior_pct = last_alert.attendance_pct if last_alert else settings.SAFE_THRESHOLD

            # Eligibility check (deduplication)
            eligible, reason = check_attendance_alert_eligibility(
                db=db,
                student_id=student.id,
                prior_pct=prior_pct,
                new_pct=pct,
                total_sessions=total_sessions,
                academic_term=CURRENT_TERM,
            )

            if not eligible:
                logger.debug(f"[Skip] {student.name} ({student.reg_no}): {reason}")
                skipped += 1
                continue

            # Determine parent email
            parent_email = student.parent_email or ""
            parent_name  = student.parent_name or "Parent/Guardian"

            # Send email
            dept_name = student.department.name if student.department else "N/A"
            result = send_parent_attendance_email(
                parent_email=parent_email,
                student_name=student.name,
                reg_no=student.reg_no,
                department_name=dept_name,
                attendance_pct=round(pct, 2),
                recovery_classes=recovery,
                parent_name=parent_name,
                semester=student.semester,
                attended_sessions=attended,
                total_sessions=total_sessions,
                db=db,
            )

            # Log the alert
            alert = models.AttendanceAlert(
                student_id=student.id,
                parent_email=parent_email,
                attendance_pct=round(pct, 2),
                status=result.get("status", "Failed"),
                message=result.get("message", ""),
                academic_term=CURRENT_TERM,
                sent_at=datetime.datetime.utcnow(),
            )
            db.add(alert)
            db.commit()

            if result.get("status") == "Sent":
                sent += 1
                logger.info(f"[Sent] Alert to {parent_email} for {student.name} ({pct}%)")
            else:
                failed += 1
                logger.warning(f"[Failed] {student.name}: {result.get('message')}")

        except Exception as e:
            failed += 1
            errors.append(str(e))
            logger.error(f"[Error] Processing student {student.id}: {e}")
            db.rollback()

    summary = {
        "scanned": total,
        "alerts_sent": sent,
        "skipped": skipped,
        "failed": failed,
        "run_at": datetime.datetime.utcnow().isoformat(),
        "errors": errors[:10],  # cap to 10
    }
    logger.info(f"[AttendanceScheduler] Scan complete: {summary}")
    return summary


async def _scheduler_loop():
    """Async loop that fires run_attendance_alert_scan every day at SCHEDULE_HOUR:SCHEDULE_MINUTE."""
    global _scheduler_running
    logger.info(
        f"[AttendanceScheduler] Started — will fire daily at "
        f"{SCHEDULE_HOUR:02d}:{SCHEDULE_MINUTE:02d} local time."
    )

    while _scheduler_running:
        now = datetime.datetime.now()
        target = now.replace(
            hour=SCHEDULE_HOUR, minute=SCHEDULE_MINUTE, second=0, microsecond=0
        )
        if now >= target:
            # Already past today's scheduled time — aim for tomorrow
            target += datetime.timedelta(days=1)

        wait_seconds = (target - now).total_seconds()
        logger.info(f"[AttendanceScheduler] Next scan in {wait_seconds/3600:.2f}h at {target.strftime('%Y-%m-%d %H:%M')}")

        # Sleep in 60-second chunks so we can respond to stop signals
        slept = 0.0
        while slept < wait_seconds and _scheduler_running:
            chunk = min(60.0, wait_seconds - slept)
            await asyncio.sleep(chunk)
            slept += chunk

        if not _scheduler_running:
            break

        # Fire the scan
        db: Session = SessionLocal()
        try:
            run_attendance_alert_scan(db)
        except Exception as e:
            logger.error(f"[AttendanceScheduler] Unhandled error during scan: {e}")
        finally:
            db.close()

    logger.info("[AttendanceScheduler] Stopped.")


def start_attendance_scheduler():
    global _scheduler_running, _scheduler_task
    if _scheduler_running:
        logger.warning("[AttendanceScheduler] Already running.")
        return
    _scheduler_running = True
    loop = asyncio.get_event_loop()
    _scheduler_task = loop.create_task(_scheduler_loop())
    logger.info("[AttendanceScheduler] Background task created.")


def stop_attendance_scheduler():
    global _scheduler_running, _scheduler_task
    _scheduler_running = False
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
    _scheduler_task = None
    logger.info("[AttendanceScheduler] Stopped.")
