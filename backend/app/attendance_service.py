import math
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from app.config import settings

def calculate_recovery_classes(attended: int, total: int, required_pct: float = 75.0) -> int:
    """
    Calculates the smallest integer x >= 0 such that:
    (attended + x) / (total + x) >= required_pct / 100
    For 75%:
      (attended + x) / (total + x) >= 0.75
      attended + x >= 0.75 * total + 0.75 * x
      0.25 * x >= 0.75 * total - attended
      x >= (0.75 * total - attended) / 0.25
      x >= 3 * total - 4 * attended
    """
    if total == 0:
        return 4
    current_pct = (attended / total) * 100
    if current_pct >= required_pct:
        return 0
    
    target_ratio = required_pct / 100.0
    # Algebraic general form: x >= (target_ratio * total - attended) / (1 - target_ratio)
    numerator = target_ratio * total - attended
    denominator = 1.0 - target_ratio
    needed = math.ceil(numerator / denominator)
    return max(0, int(needed))

def get_risk_status(percentage: float) -> str:
    if percentage >= settings.SAFE_THRESHOLD:
        return "SAFE"
    elif percentage >= settings.WARNING_THRESHOLD:
        return "WARNING"
    else:
        return "HIGH RISK"

def get_student_overall_stats(db: Session, student_id: int) -> Tuple[int, int, float, str, int]:
    """
    Returns (attended, total, percentage, risk_status, recovery_classes)
    For newly registered students with 0 conducted classes, evaluates to 0.0% (HIGH RISK)
    so they are highlighted in the Attendance Alert center with parent contacts.
    """
    records = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student_id).all()
    total = len(records)
    attended = sum(1 for r in records if r.status == "Present")
    pct = round((attended / total) * 100, 2) if total > 0 else 0.0
    status = get_risk_status(pct)
    recovery = calculate_recovery_classes(attended, total, settings.SAFE_THRESHOLD)
    return attended, total, pct, status, recovery

def get_student_full_attendance(db: Session, student: models.Student) -> Dict[str, Any]:
    """
    Returns full summary including overall metrics and subject-wise breakdown.
    """
    overall_attended, overall_total, overall_pct, overall_status, overall_recovery = get_student_overall_stats(db, student.id)

    # Get all subjects for student's department and semester
    subjects = db.query(models.Subject).filter(
        models.Subject.department_id == student.department_id,
        models.Subject.semester == student.semester
    ).all()

    subject_list = []
    for sub in subjects:
        sub_records = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.student_id == student.id,
            models.AttendanceRecord.subject_id == sub.id
        ).all()

        total = len(sub_records)
        attended = sum(1 for r in sub_records if r.status == "Present")
        pct = round((attended / total) * 100, 2) if total > 0 else 100.0
        status = get_risk_status(pct)
        recovery = calculate_recovery_classes(attended, total, settings.SAFE_THRESHOLD)
        faculty_name = sub.faculty.name if sub.faculty else "Faculty"

        subject_list.append({
            "subject_id": sub.id,
            "subject_code": sub.code,
            "subject_name": sub.name,
            "faculty_name": faculty_name,
            "attended_classes": attended,
            "total_classes": total,
            "percentage": pct,
            "status": status,
            "recovery_classes": recovery
        })

    return {
        "student_id": student.id,
        "student_name": student.name,
        "reg_no": student.reg_no,
        "total_attended": overall_attended,
        "total_conducted": overall_total,
        "overall_percentage": overall_pct,
        "risk_status": overall_status,
        "recovery_classes": overall_recovery,
        "required_percentage": settings.SAFE_THRESHOLD,
        "subjects": subject_list
    }

def check_attendance_alert_eligibility(
    db: Session,
    student_id: int,
    prior_pct: float,
    new_pct: float,
    total_sessions: int,
    academic_term: str = "2025-26 Term 2"
) -> Tuple[bool, str]:
    """
    Evaluates whether a student is eligible for an automated below-75% attendance alert.
    Deduplication rules:
    - If total_sessions == 0, never issue warning.
    - If new_pct >= SAFE_THRESHOLD (75.0%), not eligible.
    - If student crossed from >= 75.0% to < 75.0%: ELIGIBLE (Initial crossing or relapse).
    - If student was already below 75.0% (prior_pct < 75.0%):
      Check alert history in current term.
      If an alert was already logged while continuously in this shortage state:
      Suppress duplicate alert.
      If no alert was ever recorded for this term: ELIGIBLE.
    """
    if total_sessions == 0:
        return False, "No attendance sessions recorded"

    if new_pct >= settings.SAFE_THRESHOLD:
        return False, "Attendance satisfies required threshold (>= 75%)"

    # Student is strictly below 75%
    # Did student cross from >= 75% to < 75%?
    if prior_pct >= settings.SAFE_THRESHOLD:
        return True, "Threshold Crossed (<75%)"

    # Student was already below 75%. Check if an alert was already logged in this term:
    recent_alert = db.query(models.AttendanceAlert).filter(
        models.AttendanceAlert.student_id == student_id,
        models.AttendanceAlert.academic_term == academic_term
    ).order_by(models.AttendanceAlert.sent_at.desc()).first()

    if not recent_alert:
        # First alert in term
        return True, "Initial Threshold Drop (<75%)"

    # Already alerted for current shortage period, suppress duplicate
    return False, "Duplicate alert suppressed: student already has an active shortage alert for this term"

