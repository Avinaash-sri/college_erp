import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.attendance_service import get_student_full_attendance

router = APIRouter(prefix="/students", tags=["Student Portal"])

def get_logged_in_student(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> models.Student:
    if current_user.role != "student" or not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Current user is not an active student"
        )
    return current_user.student_profile

@router.get("/me")
def get_student_profile(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    att_summary = get_student_full_attendance(db, student)
    return {
        "id": student.id,
        "name": student.name,
        "reg_no": student.reg_no,
        "email": student.email,
        "phone": student.phone,
        "department_id": student.department_id,
        "department_name": student.department.name if student.department else "",
        "semester": student.semester,
        "section": student.section,
        "parent_name": student.parent_name,
        "parent_email": student.parent_email,
        "address": student.address,
        "overall_attendance": att_summary["overall_percentage"],
        "risk_status": att_summary["risk_status"],
        "recovery_classes": att_summary["recovery_classes"]
    }

@router.get("/me/dashboard")
def get_student_dashboard(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    att_summary = get_student_full_attendance(db, student)

    # Today's Timetable
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_idx = datetime.date.today().weekday()
    current_day = days[today_idx] if today_idx < 5 else "Monday"

    timetable_entries = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.department_id == student.department_id,
        models.TimetableEntry.semester == student.semester,
        models.TimetableEntry.day_of_week == current_day
    ).order_by(models.TimetableEntry.start_time).all()
    if not timetable_entries:
        timetable_entries = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.day_of_week == current_day
        ).order_by(models.TimetableEntry.start_time).all()

    today_classes = [
        {
            "id": t.id,
            "subject_code": t.subject.code if t.subject else "GEN",
            "subject_name": t.subject.name if t.subject else "Class",
            "faculty_name": t.faculty.name if t.faculty else "",
            "start_time": t.start_time,
            "end_time": t.end_time,
            "room": t.room
        }
        for t in timetable_entries
    ]

    # Upcoming Exams
    today = datetime.date.today()
    upcoming_exams = db.query(models.Exam).filter(
        models.Exam.department_id == student.department_id,
        models.Exam.semester == student.semester,
        models.Exam.date >= today
    ).order_by(models.Exam.date.asc()).limit(3).all()
    if not upcoming_exams:
        upcoming_exams = db.query(models.Exam).filter(
            models.Exam.date >= today
        ).order_by(models.Exam.date.asc()).limit(3).all()

    exams_list = [
        {
            "id": e.id,
            "name": e.name,
            "subject_name": e.subject.name,
            "subject_code": e.subject.code,
            "date": e.date.isoformat(),
            "start_time": e.start_time,
            "end_time": e.end_time,
            "venue": e.venue
        }
        for e in upcoming_exams
    ]

    # Fees
    fee_records = db.query(models.FeeRecord).filter(models.FeeRecord.student_id == student.id).all()
    total_fee = sum(f.total_amount for f in fee_records)
    paid_fee = sum(f.paid_amount for f in fee_records)
    pending_fee = total_fee - paid_fee

    # Recent Notifications
    notifs = db.query(models.Notification).filter(
        (models.Notification.user_id == student.user_id) | (models.Notification.user_id == None)
    ).order_by(models.Notification.created_at.desc()).limit(5).all()

    notifications_list = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifs
    ]

    # Placements
    placements = db.query(models.Placement).order_by(models.Placement.deadline.asc()).limit(3).all()
    placements_list = [
        {
            "id": p.id,
            "company": p.company,
            "role": p.role,
            "package_lpa": p.package_lpa,
            "deadline": p.deadline.isoformat(),
            "eligibility": p.eligibility
        }
        for p in placements
    ]

    return {
        "student": {
            "name": student.name,
            "reg_no": student.reg_no,
            "department": student.department.name if student.department else "",
            "semester": student.semester,
            "section": student.section,
            "cgpa": student.cgpa or 0.0,
        },
        "attendance": {
            "overall_percentage": att_summary["overall_percentage"],
            "total_attended": att_summary["total_attended"],
            "total_conducted": att_summary["total_conducted"],
            "risk_status": att_summary["risk_status"],
            "recovery_classes": att_summary["recovery_classes"],
            "required_percentage": att_summary["required_percentage"]
        },
        "today_classes": today_classes,
        "current_day": current_day,
        "upcoming_exams": exams_list,
        "fees": {
            "total": total_fee,
            "paid": paid_fee,
            "pending": pending_fee
        },
        "recent_notifications": notifications_list,
        "placement_announcements": placements_list
    }

@router.get("/me/attendance", response_model=schemas.StudentAttendanceSummary)
def get_student_attendance(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    return get_student_full_attendance(db, student)

@router.get("/me/timetable")
def get_student_timetable(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    entries = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.department_id == student.department_id,
        models.TimetableEntry.semester == student.semester
    ).order_by(models.TimetableEntry.day_of_week, models.TimetableEntry.start_time).all()
    if not entries:
        entries = db.query(models.TimetableEntry).order_by(models.TimetableEntry.day_of_week, models.TimetableEntry.start_time).all()

    # Group by day
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    timetable_by_day = {d: [] for d in days_order}

    for e in entries:
        if e.day_of_week in timetable_by_day:
            timetable_by_day[e.day_of_week].append({
                "id": e.id,
                "start_time": e.start_time,
                "end_time": e.end_time,
                "subject_code": e.subject.code if e.subject else "GEN",
                "subject_name": e.subject.name if e.subject else "Class",
                "faculty_name": e.faculty.name if e.faculty else "",
                "room": e.room,
                "section": e.section
            })

    return timetable_by_day

@router.get("/me/exams")
def get_student_exams(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    exams = db.query(models.Exam).filter(
        models.Exam.department_id == student.department_id,
        models.Exam.semester == student.semester
    ).order_by(models.Exam.date.asc()).all()
    if not exams:
        exams = db.query(models.Exam).order_by(models.Exam.date.asc()).all()

    return [
        {
            "id": e.id,
            "name": e.name,
            "subject_code": e.subject.code if e.subject else "GEN",
            "subject_name": e.subject.name if e.subject else "Exam",
            "date": e.date.isoformat(),
            "start_time": e.start_time,
            "end_time": e.end_time,
            "venue": e.venue
        }
        for e in exams
    ]

@router.get("/me/marks")
def get_student_marks(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    marks = db.query(models.Mark).filter(models.Mark.student_id == student.id).all()
    return [
        {
            "id": m.id,
            "subject_code": m.subject.code,
            "subject_name": m.subject.name,
            "internal_1": m.internal_1,
            "internal_2": m.internal_2,
            "assignment": m.assignment,
            "total": m.total,
            "grade": m.grade
        }
        for m in marks
    ]

@router.get("/me/fees")
def get_student_fees(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    fees = db.query(models.FeeRecord).filter(models.FeeRecord.student_id == student.id).all()
    total_amt = sum(f.total_amount for f in fees)
    paid_amt = sum(f.paid_amount for f in fees)
    pending_amt = total_amt - paid_amt

    records = [
        {
            "id": f.id,
            "title": f.title,
            "total_amount": f.total_amount,
            "paid_amount": f.paid_amount,
            "pending_amount": f.total_amount - f.paid_amount,
            "due_date": f.due_date.isoformat(),
            "status": f.status
        }
        for f in fees
    ]

    return {
        "summary": {
            "total": total_amt,
            "paid": paid_amt,
            "pending": pending_amt,
            "status": "Paid" if pending_amt <= 0 else ("Partially Paid" if paid_amt > 0 else "Pending")
        },
        "records": records
    }

@router.get("/me/placements")
def get_student_placements(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    placements = db.query(models.Placement).order_by(models.Placement.deadline.asc()).all()
    return [
        {
            "id": p.id,
            "company": p.company,
            "role": p.role,
            "package_lpa": p.package_lpa,
            "eligibility": p.eligibility,
            "deadline": p.deadline.isoformat(),
            "description": p.description
        }
        for p in placements
    ]

@router.get("/me/notifications")
def get_student_notifications(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).filter(
        (models.Notification.user_id == student.user_id) | (models.Notification.user_id == None)
    ).order_by(models.Notification.created_at.desc()).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifs
    ]

@router.put("/me/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}

@router.put("/me/notifications/read-all")
def mark_all_notifications_read(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        (models.Notification.user_id == student.user_id) | (models.Notification.user_id == None)
    ).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}

# Student Profile Edit (phone, address)
@router.put("/me")
def update_student_personal_details(
    payload: dict,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    if "phone" in payload:
        student.phone = payload["phone"]
    if "address" in payload:
        student.address = payload["address"]
    db.commit()
    return {"status": "success", "message": "Profile updated successfully"}

# Student Complaints / Support Tickets
@router.get("/me/complaints")
def get_student_complaints(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    complaints = db.query(models.Complaint).filter(
        models.Complaint.student_id == student.id
    ).order_by(models.Complaint.created_at.desc()).all()

    return [
        {
            "id": c.id,
            "student_id": c.student_id,
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

@router.post("/me/complaints")
def submit_student_complaint(
    payload: schemas.ComplaintCreate,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    complaint = models.Complaint(
        student_id=student.id,
        user_id=student.user_id,
        subject=payload.subject.strip(),
        category=payload.category,
        description=payload.description.strip(),
        status="Open",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(complaint)
    db.commit()
    return {"status": "success", "message": "Grievance ticket submitted successfully", "id": complaint.id}


# Student Leave Requests
@router.get("/leave-requests")
def get_student_leave_requests(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.student_id == student.id
    ).order_by(models.LeaveRequest.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "leave_type": l.leave_type,
            "from_date": l.from_date,
            "to_date": l.to_date,
            "reason": l.reason,
            "status": l.status,
            "faculty_remark": l.faculty_remark,
            "admin_remark": l.admin_remark,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in leaves
    ]

@router.post("/leave-requests")
def create_student_leave_request(
    payload: schemas.LeaveRequestCreate,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    leave = models.LeaveRequest(
        student_id=student.id,
        leave_type=payload.leave_type,
        from_date=payload.from_date,
        to_date=payload.to_date,
        reason=payload.reason.strip(),
        status="Pending",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(leave)
    db.flush()

    # Notify faculty in student's department or all faculty
    faculty_members = db.query(models.Faculty).filter(models.Faculty.department_id == student.department_id).all()
    if not faculty_members:
        faculty_members = db.query(models.Faculty).all()
    for f in faculty_members:
        notif = models.Notification(
            user_id=f.user_id,
            title=f"Leave Request: {student.name}",
            message=f"{student.name} ({student.reg_no}) applied for {payload.leave_type} from {payload.from_date} to {payload.to_date}.",
            type="Leave Application",
            link_url="/faculty/leave",
            is_read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
    db.commit()
    return {"status": "success", "message": "Leave request submitted successfully", "id": leave.id}


# Student Study Materials
@router.get("/study-materials")
def get_student_study_materials(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    mats = db.query(models.StudyMaterial).filter(
        (models.StudyMaterial.department_id == student.department_id) | (models.StudyMaterial.department_id == None) | (models.StudyMaterial.department_id == 0)
    ).order_by(models.StudyMaterial.created_at.desc()).all()
    if not mats:
        mats = db.query(models.StudyMaterial).order_by(models.StudyMaterial.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "subject_name": m.subject.name if m.subject else (m.subject_id and f"Subject {m.subject_id}") or "General",
            "faculty_name": m.faculty.name if m.faculty else "Faculty",
            "file_type": m.file_type or "pdf",
            "file_size": m.file_size or "1.5 MB",
            "file_url": m.file_url or "",
            "description": m.description or "",
            "downloads": m.downloads or 0,
            "uploaded_at": m.created_at.strftime("%Y-%m-%d") if m.created_at else datetime.date.today().isoformat()
        }
        for m in mats
    ]


# Student Document / Certificate Requests
@router.get("/documents")
def get_student_documents(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    docs = db.query(models.DocumentRequest).filter(
        models.DocumentRequest.student_id == student.id
    ).order_by(models.DocumentRequest.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "doc_type": d.doc_type,
            "description": d.description,
            "status": d.status,
            "admin_reply": d.admin_reply,
            "submitted_at": d.created_at.strftime("%Y-%m-%d") if d.created_at else datetime.date.today().isoformat()
        }
        for d in docs
    ]

@router.post("/documents")
def submit_student_document_request(
    payload: schemas.DocumentRequestCreate,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    doc = models.DocumentRequest(
        student_id=student.id,
        doc_type=payload.doc_type,
        description=payload.description.strip(),
        status="Pending",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(doc)
    db.flush()

    admins = db.query(models.User).filter(models.User.role == "admin").all()
    for a in admins:
        db.add(models.Notification(
            user_id=a.id,
            title=f"New Document Request: {student.name}",
            message=f"{student.name} ({student.reg_no}) requested {payload.doc_type}: {payload.description[:60]}.",
            type="Document Request",
            link_url="/admin/documents",
            is_read=False,
            created_at=datetime.datetime.utcnow()
        ))
    db.commit()
    return {"status": "success", "message": "Document request submitted successfully", "id": doc.id}


# Student Marks & Official Academic CGPA
@router.get("/my-marks")
def get_student_my_marks(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    from app.cgpa_calculator import calculate_student_cgpa, get_grade_point_from_grade
    # Always ensure CGPA is calculated and persisted
    cgpa_data = calculate_student_cgpa(student.id, db)
    marks = db.query(models.Mark).filter(models.Mark.student_id == student.id).all()
    marks_list = []
    for m in marks:
        credits = float(m.subject.credits) if (m.subject and m.subject.credits) else 3.0
        gp = m.grade_point if (m.grade_point is not None and m.grade_point > 0.0) else get_grade_point_from_grade(m.grade, m.total)
        marks_list.append({
            "id": m.id,
            "subject_id": m.subject_id,
            "subject_code": m.subject.code if m.subject else "",
            "subject_name": m.subject.name if m.subject else "",
            "credits": credits,
            "internal_1": m.internal_1,
            "internal_2": m.internal_2,
            "assignment": m.assignment,
            "total": m.total,
            "marks_obtained": m.total,
            "grade": m.grade,
            "grade_point": gp,
            "weighted_points": round(gp * credits, 2)
        })
    return marks_list

@router.get("/me/cgpa")
def get_my_cgpa(student: models.Student = Depends(get_logged_in_student), db: Session = Depends(get_db)):
    from app.cgpa_calculator import calculate_student_cgpa
    return calculate_student_cgpa(student.id, db)


