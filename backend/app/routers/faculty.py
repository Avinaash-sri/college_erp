import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db, SessionLocal
from app import models, schemas
from app.auth import get_current_user
from app.attendance_service import (
    get_student_overall_stats,
    calculate_recovery_classes,
    get_risk_status,
    check_attendance_alert_eligibility
)
from app.email_service import send_parent_attendance_email
from app.config import settings

logger = logging.getLogger("erp_faculty")

router = APIRouter(prefix="/faculty", tags=["Faculty Portal"])

def get_logged_in_faculty(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> models.Faculty:
    if current_user.role != "faculty" or not current_user.faculty_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Current user is not an active faculty member"
        )
    return current_user.faculty_profile

@router.get("/me")
def get_faculty_profile(faculty: models.Faculty = Depends(get_logged_in_faculty)):
    return {
        "id": faculty.id,
        "name": faculty.name,
        "emp_id": faculty.emp_id,
        "email": faculty.email,
        "phone": faculty.phone,
        "department_id": faculty.department_id,
        "department_name": faculty.department.name if faculty.department else "",
        "designation": faculty.designation
    }

@router.get("/dashboard")
def get_faculty_dashboard(faculty: models.Faculty = Depends(get_logged_in_faculty), db: Session = Depends(get_db)):
    # Subjects handled
    subjects = db.query(models.Subject).filter(models.Subject.faculty_id == faculty.id).all()
    subjects_count = len(subjects)

    # Today's classes
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_idx = datetime.date.today().weekday()
    current_day = days[today_idx] if today_idx < 5 else "Monday"

    today_classes = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.faculty_id == faculty.id,
        models.TimetableEntry.day_of_week == current_day
    ).order_by(models.TimetableEntry.start_time).all()

    today_classes_list = [
        {
            "id": t.id,
            "subject_code": t.subject.code,
            "subject_name": t.subject.name,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "room": t.room,
            "semester": t.semester,
            "section": t.section
        }
        for t in today_classes
    ]

    # Department students count and at-risk students count
    dept_students = db.query(models.Student).filter(models.Student.department_id == faculty.department_id).all()
    at_risk_count = 0
    for s in dept_students:
        _, _, pct, _, _ = get_student_overall_stats(db, s.id)
        if pct < settings.SAFE_THRESHOLD:
            at_risk_count += 1

    # Announcements
    notifs = db.query(models.Notification).order_by(models.Notification.created_at.desc()).limit(4).all()
    announcements_list = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "created_at": n.created_at.isoformat()
        }
        for n in notifs
    ]

    return {
        "faculty": {
            "name": faculty.name,
            "emp_id": faculty.emp_id,
            "designation": faculty.designation,
            "department": faculty.department.name if faculty.department else ""
        },
        "subjects_handled": subjects_count,
        "today_classes_count": len(today_classes_list),
        "students_at_risk_count": at_risk_count,
        "total_dept_students": len(dept_students),
        "today_classes": today_classes_list,
        "current_day": current_day,
        "recent_announcements": announcements_list
    }

@router.get("/subjects")
def get_faculty_subjects(faculty: models.Faculty = Depends(get_logged_in_faculty), db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).filter(models.Subject.faculty_id == faculty.id).all()
    return [
        {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "semester": s.semester,
            "credits": s.credits,
            "department_name": s.department.name if s.department else ""
        }
        for s in subjects
    ]

@router.get("/students")
def get_faculty_students(
    risk_filter: Optional[str] = Query("All"),  # 'All', 'Safe', 'Warning', 'High Risk'
    subject_id: Optional[int] = None,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    students = db.query(models.Student).filter(models.Student.department_id == faculty.department_id).all()

    results = []
    for s in students:
        overall_att, overall_tot, overall_pct, overall_status, overall_rec = get_student_overall_stats(db, s.id)

        # Apply filter
        if risk_filter and risk_filter.upper() != "ALL":
            if overall_status.upper() != risk_filter.upper():
                continue

        # Subject specific attendance if requested
        sub_pct = overall_pct
        if subject_id:
            sub_recs = db.query(models.AttendanceRecord).filter(
                models.AttendanceRecord.student_id == s.id,
                models.AttendanceRecord.subject_id == subject_id
            ).all()
            if sub_recs:
                s_att = sum(1 for r in sub_recs if r.status == "Present")
                sub_pct = round((s_att / len(sub_recs)) * 100, 2)

        # Fetch internal marks for faculty subjects
        marks_records = db.query(models.Mark).filter(models.Mark.student_id == s.id).all()
        marks_summary = [
            {
                "subject_code": m.subject.code,
                "total": m.total,
                "grade": m.grade
            }
            for m in marks_records
        ]

        results.append({
            "id": s.id,
            "reg_no": s.reg_no,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "semester": s.semester,
            "section": s.section,
            "parent_name": s.parent_name,
            "parent_email": s.parent_email,
            "overall_attendance": overall_pct,
            "subject_attendance": sub_pct,
            "risk_status": overall_status,
            "recovery_classes": overall_rec,
            "marks": marks_summary
        })

    return results

@router.get("/attendance/session")
def get_session_attendance(
    subject_id: int,
    date_val: datetime.date = Query(..., alias="date"),
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    # Verify subject belongs to faculty
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    students = db.query(models.Student).filter(
        models.Student.department_id == subject.department_id,
        models.Student.semester == subject.semester
    ).order_by(models.Student.reg_no).all()

    existing_records = {
        r.student_id: r.status
        for r in db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.subject_id == subject_id,
            models.AttendanceRecord.date == date_val
        ).all()
    }

    students_data = []
    for s in students:
        curr_status = existing_records.get(s.id, "Present")
        _, _, pct, risk, rec = get_student_overall_stats(db, s.id)
        students_data.append({
            "student_id": s.id,
            "reg_no": s.reg_no,
            "name": s.name,
            "status": curr_status,
            "overall_attendance": pct,
            "risk_status": risk,
            "recovery_classes": rec
        })

    return {
        "subject": {"id": subject.id, "name": subject.name, "code": subject.code},
        "date": date_val.isoformat(),
        "students": students_data
    }

def dispatch_parent_email_alert(alert_id: int):
    """
    Background task to dispatch SMTP email and record attempt result.
    """
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        alert = db.query(models.AttendanceAlert).filter(models.AttendanceAlert.id == alert_id).first()
        if not alert or not alert.student:
            return
        student = alert.student
        dept_name = student.department.name if student.department else "Department"
        att, tot, pct, _, rec = get_student_overall_stats(db, student.id)
        res = send_parent_attendance_email(
            parent_email=alert.parent_email,
            student_name=student.name,
            reg_no=student.reg_no,
            department_name=dept_name,
            attendance_pct=pct,
            recovery_classes=rec,
            parent_name=student.parent_name,
            semester=student.semester,
            attended_sessions=att,
            total_sessions=tot,
            db=db
        )
        alert.status = res["status"]
        alert.last_error = res.get("error")
        alert.email_preview = res.get("preview")
        alert.sent_at = datetime.datetime.utcnow()
        db.commit()
    except Exception as e:
        logger.error(f"Error in background email dispatch: {e}")
    finally:
        db.close()

@router.post("/attendance")
def save_attendance(
    payload: schemas.AttendanceBatchCreate,
    background_tasks: BackgroundTasks,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    subject = db.query(models.Subject).filter(models.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    alerts_triggered = []

    for item in payload.records:
        student = db.query(models.Student).filter(models.Student.id == item.student_id).first()
        if not student:
            continue

        # 1. Calculate previous attendance percentage
        _, _, prior_pct, _, _ = get_student_overall_stats(db, student.id)

        # 2. Check if attendance record exists for this date and subject
        existing = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.student_id == item.student_id,
            models.AttendanceRecord.subject_id == payload.subject_id,
            models.AttendanceRecord.date == payload.date
        ).first()

        if existing:
            existing.status = item.status
            existing.session_name = payload.session_name
            existing.marked_by = faculty.id
        else:
            rec = models.AttendanceRecord(
                student_id=item.student_id,
                subject_id=payload.subject_id,
                date=payload.date,
                status=item.status,
                session_name=payload.session_name,
                marked_by=faculty.id
            )
            db.add(rec)
        db.flush()

        # 3. Calculate new attendance percentage
        new_att, new_tot, new_pct, new_risk, new_rec = get_student_overall_stats(db, student.id)

        # 4. Check eligibility with deduplication policy
        is_eligible, reason = check_attendance_alert_eligibility(
            db=db,
            student_id=student.id,
            prior_pct=prior_pct,
            new_pct=new_pct,
            total_sessions=new_tot
        )

        if is_eligible:
            # Check parent email
            parent_contact = db.query(models.ParentContact).filter(
                models.ParentContact.student_id == student.id,
                models.ParentContact.is_primary == True
            ).first()
            parent_email = (parent_contact.email if parent_contact and parent_contact.email else student.parent_email or "").strip()
            parent_name = parent_contact.name if parent_contact and parent_contact.name else student.parent_name

            if not parent_email or "@" not in parent_email:
                # Log blocked alert
                alert_rec = models.AttendanceAlert(
                    student_id=student.id,
                    attendance_pct=new_pct,
                    parent_email="MISSING_EMAIL",
                    alert_type=reason,
                    sent_at=datetime.datetime.utcnow(),
                    status="Blocked",
                    attempt_count=1,
                    recovery_classes=new_rec,
                    last_error="Blocked: Missing or invalid parent recipient email address",
                    email_preview=None
                )
                db.add(alert_rec)
                alerts_triggered.append({
                    "student_name": student.name,
                    "reg_no": student.reg_no,
                    "new_pct": new_pct,
                    "email_status": "Blocked",
                    "reason": "Missing parent email"
                })
            else:
                from app.email_service import get_effective_smtp_config, generate_attendance_email_content
                smtp_cfg = get_effective_smtp_config(db)
                email_content = generate_attendance_email_content(
                    student_name=student.name,
                    reg_no=student.reg_no,
                    department_name=student.department.name if student.department else "CSE",
                    attendance_pct=new_pct,
                    recovery_classes=new_rec,
                    parent_name=parent_name,
                    semester=student.semester,
                    attended_sessions=new_att,
                    total_sessions=new_tot,
                    required_pct=settings.SAFE_THRESHOLD
                )

                initial_status = "Pending Dispatch" if smtp_cfg["is_configured"] else "Email Not Configured"
                last_err = None if smtp_cfg["is_configured"] else "SMTP credentials not configured"

                alert_rec = models.AttendanceAlert(
                    student_id=student.id,
                    attendance_pct=new_pct,
                    parent_email=parent_email,
                    alert_type=reason,
                    sent_at=datetime.datetime.utcnow(),
                    status=initial_status,
                    attempt_count=1,
                    recovery_classes=new_rec,
                    last_error=last_err,
                    email_preview=email_content["html"]
                )
                db.add(alert_rec)
                db.flush()

                if smtp_cfg["is_configured"]:
                    background_tasks.add_task(dispatch_parent_email_alert, alert_rec.id)

                alerts_triggered.append({
                    "student_name": student.name,
                    "reg_no": student.reg_no,
                    "new_pct": new_pct,
                    "email_status": initial_status,
                    "parent_email": parent_email
                })

            # In-app notification for the student
            notif = models.Notification(
                user_id=student.user_id,
                title="⚠️ Attendance Shortage Alert",
                message=f"Your overall attendance dropped to {new_pct}%, which is below the mandatory {settings.SAFE_THRESHOLD}%. You must attend at least {new_rec} consecutive classes without absence to restore safe standing.",
                type="Attendance Alert",
                is_read=False,
                created_at=datetime.datetime.utcnow()
            )
            db.add(notif)

    db.commit()

    return {
        "status": "success",
        "message": f"Attendance successfully recorded for {len(payload.records)} students.",
        "alerts_triggered": alerts_triggered
    }

@router.get("/marks")
def get_marks(subject_id: int, faculty: models.Faculty = Depends(get_logged_in_faculty), db: Session = Depends(get_db)):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    students = db.query(models.Student).filter(
        models.Student.department_id == subject.department_id,
        models.Student.semester == subject.semester
    ).order_by(models.Student.reg_no).all()

    marks_data = []
    for s in students:
        m = db.query(models.Mark).filter(
            models.Mark.student_id == s.id,
            models.Mark.subject_id == subject_id
        ).first()
        marks_data.append({
            "student_id": s.id,
            "reg_no": s.reg_no,
            "name": s.name,
            "internal_1": m.internal_1 if m else 0.0,
            "internal_2": m.internal_2 if m else 0.0,
            "assignment": m.assignment if m else 0.0,
            "total": m.total if m else 0.0,
            "grade": m.grade if m else "N/A"
        })

    return marks_data

@router.post("/marks")
def update_marks(payload: schemas.MarkCreate, faculty: models.Faculty = Depends(get_logged_in_faculty), db: Session = Depends(get_db)):
    m = db.query(models.Mark).filter(
        models.Mark.student_id == payload.student_id,
        models.Mark.subject_id == payload.subject_id
    ).first()

    total = payload.internal_1 + payload.internal_2 + payload.assignment
    if total >= 50:
        grade = "A+" if total >= 54 else "A"
    elif total >= 40:
        grade = "B"
    elif total >= 30:
        grade = "C"
    else:
        grade = "F"

    if m:
        m.internal_1 = payload.internal_1
        m.internal_2 = payload.internal_2
        m.assignment = payload.assignment
        m.total = total
        m.grade = grade
    else:
        m = models.Mark(
            student_id=payload.student_id,
            subject_id=payload.subject_id,
            internal_1=payload.internal_1,
            internal_2=payload.internal_2,
            assignment=payload.assignment,
            total=total,
            grade=grade
        )
        db.add(m)

    db.commit()
    return {"status": "success", "message": "Marks updated successfully", "total": total, "grade": grade}

@router.get("/timetable")
def get_faculty_timetable(faculty: models.Faculty = Depends(get_logged_in_faculty), db: Session = Depends(get_db)):
    entries = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.faculty_id == faculty.id
    ).order_by(models.TimetableEntry.day_of_week, models.TimetableEntry.start_time).all()

    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    timetable_by_day = {d: [] for d in days_order}

    for e in entries:
        if e.day_of_week in timetable_by_day:
            timetable_by_day[e.day_of_week].append({
                "id": e.id,
                "start_time": e.start_time,
                "end_time": e.end_time,
                "subject_code": e.subject.code,
                "subject_name": e.subject.name,
                "room": e.room,
                "semester": e.semester,
                "section": e.section
            })

    return timetable_by_day

@router.post("/announcements")
def create_announcement(payload: schemas.NotificationCreate, faculty: models.Faculty = Depends(get_logged_in_faculty), db: Session = Depends(get_db)):
    n = models.Notification(
        user_id=None,
        title=f"[{faculty.name}] {payload.title}",
        message=payload.message,
        type=payload.type,
        created_at=datetime.datetime.utcnow()
    )
    db.add(n)
    db.commit()
    return {"status": "success", "message": "Announcement broadcast successfully"}

# Complaints Management for Faculty
@router.get("/complaints")
def get_faculty_complaints(
    status_filter: Optional[str] = Query("All"),
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    query = db.query(models.Complaint).join(models.Student, models.Complaint.student_id == models.Student.id).filter(
        models.Student.department_id == faculty.department_id
    )
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(models.Complaint.status.ilike(status_filter))
    complaints = query.order_by(models.Complaint.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "student_id": c.student_id,
            "student_name": c.student.name if c.student else "",
            "student_reg_no": c.student.reg_no if c.student else "",
            "department_name": c.student.department.name if c.student and c.student.department else "",
            "subject": c.subject,
            "category": c.category,
            "description": c.description,
            "status": c.status,
            "response": c.response,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat() if c.updated_at else c.created_at.isoformat()
        }
        for c in complaints
    ]

@router.put("/complaints/{complaint_id}/respond")
def respond_to_complaint(
    complaint_id: int,
    payload: schemas.ComplaintUpdate,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    c.status = payload.status
    if payload.response:
        c.response = payload.response
    c.resolved_by = faculty.user_id
    c.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Complaint updated successfully"}

# Assignments Management for Faculty
@router.get("/assignments")
def get_faculty_assignments(faculty: models.Faculty = Depends(get_logged_in_faculty), db: Session = Depends(get_db)):
    assignments = db.query(models.Assignment).filter(
        models.Assignment.created_by == faculty.id
    ).order_by(models.Assignment.due_date.desc()).all()
    return [
        {
            "id": a.id,
            "subject_id": a.subject_id,
            "subject_code": a.subject.code if a.subject else "",
            "subject_name": a.subject.name if a.subject else "",
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date.isoformat(),
            "max_marks": a.max_marks,
            "resource_url": a.resource_url,
            "created_at": a.created_at.isoformat()
        }
        for a in assignments
    ]

@router.post("/assignments")
def create_assignment(
    payload: schemas.AssignmentCreate,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    assignment = models.Assignment(
        subject_id=payload.subject_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        max_marks=payload.max_marks,
        resource_url=payload.resource_url,
        created_by=faculty.id
    )
    db.add(assignment)
    db.commit()
    return {"status": "success", "message": "Assignment created successfully", "id": assignment.id}

@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    a = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.created_by == faculty.id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found or unauthorized")
    db.delete(a)
    db.commit()
    return {"status": "success", "message": "Assignment deleted"}
