import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, get_password_hash
from app.attendance_service import (
    get_student_overall_stats,
    calculate_recovery_classes,
    get_risk_status
)
from app.email_service import (
    send_parent_attendance_email,
    generate_attendance_email_content,
    test_smtp_connection,
    get_effective_smtp_config
)
from app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

def get_logged_in_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Current user is not an administrator"
        )
    return current_user

# 1. Dashboard Stats
@router.get("/dashboard-stats")
def get_dashboard_stats(admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    total_students = db.query(models.Student).count()
    total_faculty = db.query(models.Faculty).count()
    
    # Calculate average attendance and students below 75%
    students = db.query(models.Student).all()
    pct_sum = 0.0
    below_75_count = 0
    for s in students:
        _, _, pct, _, _ = get_student_overall_stats(db, s.id)
        pct_sum += pct
        if pct < settings.SAFE_THRESHOLD:
            below_75_count += 1
            
    avg_attendance = round(pct_sum / total_students, 2) if total_students > 0 else 0.0

    today = datetime.date.today()
    upcoming_exams_count = db.query(models.Exam).filter(models.Exam.date >= today).count()

    # Fee metrics
    fee_records = db.query(models.FeeRecord).all()
    total_fee_sum = sum(f.total_amount for f in fee_records)
    paid_fee_sum = sum(f.paid_amount for f in fee_records)
    pending_fee_sum = total_fee_sum - paid_fee_sum

    # Department breakdown
    depts = db.query(models.Department).all()
    dept_stats = []
    for d in depts:
        d_students = db.query(models.Student).filter(models.Student.department_id == d.id).count()
        d_faculty = db.query(models.Faculty).filter(models.Faculty.department_id == d.id).count()
        dept_stats.append({
            "name": d.name,
            "code": d.code,
            "students": d_students,
            "faculty": d_faculty
        })

    # Recent Alerts
    recent_alerts = db.query(models.AttendanceAlert).order_by(models.AttendanceAlert.sent_at.desc()).limit(5).all()
    alerts_list = [
        {
            "id": a.id,
            "student_name": a.student.name if a.student else "Student",
            "reg_no": a.student.reg_no if a.student else "",
            "attendance_pct": a.attendance_pct,
            "parent_email": a.parent_email,
            "status": a.status,
            "sent_at": a.sent_at.isoformat()
        }
        for a in recent_alerts
    ]

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "average_attendance": avg_attendance,
        "students_below_75": below_75_count,
        "upcoming_exams": upcoming_exams_count,
        "pending_fees": pending_fee_sum,
        "total_fees": total_fee_sum,
        "paid_fees": paid_fee_sum,
        "department_breakdown": dept_stats,
        "recent_alerts": alerts_list
    }

# 2. Student Management (CRUD)
@router.get("/students")
def get_all_students(admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    students = db.query(models.Student).all()
    res = []
    for s in students:
        att, tot, pct, status_val, rec = get_student_overall_stats(db, s.id)
        res.append({
            "id": s.id,
            "user_id": s.user_id,
            "reg_no": s.reg_no,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else "",
            "semester": s.semester,
            "section": s.section,
            "parent_name": s.parent_name,
            "parent_email": s.parent_email,
            "address": s.address,
            "overall_attendance": pct,
            "attended_classes": att,
            "total_classes": tot,
            "risk_level": status_val,
            "recovery_classes": rec
        })
    return res

@router.post("/students")
def create_student(payload: schemas.StudentCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    # Check duplicate email or reg_no
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    if db.query(models.Student).filter(models.Student.reg_no == payload.reg_no).first():
        raise HTTPException(status_code=400, detail="Student with this Register Number already exists")

    # Create User
    user = models.User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password or "student123"),
        role="student",
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create Student
    student = models.Student(
        user_id=user.id,
        reg_no=payload.reg_no,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        department_id=payload.department_id,
        semester=payload.semester,
        section=payload.section,
        parent_name=payload.parent_name,
        parent_email=payload.parent_email,
        address=payload.address
    )
    db.add(student)
    db.commit()

    return {"status": "success", "message": "Student created successfully", "id": student.id}

@router.put("/students/{student_id}")
def update_student(student_id: int, payload: schemas.StudentUpdate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_dict = payload.dict(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(student, k, v)
    
    if payload.email and payload.email != student.email:
        student.user.email = payload.email

    db.commit()
    return {"status": "success", "message": "Student updated successfully"}

@router.delete("/students/{student_id}")
def delete_student(student_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    user = student.user
    db.delete(student)
    if user:
        db.delete(user)
    db.commit()
    return {"status": "success", "message": "Student deleted successfully"}

# 3. Faculty Management (CRUD)
@router.get("/faculty")
def get_all_faculty(admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    faculty_members = db.query(models.Faculty).all()
    return [
        {
            "id": f.id,
            "emp_id": f.emp_id,
            "name": f.name,
            "email": f.email,
            "phone": f.phone,
            "department_id": f.department_id,
            "department_name": f.department.name if f.department else "",
            "designation": f.designation
        }
        for f in faculty_members
    ]

@router.post("/faculty")
def create_faculty(payload: schemas.FacultyCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    if db.query(models.Faculty).filter(models.Faculty.emp_id == payload.emp_id).first():
        raise HTTPException(status_code=400, detail="Faculty with this Employee ID already exists")

    user = models.User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password or "faculty123"),
        role="faculty",
        is_active=True
    )
    db.add(user)
    db.flush()

    faculty = models.Faculty(
        user_id=user.id,
        emp_id=payload.emp_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        department_id=payload.department_id,
        designation=payload.designation
    )
    db.add(faculty)
    db.commit()

    return {"status": "success", "message": "Faculty created successfully", "id": faculty.id}

@router.put("/faculty/{faculty_id}")
def update_faculty(faculty_id: int, payload: schemas.FacultyUpdate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    update_dict = payload.dict(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(faculty, k, v)
    
    if payload.email and payload.email != faculty.email:
        faculty.user.email = payload.email

    db.commit()
    return {"status": "success", "message": "Faculty updated successfully"}

@router.delete("/faculty/{faculty_id}")
def delete_faculty(faculty_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    user = faculty.user
    db.delete(faculty)
    if user:
        db.delete(user)
    db.commit()
    return {"status": "success", "message": "Faculty deleted successfully"}

# 4. Departments
@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(models.Department).all()
    return [{"id": d.id, "code": d.code, "name": d.name} for d in depts]

@router.post("/departments")
def create_department(payload: schemas.DepartmentCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    d = models.Department(code=payload.code.strip().upper(), name=payload.name.strip())
    db.add(d)
    db.commit()
    return {"status": "success", "message": "Department created", "id": d.id}

@router.put("/departments/{dept_id}")
def update_department(dept_id: int, payload: schemas.DepartmentUpdate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    d = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Department not found")
    if payload.code:
        d.code = payload.code.strip().upper()
    if payload.name:
        d.name = payload.name.strip()
    db.commit()
    return {"status": "success", "message": "Department updated successfully"}

@router.delete("/departments/{dept_id}")
def delete_department(dept_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    d = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Department not found")
    student_count = db.query(models.Student).filter(models.Student.department_id == dept_id).count()
    if student_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete department with {student_count} enrolled students. Reassign students first.")
    db.delete(d)
    db.commit()
    return {"status": "success", "message": "Department deleted"}

# 5. Subjects
@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    subs = db.query(models.Subject).all()
    return [
        {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else "",
            "semester": s.semester,
            "credits": s.credits,
            "faculty_id": s.faculty_id,
            "faculty_name": s.faculty.name if s.faculty else "Unassigned"
        }
        for s in subs
    ]

@router.post("/subjects")
def create_subject(payload: schemas.SubjectCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    sub = models.Subject(
        code=payload.code.strip().upper(),
        name=payload.name.strip(),
        department_id=payload.department_id,
        semester=payload.semester,
        credits=payload.credits,
        faculty_id=payload.faculty_id
    )
    db.add(sub)
    db.commit()
    return {"status": "success", "message": "Subject created", "id": sub.id}

@router.put("/subjects/{subject_id}")
def update_subject(subject_id: int, payload: schemas.SubjectUpdate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    s = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    if payload.code:
        s.code = payload.code.strip().upper()
    if payload.name:
        s.name = payload.name.strip()
    if payload.department_id is not None:
        s.department_id = payload.department_id
    if payload.semester is not None:
        s.semester = payload.semester
    if payload.credits is not None:
        s.credits = payload.credits
    if payload.faculty_id is not None:
        s.faculty_id = payload.faculty_id
    db.commit()
    return {"status": "success", "message": "Subject updated successfully"}

@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    s = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(s)
    db.commit()
    return {"status": "success", "message": "Subject deleted"}

# 6. Timetable
@router.get("/timetable")
def get_all_timetable(db: Session = Depends(get_db)):
    entries = db.query(models.TimetableEntry).all()
    return [
        {
            "id": e.id,
            "day_of_week": e.day_of_week,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "subject_id": e.subject_id,
            "subject_name": e.subject.name if e.subject else "",
            "subject_code": e.subject.code if e.subject else "",
            "faculty_id": e.faculty_id,
            "faculty_name": e.faculty.name if e.faculty else "",
            "room": e.room,
            "department_id": e.department_id,
            "department_name": e.subject.department.name if e.subject and e.subject.department else "",
            "semester": e.semester,
            "section": e.section
        }
        for e in entries
    ]

@router.post("/timetable")
def create_timetable_entry(payload: schemas.TimetableCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    t = models.TimetableEntry(**payload.dict())
    db.add(t)
    db.commit()
    return {"status": "success", "message": "Timetable entry created", "id": t.id}

@router.delete("/timetable/{entry_id}")
def delete_timetable_entry(entry_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    t = db.query(models.TimetableEntry).filter(models.TimetableEntry.id == entry_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    db.delete(t)
    db.commit()
    return {"status": "success", "message": "Timetable entry deleted"}

# 7. Exams
@router.get("/exams")
def get_all_exams(db: Session = Depends(get_db)):
    exams = db.query(models.Exam).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "subject_id": e.subject_id,
            "subject_name": e.subject.name if e.subject else "",
            "subject_code": e.subject.code if e.subject else "",
            "date": e.date.isoformat(),
            "start_time": e.start_time,
            "end_time": e.end_time,
            "venue": e.venue,
            "department_id": e.department_id,
            "semester": e.semester
        }
        for e in exams
    ]

@router.post("/exams")
def create_exam(payload: schemas.ExamCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    e = models.Exam(**payload.dict())
    db.add(e)
    db.commit()
    return {"status": "success", "message": "Exam scheduled", "id": e.id}

@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    e = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(e)
    db.commit()
    return {"status": "success", "message": "Exam deleted"}

# 8. Fees
@router.get("/fees")
def get_all_fees(db: Session = Depends(get_db)):
    fees = db.query(models.FeeRecord).all()
    return [
        {
            "id": f.id,
            "student_id": f.student_id,
            "student_name": f.student.name if f.student else "",
            "reg_no": f.student.reg_no if f.student else "",
            "title": f.title,
            "total_amount": f.total_amount,
            "paid_amount": f.paid_amount,
            "pending_amount": f.total_amount - f.paid_amount,
            "due_date": f.due_date.isoformat(),
            "status": f.status
        }
        for f in fees
    ]

@router.post("/fees")
def create_fee(payload: schemas.FeeCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    f = models.FeeRecord(**payload.dict())
    db.add(f)
    db.commit()
    return {"status": "success", "message": "Fee record added", "id": f.id}

@router.put("/fees/{fee_id}")
def update_fee(fee_id: int, payload: Dict[str, Any] = Body(...), admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    f = db.query(models.FeeRecord).filter(models.FeeRecord.id == fee_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fee record not found")
    if "paid_amount" in payload:
        f.paid_amount = float(payload["paid_amount"])
        if f.paid_amount >= f.total_amount:
            f.status = "Paid"
        elif f.paid_amount > 0:
            f.status = "Partially Paid"
        else:
            f.status = "Pending"
    if "status" in payload:
        f.status = payload["status"]
    db.commit()
    return {"status": "success", "message": "Fee record updated"}

# 9. Placements
@router.get("/placements")
def get_all_placements(db: Session = Depends(get_db)):
    placements = db.query(models.Placement).order_by(models.Placement.deadline.asc()).all()
    return [
        {
            "id": p.id,
            "company": p.company,
            "role": p.role,
            "package_lpa": p.package_lpa,
            "eligibility": p.eligibility,
            "deadline": p.deadline.isoformat(),
            "description": p.description,
            "created_at": p.created_at.isoformat()
        }
        for p in placements
    ]

@router.post("/placements")
def create_placement(payload: schemas.PlacementCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    p = models.Placement(**payload.dict())
    db.add(p)
    db.commit()
    return {"status": "success", "message": "Placement opportunity posted", "id": p.id}

@router.delete("/placements/{placement_id}")
def delete_placement(placement_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    p = db.query(models.Placement).filter(models.Placement.id == placement_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Placement not found")
    db.delete(p)
    db.commit()
    return {"status": "success", "message": "Placement deleted"}

# 10. Notifications
@router.get("/notifications")
def get_all_notifications(db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "user_id": n.user_id,
            "created_at": n.created_at.isoformat()
        }
        for n in notifs
    ]

@router.post("/notifications")
def create_notification(payload: schemas.NotificationCreate, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    n = models.Notification(**payload.dict())
    db.add(n)
    db.commit()
    return {"status": "success", "message": "Notification broadcast", "id": n.id}

# 11. Attendance Alert Center
@router.get("/attendance-alerts")
def get_attendance_alert_center(admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    """
    Returns all students with attendance below 75% along with their last alert status,
    plus the complete alert log history.
    """
    students = db.query(models.Student).all()
    below_75_students = []

    for s in students:
        att, tot, pct, status_val, rec = get_student_overall_stats(db, s.id)
        if pct < settings.SAFE_THRESHOLD:
            # Find latest alert if any
            latest_alert = db.query(models.AttendanceAlert).filter(
                models.AttendanceAlert.student_id == s.id
            ).order_by(models.AttendanceAlert.sent_at.desc()).first()

            below_75_students.append({
                "student_id": s.id,
                "name": s.name,
                "reg_no": s.reg_no,
                "department": s.department.name if s.department else "",
                "attendance_pct": pct,
                "attended_classes": att,
                "total_classes": tot,
                "risk_level": status_val,
                "parent_name": s.parent_name,
                "parent_email": s.parent_email,
                "recovery_classes": rec,
                "last_alert_id": latest_alert.id if latest_alert else None,
                "last_alert_date": latest_alert.sent_at.isoformat() if latest_alert else "Never",
                "last_alert_status": latest_alert.status if latest_alert else "Pending Dispatch",
                "email_preview": latest_alert.email_preview if latest_alert else None
            })

    # Alert log history
    alert_logs = db.query(models.AttendanceAlert).order_by(models.AttendanceAlert.sent_at.desc()).all()
    logs_data = [
        {
            "id": a.id,
            "student_id": a.student_id,
            "student_name": a.student.name if a.student else "Unknown",
            "reg_no": a.student.reg_no if a.student else "",
            "department": a.student.department.name if a.student and a.student.department else "",
            "attendance_pct": a.attendance_pct,
            "parent_email": a.parent_email,
            "alert_type": a.alert_type,
            "sent_at": a.sent_at.isoformat(),
            "status": a.status,
            "recovery_classes": a.recovery_classes,
            "email_preview": a.email_preview
        }
        for a in alert_logs
    ]

    return {
        "below_75_students": below_75_students,
        "alert_logs": logs_data,
        "safe_threshold": settings.SAFE_THRESHOLD,
        "warning_threshold": settings.WARNING_THRESHOLD,
        "smtp_configured": bool(settings.SMTP_HOST and settings.SMTP_USERNAME)
    }

@router.post("/attendance-alerts/test")
def trigger_test_alert(
    student_id: int = Body(..., embed=True),
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    """
    Safe demo/testing mechanism to manually trigger an attendance alert without
    requiring the attendance to actually change.
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    att, tot, pct, status_val, rec = get_student_overall_stats(db, student.id)

    email_result = send_parent_attendance_email(
        parent_email=student.parent_email,
        student_name=student.name,
        reg_no=student.reg_no,
        department_name=student.department.name if student.department else "CSE",
        attendance_pct=pct,
        recovery_classes=rec,
        parent_name=student.parent_name
    )

    alert_rec = models.AttendanceAlert(
        student_id=student.id,
        attendance_pct=pct,
        parent_email=student.parent_email,
        alert_type="Admin Test Trigger",
        sent_at=datetime.datetime.utcnow(),
        status=email_result["status"],
        recovery_classes=rec,
        email_preview=email_result["preview"]
    )
    db.add(alert_rec)

    # In-app notification for student
    notif = models.Notification(
        user_id=student.user_id,
        title="⚠️ Attendance Alert (Test Dispatched)",
        message=f"An attendance notification was dispatched to your parent ({student.parent_email}) with your current attendance of {pct}%. You need {rec} more consecutive classes to reach 75%.",
        type="Attendance Alert",
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    return {
        "status": "success",
        "message": f"Test alert executed for {student.name} ({student.reg_no}). Email status: {email_result['status']}",
        "email_status": email_result["status"],
        "email_preview": email_result["preview"],
        "subject": email_result["subject"]
    }

@router.get("/attendance-alerts/{alert_id}/preview")
def get_alert_email_preview(alert_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    alert = db.query(models.AttendanceAlert).filter(models.AttendanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")
    return {
        "id": alert.id,
        "student_name": alert.student.name if alert.student else "",
        "reg_no": alert.student.reg_no if alert.student else "",
        "parent_email": alert.parent_email,
        "sent_at": alert.sent_at.isoformat(),
        "status": alert.status,
        "email_preview": alert.email_preview
    }

@router.post("/attendance-alerts/{alert_id}/retry")
def retry_attendance_alert(alert_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    alert = db.query(models.AttendanceAlert).filter(models.AttendanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")
    student = alert.student
    if not student:
        raise HTTPException(status_code=400, detail="Student record associated with this alert no longer exists")

    dept_name = student.department.name if student.department else "Department"
    att, tot, pct, _, rec = get_student_overall_stats(db, student.id)

    email_res = send_parent_attendance_email(
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

    alert.status = email_res["status"]
    alert.last_error = email_res.get("error")
    alert.email_preview = email_res.get("preview")
    alert.sent_at = datetime.datetime.utcnow()
    alert.attempt_count = (alert.attempt_count or 1) + 1
    db.commit()

    return {
        "status": "success",
        "message": f"Alert retry executed. Delivery status: {email_res['status']}",
        "email_status": email_res["status"],
        "attempt_count": alert.attempt_count,
        "last_error": alert.last_error
    }

@router.post("/attendance-alerts/retry-all-failed")
def retry_all_failed_alerts(admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    failed_alerts = db.query(models.AttendanceAlert).filter(
        models.AttendanceAlert.status.in_(["Failed", "Email Not Configured"])
    ).all()

    retried_count = 0
    success_count = 0

    for alert in failed_alerts:
        student = alert.student
        if not student:
            continue
        dept_name = student.department.name if student.department else "Department"
        att, tot, pct, _, rec = get_student_overall_stats(db, student.id)
        email_res = send_parent_attendance_email(
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
        alert.status = email_res["status"]
        alert.last_error = email_res.get("error")
        alert.email_preview = email_res.get("preview")
        alert.sent_at = datetime.datetime.utcnow()
        alert.attempt_count = (alert.attempt_count or 1) + 1
        retried_count += 1
        if email_res["status"] == "Sent":
            success_count += 1

    db.commit()
    return {
        "status": "success",
        "message": f"Retried {retried_count} alerts. Successfully dispatched: {success_count}.",
        "retried_count": retried_count,
        "success_count": success_count
    }

# 12. Settings
@router.get("/settings")
def get_settings(admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    settings_records = db.query(models.SystemSetting).all()
    res = {s.key: s.value for s in settings_records}
    res["SMTP_HOST"] = settings.SMTP_HOST or "Not Configured (Demo Mode Active)"
    res["SMTP_PORT"] = str(settings.SMTP_PORT)
    res["SMTP_USERNAME"] = settings.SMTP_USERNAME or "Not Configured"
    res["SMTP_FROM_EMAIL"] = settings.SMTP_FROM_EMAIL
    res["SAFE_THRESHOLD"] = str(settings.SAFE_THRESHOLD)
    res["WARNING_THRESHOLD"] = str(settings.WARNING_THRESHOLD)
    return res

@router.put("/settings")
def update_settings(payload: Dict[str, str], admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    for k, v in payload.items():
        s = db.query(models.SystemSetting).filter(models.SystemSetting.key == k).first()
        if s:
            s.value = v
        else:
            db.add(models.SystemSetting(key=k, value=v))
    db.commit()
    return {"status": "success", "message": "Settings updated"}

@router.post("/settings/test-smtp")
def test_smtp_endpoint(
    payload: schemas.TestSMTPRequest = Body(...),
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    target_email = payload.to_email.strip() if payload.to_email else admin.email
    result = test_smtp_connection(to_email=target_email, db=db)
    return result

# 13. Complaints / Grievance Management
@router.get("/complaints")
def get_all_complaints(
    status_filter: Optional[str] = Query("All"),
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    query = db.query(models.Complaint)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(models.Complaint.status.ilike(status_filter))
    complaints = query.order_by(models.Complaint.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "student_id": c.student_id,
            "student_name": c.student.name if c.student else "Student",
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

@router.put("/complaints/{complaint_id}")
def update_complaint_status(
    complaint_id: int,
    payload: schemas.ComplaintUpdate,
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    c.status = payload.status
    if payload.response:
        c.response = payload.response
    c.resolved_by = admin.id
    c.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Complaint updated"}

@router.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(c)
    db.commit()
    return {"status": "success", "message": "Complaint deleted"}

# 14. Assignments
@router.get("/assignments")
def get_all_assignments(admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    assignments = db.query(models.Assignment).order_by(models.Assignment.due_date.desc()).all()
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
            "faculty_name": a.faculty.name if a.faculty else "Faculty",
            "created_at": a.created_at.isoformat()
        }
        for a in assignments
    ]

@router.post("/assignments")
def admin_create_assignment(
    payload: schemas.AssignmentCreate,
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    a = models.Assignment(**payload.dict())
    db.add(a)
    db.commit()
    return {"status": "success", "message": "Assignment created", "id": a.id}

@router.delete("/assignments/{assignment_id}")
def admin_delete_assignment(assignment_id: int, admin: models.User = Depends(get_logged_in_admin), db: Session = Depends(get_db)):
    a = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(a)
    db.commit()
    return {"status": "success", "message": "Assignment deleted"}
