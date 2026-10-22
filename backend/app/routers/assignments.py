import os
import re
import datetime
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.assignment_scheduler import process_pending_assignment_reminders
from app.config import settings

logger = logging.getLogger("erp_assignments")

router = APIRouter(tags=["Assignment Management"])

# Local private file storage directory for assignments
STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "assignments"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def get_logged_in_faculty(current_user: models.User = Depends(get_current_user)) -> models.Faculty:
    if current_user.role != "faculty" or not current_user.faculty_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty privileges required"
        )
    return current_user.faculty_profile


def get_logged_in_student(current_user: models.User = Depends(get_current_user)) -> models.Student:
    if current_user.role != "student" or not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student privileges required"
        )
    return current_user.student_profile


# ==============================================================================
# SECURED FILE DOWNLOAD ENDPOINT
# ==============================================================================

@router.get("/assignments/download/{submission_id}")
def download_submission_file(
    submission_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated and authorized file download endpoint.
    Only the student who submitted the file, the faculty handling the subject,
    or an administrator can download the file.
    """
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.id == submission_id
    ).first()

    if not sub or not sub.file_path:
        raise HTTPException(status_code=404, detail="Submission file not found")

    # Authorization Check
    is_authorized = False
    if current_user.role == "admin":
        is_authorized = True
    elif current_user.role == "faculty" and current_user.faculty_profile:
        is_authorized = True
    elif current_user.role == "student" and current_user.student_profile:
        if sub.student_id == current_user.student_profile.id:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to download this submission file"
        )

    file_path = Path(sub.file_path)
    if not file_path.is_absolute():
        file_path = (STORAGE_DIR / file_path.name).resolve()

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on storage server")

    filename = sub.file_name or file_path.name
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )


# ==============================================================================
# FACULTY ENDPOINTS
# ==============================================================================

@router.get("/faculty/assignments", response_model=List[schemas.AssignmentResponse])
def get_faculty_assignments(
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Lists assignments created by the authenticated faculty member with real submission counts.
    """
    assignments = db.query(models.Assignment).filter(
        models.Assignment.created_by == faculty.id
    ).order_by(models.Assignment.created_at.desc()).all()

    result = []
    for a in assignments:
        total_eligible = db.query(models.AssignmentEligibility).filter(
            models.AssignmentEligibility.assignment_id == a.id,
            models.AssignmentEligibility.is_excluded == False
        ).count()

        submitted_count = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.status.in_(["Submitted", "Late", "Graded"])
        ).count()

        graded_count = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.status == "Graded"
        ).count()

        pending_count = max(0, total_eligible - submitted_count)

        result.append(schemas.AssignmentResponse(
            id=a.id,
            subject_id=a.subject_id,
            subject_name=a.subject.name if a.subject else "",
            subject_code=a.subject.code if a.subject else "",
            department_id=a.department_id,
            department_name=a.department.name if a.department else "",
            semester=a.semester or 6,
            section=a.section or "A",
            title=a.title,
            description=a.description,
            due_date=a.due_date,
            due_time=a.due_time or "23:59",
            max_marks=a.max_marks,
            resource_url=a.resource_url,
            allowed_file_types=a.allowed_file_types or "pdf,docx,zip,txt",
            max_file_size_mb=a.max_file_size_mb or 10,
            submission_format=a.submission_format or "both",
            allow_resubmission=a.allow_resubmission if a.allow_resubmission is not None else True,
            allow_late=a.allow_late if a.allow_late is not None else True,
            status=a.status or "published",
            reminder_interval_minutes=a.reminder_interval_minutes or 60,
            faculty_name=faculty.name,
            created_at=a.created_at,
            total_eligible=total_eligible,
            submitted_count=submitted_count,
            pending_count=pending_count,
            graded_count=graded_count
        ))

    return result


@router.post("/faculty/assignments", response_model=schemas.AssignmentResponse)
def create_assignment(
    payload: schemas.AssignmentCreate,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Creates an assignment with department, semester, section filters and initializes
    the student eligibility roster and automated reminder state.
    """
    dept_id = payload.department_id or faculty.department_id

    assignment = models.Assignment(
        subject_id=payload.subject_id,
        department_id=dept_id,
        semester=payload.semester,
        section=payload.section,
        title=payload.title.strip(),
        description=payload.description.strip(),
        due_date=payload.due_date,
        due_time=payload.due_time,
        max_marks=payload.max_marks,
        resource_url=payload.resource_url,
        allowed_file_types=payload.allowed_file_types.strip().lower(),
        max_file_size_mb=payload.max_file_size_mb,
        submission_format=payload.submission_format,
        allow_resubmission=payload.allow_resubmission,
        allow_late=payload.allow_late,
        status=payload.status,
        reminder_interval_minutes=payload.reminder_interval_minutes,
        created_by=faculty.id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(assignment)
    db.flush()

    # Query eligible students from database
    std_query = db.query(models.Student).filter(
        models.Student.department_id == dept_id,
        models.Student.semester == payload.semester
    )
    if payload.section and payload.section != "All":
        std_query = std_query.filter(models.Student.section == payload.section)

    students = std_query.all()
    excluded_set = set(payload.excluded_student_ids or [])
    now = datetime.datetime.utcnow()
    initial_reminder_time = now + datetime.timedelta(minutes=payload.reminder_interval_minutes)

    for s in students:
        is_ex = s.id in excluded_set
        elig = models.AssignmentEligibility(
            assignment_id=assignment.id,
            student_id=s.id,
            is_excluded=is_ex,
            next_reminder_at=initial_reminder_time if not is_ex else None,
            reminder_count=0,
            created_at=now
        )
        db.add(elig)

    db.commit()
    db.refresh(assignment)

    # If published, create in-app notification for included students
    if assignment.status == "published":
        for s in students:
            if s.id not in excluded_set:
                notif = models.Notification(
                    user_id=s.user_id,
                    title=f"New Assignment: {assignment.title}",
                    message=f"New assignment published for {assignment.subject.name if assignment.subject else 'your course'}. Due date: {assignment.due_date.strftime('%d %b %Y')} {assignment.due_time}.",
                    type="Assignment Circular",
                    link_url="/student/assignments",
                    is_read=False,
                    created_at=now
                )
                db.add(notif)
        db.commit()

    total_eligible = len([s for s in students if s.id not in excluded_set])

    return schemas.AssignmentResponse(
        id=assignment.id,
        subject_id=assignment.subject_id,
        subject_name=assignment.subject.name if assignment.subject else "",
        subject_code=assignment.subject.code if assignment.subject else "",
        department_id=assignment.department_id,
        department_name=assignment.department.name if assignment.department else "",
        semester=assignment.semester,
        section=assignment.section,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        due_time=assignment.due_time,
        max_marks=assignment.max_marks,
        resource_url=assignment.resource_url,
        allowed_file_types=assignment.allowed_file_types,
        max_file_size_mb=assignment.max_file_size_mb,
        submission_format=assignment.submission_format,
        allow_resubmission=assignment.allow_resubmission,
        allow_late=assignment.allow_late,
        status=assignment.status,
        reminder_interval_minutes=assignment.reminder_interval_minutes,
        faculty_name=faculty.name,
        created_at=assignment.created_at,
        total_eligible=total_eligible,
        submitted_count=0,
        pending_count=total_eligible,
        graded_count=0
    )


@router.get("/faculty/assignments/{assignment_id}/roster")
def get_assignment_roster(
    assignment_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Returns the comprehensive student roster for this assignment.
    Students who have not submitted are clearly identified with status:
    'Pending — Not Submitted' for clear red badge highlighting.
    """
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.created_by == faculty.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or unauthorized")

    eligibilities = db.query(models.AssignmentEligibility).filter(
        models.AssignmentEligibility.assignment_id == assignment.id
    ).all()

    roster = []
    pending_count = 0
    submitted_count = 0
    graded_count = 0
    late_count = 0

    for e in eligibilities:
        s = e.student
        sub = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == assignment.id,
            models.AssignmentSubmission.student_id == s.id
        ).first()

        if e.is_excluded:
            item_status = "Excluded"
        elif not sub:
            item_status = "Pending — Not Submitted"
            pending_count += 1
        elif sub.status == "Graded":
            item_status = "Graded"
            graded_count += 1
            submitted_count += 1
        elif sub.status == "Late":
            item_status = "Late"
            late_count += 1
            submitted_count += 1
        elif sub.status == "Returned for Resubmission":
            item_status = "Returned for Resubmission"
            pending_count += 1
        else:
            item_status = "Submitted"
            submitted_count += 1

        roster.append({
            "student_id": s.id,
            "reg_no": s.reg_no,
            "name": s.name,
            "email": s.email,
            "section": s.section,
            "status": item_status,
            "is_excluded": e.is_excluded,
            "submission_id": sub.id if sub else None,
            "submitted_at": sub.submitted_at.isoformat() if sub and sub.submitted_at else None,
            "submission_type": sub.submission_type if sub else None,
            "file_name": sub.file_name if sub else None,
            "file_size": sub.file_size if sub else None,
            "drive_link": sub.drive_link if sub else None,
            "marks_obtained": sub.marks_obtained if sub else None,
            "max_marks": assignment.max_marks,
            "faculty_feedback": sub.faculty_feedback if sub else None,
            "graded_at": sub.graded_at.isoformat() if sub and sub.graded_at else None,
            "last_reminder_sent_at": e.last_reminder_sent_at.isoformat() if e.last_reminder_sent_at else None,
            "next_reminder_at": e.next_reminder_at.isoformat() if e.next_reminder_at else None,
            "reminder_count": e.reminder_count or 0
        })

    return {
        "assignment_id": assignment.id,
        "title": assignment.title,
        "subject_name": assignment.subject.name if assignment.subject else "",
        "due_date": assignment.due_date.isoformat(),
        "due_time": assignment.due_time,
        "max_marks": assignment.max_marks,
        "total_eligible": len([e for e in eligibilities if not e.is_excluded]),
        "pending_count": pending_count,
        "submitted_count": submitted_count,
        "graded_count": graded_count,
        "late_count": late_count,
        "roster": sorted(roster, key=lambda x: x["reg_no"])
    }


@router.post("/faculty/assignments/{assignment_id}/grade/{student_id}")
def grade_assignment_submission(
    assignment_id: int,
    student_id: int,
    payload: schemas.AssignmentGradeRequest,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Grades an assignment submission with marks and feedback,
    or returns for resubmission if enabled.
    """
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
        models.AssignmentSubmission.student_id == student_id
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="No submission found for this student")

    now = datetime.datetime.utcnow()

    if payload.return_for_resubmission:
        sub.status = "Returned for Resubmission"
        sub.faculty_feedback = payload.faculty_feedback or "Returned by faculty for revision. Please resubmit."
    else:
        sub.status = "Graded"
        sub.marks_obtained = payload.marks_obtained
        sub.faculty_feedback = payload.faculty_feedback

    sub.graded_by = faculty.id
    sub.graded_at = now
    db.commit()

    # Notify student
    student = sub.student
    notif_msg = f"Your assignment '{sub.assignment.title}' was evaluated. Score: {sub.marks_obtained}/{sub.assignment.max_marks}." if sub.status == "Graded" else f"Your assignment '{sub.assignment.title}' was returned for resubmission. Feedback: {sub.faculty_feedback}"
    notif = models.Notification(
        user_id=student.user_id,
        title=f"Assignment Feedback: {sub.assignment.title}",
        message=notif_msg,
        type="Assignment Graded",
        link_url="/student/assignments",
        is_read=False,
        created_at=now
    )
    db.add(notif)
    db.commit()

    return {
        "status": "success",
        "message": "Submission graded successfully",
        "submission_status": sub.status,
        "marks_obtained": sub.marks_obtained
    }


@router.post("/faculty/assignments/{assignment_id}/trigger-reminders", response_model=schemas.ReminderTriggerResponse)
def trigger_immediate_reminders(
    assignment_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Allows authorized faculty to test and dispatch an immediate email reminder pass
    for all students with pending submissions on this assignment.
    """
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.created_by == faculty.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or unauthorized")

    result = process_pending_assignment_reminders(db=db, manual_assignment_id=assignment.id)

    return schemas.ReminderTriggerResponse(
        status=result.get("status", "success"),
        assignment_id=assignment.id,
        sent_count=result.get("sent_count", 0),
        failed_count=result.get("failed_count", 0),
        skipped_count=result.get("skipped_count", 0),
        next_run=f"{assignment.reminder_interval_minutes} minutes from now",
        details=result.get("details", [])
    )


@router.get("/faculty/assignments/{assignment_id}/reminder-logs")
def get_assignment_reminder_logs(
    assignment_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Returns the historical audit trail of all email reminders sent for this assignment.
    """
    logs = db.query(models.AssignmentReminderLog).filter(
        models.AssignmentReminderLog.assignment_id == assignment_id
    ).order_by(models.AssignmentReminderLog.sent_at.desc()).limit(100).all()

    return [
        {
            "id": l.id,
            "student_id": l.student_id,
            "student_name": l.student.name if l.student else "Student",
            "recipient_email": l.recipient_email,
            "sent_at": l.sent_at.isoformat(),
            "status": l.status,
            "attempt_count": l.attempt_count,
            "error_message": l.error_message,
            "next_scheduled_time": l.next_scheduled_time.isoformat() if l.next_scheduled_time else None
        }
        for l in logs
    ]


@router.delete("/faculty/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Deletes an assignment and its associated roster and submissions.
    """
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.created_by == faculty.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or unauthorized")

    db.delete(assignment)
    db.commit()
    return {"status": "success", "message": "Assignment deleted successfully"}


# ==============================================================================
# STUDENT ENDPOINTS
# ==============================================================================

@router.get("/students/me/assignments")
def get_student_assignments(
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Returns assignments assigned to the logged-in student, including their submission
    status, grade, feedback, and submission countdown.
    """
    eligibilities = db.query(models.AssignmentEligibility).filter(
        models.AssignmentEligibility.student_id == student.id,
        models.AssignmentEligibility.is_excluded == False
    ).all()

    asgn_ids = [e.assignment_id for e in eligibilities]
    assignments = db.query(models.Assignment).filter(
        models.Assignment.id.in_(asgn_ids),
        models.Assignment.status == "published"
    ).order_by(models.Assignment.due_date.asc()).all()

    result = []
    now = datetime.datetime.utcnow()

    for a in assignments:
        due_dt = datetime.datetime.combine(a.due_date, datetime.time(23, 59))
        if a.due_time and ":" in a.due_time:
            try:
                h, m = map(int, a.due_time.split(":")[:2])
                due_dt = datetime.datetime.combine(a.due_date, datetime.time(h, m))
            except Exception:
                pass

        sub = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.student_id == student.id
        ).first()

        status_val = "Pending — Not Submitted"
        if sub:
            status_val = sub.status

        is_late = now > due_dt
        can_submit = (sub is None) or (a.allow_resubmission and (not is_late or a.allow_late))

        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "subject_name": a.subject.name if a.subject else "",
            "subject_code": a.subject.code if a.subject else "",
            "faculty_name": a.faculty.name if a.faculty else "Faculty",
            "due_date": a.due_date.isoformat(),
            "due_time": a.due_time,
            "due_datetime": due_dt.isoformat(),
            "is_past_deadline": is_late,
            "max_marks": a.max_marks,
            "allowed_file_types": a.allowed_file_types,
            "max_file_size_mb": a.max_file_size_mb,
            "submission_format": a.submission_format,
            "allow_resubmission": a.allow_resubmission,
            "allow_late": a.allow_late,
            "status": status_val,
            "can_submit": can_submit,
            "submission": {
                "id": sub.id,
                "submission_type": sub.submission_type,
                "file_name": sub.file_name,
                "drive_link": sub.drive_link,
                "submitted_at": sub.submitted_at.isoformat(),
                "marks_obtained": sub.marks_obtained,
                "faculty_feedback": sub.faculty_feedback,
                "graded_at": sub.graded_at.isoformat() if sub.graded_at else None
            } if sub else None
        })

    return result


@router.post("/students/me/assignments/{assignment_id}/submit-file")
async def submit_assignment_file(
    assignment_id: int,
    file: UploadFile = File(...),
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Submits an assignment file upload. Validates file extension, size, and deadline.
    Stores the file securely in private server storage and updates submission tracking.
    Immediately cancels pending email reminder alerts!
    """
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.status == "published"
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or closed")

    # Check eligibility
    elig = db.query(models.AssignmentEligibility).filter(
        models.AssignmentEligibility.assignment_id == assignment.id,
        models.AssignmentEligibility.student_id == student.id,
        models.AssignmentEligibility.is_excluded == False
    ).first()

    if not elig:
        raise HTTPException(status_code=403, detail="You are not eligible to submit this assignment")

    # Check format permission
    if assignment.submission_format == "drive_link":
        raise HTTPException(
            status_code=400,
            detail="File uploads are disabled for this assignment. Please provide a Google Drive link."
        )

    # Check deadline
    now = datetime.datetime.utcnow()
    due_dt = datetime.datetime.combine(assignment.due_date, datetime.time(23, 59))
    if assignment.due_time and ":" in assignment.due_time:
        try:
            h, m = map(int, assignment.due_time.split(":")[:2])
            due_dt = datetime.datetime.combine(assignment.due_date, datetime.time(h, m))
        except Exception:
            pass

    is_late = now > due_dt
    if is_late and not assignment.allow_late:
        raise HTTPException(status_code=400, detail="Deadline has passed and late submissions are not allowed")

    # Validate file extension
    ext = Path(file.filename).suffix.lstrip(".").lower()
    allowed_list = [t.strip().lstrip(".").lower() for t in assignment.allowed_file_types.split(",")]
    if ext not in allowed_list:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed types: {assignment.allowed_file_types}"
        )

    # Read and check size
    content = await file.read()
    file_size_bytes = len(content)
    max_bytes = (assignment.max_file_size_mb or 10) * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {assignment.max_file_size_mb} MB"
        )

    # Save to storage
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    clean_orig_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', file.filename)
    stored_name = f"sub_{assignment.id}_std_{student.id}_{timestamp_str}_{clean_orig_name}"
    stored_path = STORAGE_DIR / stored_name

    with open(stored_path, "wb") as f:
        f.write(content)

    # Check existing submission
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment.id,
        models.AssignmentSubmission.student_id == student.id
    ).first()

    status_val = "Late" if is_late else "Submitted"

    if sub:
        if not assignment.allow_resubmission and sub.status != "Returned for Resubmission":
            raise HTTPException(status_code=400, detail="Resubmission is not permitted for this assignment")
        sub.submission_type = "file"
        sub.file_name = file.filename
        sub.file_path = str(stored_path)
        sub.file_size = file_size_bytes
        sub.drive_link = None
        sub.status = status_val
        sub.submitted_at = now
        sub.version = (sub.version or 1) + 1
    else:
        sub = models.AssignmentSubmission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_type="file",
            file_name=file.filename,
            file_path=str(stored_path),
            file_size=file_size_bytes,
            drive_link=None,
            status=status_val,
            submitted_at=now,
            version=1
        )
        db.add(sub)

    # Stop reminders immediately!
    elig.next_reminder_at = None
    db.commit()

    return {
        "status": "success",
        "message": f"Assignment submitted successfully ({status_val})!",
        "submission_id": sub.id,
        "file_name": file.filename,
        "submitted_at": now.isoformat()
    }


@router.post("/students/me/assignments/{assignment_id}/submit-drive")
def submit_assignment_drive_link(
    assignment_id: int,
    payload: schemas.DriveSubmissionRequest,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Submits a Google Drive URL for an assignment.
    Validates URL format and student's access confirmation.
    Immediately stops automated hourly reminder alerts.
    """
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.status == "published"
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or closed")

    elig = db.query(models.AssignmentEligibility).filter(
        models.AssignmentEligibility.assignment_id == assignment.id,
        models.AssignmentEligibility.student_id == student.id,
        models.AssignmentEligibility.is_excluded == False
    ).first()

    if not elig:
        raise HTTPException(status_code=403, detail="You are not eligible to submit this assignment")

    if assignment.submission_format == "file":
        raise HTTPException(
            status_code=400,
            detail="Google Drive submissions are disabled for this assignment. Please upload a file."
        )

    # Validate Google Drive URL pattern
    url = payload.drive_link.strip()
    if not (url.startswith("https://drive.google.com/") or url.startswith("https://docs.google.com/")):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL format. Please provide a valid Google Drive or Google Docs URL starting with https://drive.google.com/ or https://docs.google.com/"
        )

    if not payload.confirmed_access_granted:
        raise HTTPException(
            status_code=400,
            detail="You must confirm that you have granted sharing permission to your faculty member."
        )

    now = datetime.datetime.utcnow()
    due_dt = datetime.datetime.combine(assignment.due_date, datetime.time(23, 59))
    if assignment.due_time and ":" in assignment.due_time:
        try:
            h, m = map(int, assignment.due_time.split(":")[:2])
            due_dt = datetime.datetime.combine(assignment.due_date, datetime.time(h, m))
        except Exception:
            pass

    is_late = now > due_dt
    if is_late and not assignment.allow_late:
        raise HTTPException(status_code=400, detail="Deadline has passed and late submissions are not allowed")

    status_val = "Late" if is_late else "Submitted"

    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment.id,
        models.AssignmentSubmission.student_id == student.id
    ).first()

    if sub:
        if not assignment.allow_resubmission and sub.status != "Returned for Resubmission":
            raise HTTPException(status_code=400, detail="Resubmission is not permitted for this assignment")
        sub.submission_type = "drive_link"
        sub.drive_link = url
        sub.file_name = None
        sub.file_path = None
        sub.file_size = None
        sub.status = status_val
        sub.submitted_at = now
        sub.version = (sub.version or 1) + 1
    else:
        sub = models.AssignmentSubmission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_type="drive_link",
            drive_link=url,
            status=status_val,
            submitted_at=now,
            version=1
        )
        db.add(sub)

    # Stop reminders immediately!
    elig.next_reminder_at = None
    db.commit()

    return {
        "status": "success",
        "message": f"Google Drive link recorded successfully ({status_val})!",
        "drive_link": url,
        "submitted_at": now.isoformat()
    }
