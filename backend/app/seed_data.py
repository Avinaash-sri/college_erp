import datetime
from sqlalchemy.orm import Session
from app import models
from app.auth import get_password_hash
from app.attendance_service import calculate_recovery_classes, get_risk_status
from app.email_service import generate_attendance_email_content

def seed_database(db: Session):
    # Check if data already exists
    if db.query(models.User).first():
        return

    print("[SEED] Seeding realistic demo data for Cloud-Based ERP...")

    # 1. Departments
    dept_cse = models.Department(code="CSE", name="Computer Science & Engineering")
    dept_it = models.Department(code="IT", name="Information Technology")
    dept_ece = models.Department(code="ECE", name="Electronics & Communication")
    db.add_all([dept_cse, dept_it, dept_ece])
    db.flush()

    # 2. Admin User
    admin_user = models.User(
        email="admin@college.edu",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    # 3. Faculty Users & Profiles
    fac1_user = models.User(
        email="rajesh.kulkarni@college.edu",
        hashed_password=get_password_hash("faculty123"),
        role="faculty",
        is_active=True
    )
    db.add(fac1_user)
    db.flush()

    fac1_profile = models.Faculty(
        user_id=fac1_user.id,
        emp_id="FAC-CSE-001",
        name="Dr. Rajesh Kulkarni",
        email=fac1_user.email,
        phone="+91 98765 43210",
        department_id=dept_cse.id,
        designation="Professor & HOD"
    )
    db.add(fac1_profile)

    fac2_user = models.User(
        email="sunita.rao@college.edu",
        hashed_password=get_password_hash("faculty123"),
        role="faculty",
        is_active=True
    )
    db.add(fac2_user)
    db.flush()

    fac2_profile = models.Faculty(
        user_id=fac2_user.id,
        emp_id="FAC-CSE-002",
        name="Prof. Sunita Rao",
        email=fac2_user.email,
        phone="+91 98765 43211",
        department_id=dept_cse.id,
        designation="Associate Professor"
    )
    db.add(fac2_profile)
    db.flush()

    # 4. Subjects (CSE Sem 6)
    sub_ds = models.Subject(code="CS601", name="Data Structures & Algorithms", department_id=dept_cse.id, semester=6, credits=4, faculty_id=fac1_profile.id)
    sub_cn = models.Subject(code="CS602", name="Computer Networks", department_id=dept_cse.id, semester=6, credits=3, faculty_id=fac2_profile.id)
    sub_os = models.Subject(code="CS603", name="Operating Systems", department_id=dept_cse.id, semester=6, credits=3, faculty_id=fac1_profile.id)
    sub_dbms = models.Subject(code="CS604", name="Database Management Systems", department_id=dept_cse.id, semester=6, credits=4, faculty_id=fac2_profile.id)
    sub_se = models.Subject(code="CS605", name="Software Engineering", department_id=dept_cse.id, semester=6, credits=3, faculty_id=fac1_profile.id)

    subjects = [sub_ds, sub_cn, sub_os, sub_dbms, sub_se]
    db.add_all(subjects)
    db.flush()

    # 5. Students data specification:
    # Aarav: 82% (Safe)
    # Priya: 76% (Safe)
    # Rohan: 71% (Warning)
    # Ananya: 68% (Warning)
    # Vikram: 58% (High Risk)
    student_specs = [
        {
            "name": "Aarav Sharma",
            "reg_no": "21CS101",
            "email": "aarav.sharma@student.edu",
            "phone": "+91 98111 22334",
            "parent_name": "Ramesh Sharma",
            "parent_email": "ramesh.sharma@parent.example.com",
            "target_pct": 82.0,
            "address": "42 Green Valley, Tech Park Road, Bengaluru"
        },
        {
            "name": "Priya Patel",
            "reg_no": "21CS102",
            "email": "priya.patel@student.edu",
            "phone": "+91 98222 33445",
            "parent_name": "Suresh Patel",
            "parent_email": "suresh.patel@parent.example.com",
            "target_pct": 76.0,
            "address": "15 Orchid Towers, Indiranagar, Bengaluru"
        },
        {
            "name": "Rohan Verma",
            "reg_no": "21CS103",
            "email": "rohan.verma@student.edu",
            "phone": "+91 98333 44556",
            "parent_name": "Alok Verma",
            "parent_email": "alok.verma@parent.example.com",
            "target_pct": 71.0,
            "address": "88 Palm Grove, Whitefield, Bengaluru"
        },
        {
            "name": "Ananya Iyer",
            "reg_no": "21CS104",
            "email": "ananya.iyer@student.edu",
            "phone": "+91 98444 55667",
            "parent_name": "K. S. Iyer",
            "parent_email": "k.iyer@parent.example.com",
            "target_pct": 68.0,
            "address": "204 Heritage Enclave, Koramangala, Bengaluru"
        },
        {
            "name": "Vikram Singh",
            "reg_no": "21CS105",
            "email": "vikram.singh@student.edu",
            "phone": "+91 98555 66778",
            "parent_name": "Mahendra Singh",
            "parent_email": "mahendra.singh@parent.example.com",
            "target_pct": 58.0,
            "address": "77 Silver Springs, Electronic City, Bengaluru"
        }
    ]

    created_students = []
    for spec in student_specs:
        user = models.User(
            email=spec["email"],
            hashed_password=get_password_hash("student123"),
            role="student",
            is_active=True
        )
        db.add(user)
        db.flush()

        student = models.Student(
            user_id=user.id,
            reg_no=spec["reg_no"],
            name=spec["name"],
            email=spec["email"],
            phone=spec["phone"],
            department_id=dept_cse.id,
            semester=6,
            section="A",
            parent_name=spec["parent_name"],
            parent_email=spec["parent_email"],
            address=spec["address"]
        )
        db.add(student)
        db.flush()
        created_students.append((student, user, spec))

    # 6. Generate Realistic Attendance Records (25 sessions per subject = 125 classes total)
    # Generate past 25 dates
    base_date = datetime.date.today() - datetime.timedelta(days=40)
    class_dates = []
    curr = base_date
    while len(class_dates) < 25:
        if curr.weekday() < 5:  # Monday to Friday
            class_dates.append(curr)
        curr += datetime.timedelta(days=1)

    for student, user, spec in created_students:
        target_pct = spec["target_pct"]  # e.g., 82.0, 76.0, 71.0, 68.0, 58.0
        # For 125 total classes:
        # 82% = ~102 present
        # 76% = 95 present
        # 71% = ~89 present
        # 68% = 85 present
        # 58% = ~73 present
        total_needed_present = int(round((target_pct / 100.0) * 125))

        assigned_present = 0
        for sub_idx, sub in enumerate(subjects):
            # Target present for this subject (approximately total_needed_present // 5)
            # Add small natural variance across subjects
            sub_target = total_needed_present // 5
            if sub_idx == 4:
                sub_target = total_needed_present - assigned_present

            # Ensure between 0 and 25
            sub_target = max(5, min(25, sub_target))
            assigned_present += sub_target

            # In sub_target of the 25 dates, status is Present, rest Absent
            for d_idx, dt in enumerate(class_dates):
                status = "Present" if d_idx < sub_target else "Absent"
                att_rec = models.AttendanceRecord(
                    student_id=student.id,
                    subject_id=sub.id,
                    date=dt,
                    status=status,
                    session_name=f"Lecture {d_idx + 1}",
                    marked_by=sub.faculty_id
                )
                db.add(att_rec)

    db.flush()

    # 7. Pre-seed Attendance Alerts for Low-Attendance Students (Vikram & Ananya)
    for student, user, spec in created_students:
        if spec["target_pct"] < 75.0:
            rec_classes = calculate_recovery_classes(
                int(round((spec["target_pct"] / 100.0) * 125)),
                125,
                75.0
            )
            email_info = generate_attendance_email_content(
                student_name=student.name,
                reg_no=student.reg_no,
                department_name="Computer Science & Engineering",
                attendance_pct=spec["target_pct"],
                recovery_classes=rec_classes,
                parent_name=student.parent_name,
                required_pct=75.0
            )
            alert = models.AttendanceAlert(
                student_id=student.id,
                attendance_pct=spec["target_pct"],
                parent_email=student.parent_email,
                alert_type="Threshold Crossed (<75%)",
                sent_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                status="Sent",
                recovery_classes=rec_classes,
                email_preview=email_info["html"]
            )
            db.add(alert)

            # In-app notification for student
            notif = models.Notification(
                user_id=user.id,
                title="⚠️ Attendance Warning Alert",
                message=f"Your overall attendance is currently {spec['target_pct']}%, which has fallen below the mandatory 75%. An automated alert was dispatched to your parent ({student.parent_email}). You must attend {rec_classes} more consecutive classes to restore safe standing.",
                type="Attendance Alert",
                is_read=False,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
            )
            db.add(notif)

    # 8. Timetable (Weekly Mon-Fri schedule for CSE Sem 6)
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        ("09:00 AM", "10:00 AM", sub_ds, fac1_profile, "LH-301"),
        ("10:00 AM", "11:00 AM", sub_cn, fac2_profile, "LH-301"),
        ("11:15 AM", "12:15 PM", sub_os, fac1_profile, "LH-302"),
        ("01:15 PM", "02:15 PM", sub_dbms, fac2_profile, "CS-Lab 2"),
        ("02:15 PM", "03:15 PM", sub_se, fac1_profile, "LH-301"),
    ]

    for d_idx, day in enumerate(days):
        # Rotate periods slightly for natural schedule
        rotated = periods[d_idx:] + periods[:d_idx]
        for start, end, sub, fac, room in rotated:
            tt = models.TimetableEntry(
                day_of_week=day,
                start_time=start,
                end_time=end,
                subject_id=sub.id,
                faculty_id=fac.id,
                room=room,
                department_id=dept_cse.id,
                semester=6,
                section="A"
            )
            db.add(tt)

    # 9. Upcoming Exams
    today = datetime.date.today()
    exams_data = [
        ("Midterm Examination", sub_ds, today + datetime.timedelta(days=5), "10:00 AM", "12:00 PM", "Auditorium Hall A"),
        ("Midterm Examination", sub_cn, today + datetime.timedelta(days=7), "10:00 AM", "12:00 PM", "Auditorium Hall A"),
        ("Midterm Examination", sub_os, today + datetime.timedelta(days=10), "10:00 AM", "12:00 PM", "Exam Hall B"),
        ("Midterm Examination", sub_dbms, today + datetime.timedelta(days=12), "10:00 AM", "12:00 PM", "Exam Hall B"),
        ("Midterm Examination", sub_se, today + datetime.timedelta(days=15), "10:00 AM", "12:00 PM", "Auditorium Hall A"),
    ]
    for name, sub, dt, st, et, venue in exams_data:
        ex = models.Exam(
            name=name,
            subject_id=sub.id,
            date=dt,
            start_time=st,
            end_time=et,
            venue=venue,
            semester=6,
            department_id=dept_cse.id
        )
        db.add(ex)

    # 10. Student Marks
    for student, user, spec in created_students:
        for sub in subjects:
            if spec["target_pct"] >= 75.0:
                i1, i2, ass = 23.0, 24.0, 9.5
                tot = i1 + i2 + ass
                grd = "A+" if tot >= 52 else "A"
            elif spec["target_pct"] >= 65.0:
                i1, i2, ass = 18.0, 19.0, 8.0
                tot = i1 + i2 + ass
                grd = "B+"
            else:
                i1, i2, ass = 13.0, 14.0, 6.0
                tot = i1 + i2 + ass
                grd = "C"

            mk = models.Mark(
                student_id=student.id,
                subject_id=sub.id,
                internal_1=i1,
                internal_2=i2,
                assignment=ass,
                total=tot,
                grade=grd
            )
            db.add(mk)

    # 11. Fees Records
    for student, user, spec in created_students:
        # Tuition fee
        if spec["target_pct"] >= 75:
            # Paid in full
            fee1 = models.FeeRecord(student_id=student.id, title="Semester 6 Tuition Fee", total_amount=65000.0, paid_amount=65000.0, due_date=today + datetime.timedelta(days=30), status="Paid")
            fee2 = models.FeeRecord(student_id=student.id, title="Laboratory & Library Access Fee", total_amount=8000.0, paid_amount=8000.0, due_date=today + datetime.timedelta(days=30), status="Paid")
        elif spec["target_pct"] >= 65:
            # Partially paid
            fee1 = models.FeeRecord(student_id=student.id, title="Semester 6 Tuition Fee", total_amount=65000.0, paid_amount=40000.0, due_date=today + datetime.timedelta(days=15), status="Partially Paid")
            fee2 = models.FeeRecord(student_id=student.id, title="Laboratory & Library Access Fee", total_amount=8000.0, paid_amount=8000.0, due_date=today + datetime.timedelta(days=30), status="Paid")
        else:
            # Pending
            fee1 = models.FeeRecord(student_id=student.id, title="Semester 6 Tuition Fee", total_amount=65000.0, paid_amount=0.0, due_date=today + datetime.timedelta(days=10), status="Pending")
            fee2 = models.FeeRecord(student_id=student.id, title="Laboratory & Library Access Fee", total_amount=8000.0, paid_amount=0.0, due_date=today + datetime.timedelta(days=10), status="Pending")

        db.add_all([fee1, fee2])

    # 12. Placement Drives
    placements_data = [
        ("Google", "Associate Software Engineer", 24.5, "B.Tech CSE/IT, CGPA >= 8.5, No active backlogs", today + datetime.timedelta(days=18), "Campus hiring for Cloud & Systems engineering teams. Online coding round followed by technical interviews."),
        ("Microsoft", "Software Development Engineer (SDE-1)", 21.0, "B.Tech CSE/IT/ECE, CGPA >= 8.0, 75%+ Attendance", today + datetime.timedelta(days=22), "Full-time software engineering roles across Azure and Core OS platform teams."),
        ("Amazon", "Cloud Support Associate", 16.5, "B.Tech All Branches, CGPA >= 7.5", today + datetime.timedelta(days=25), "AWS cloud infrastructure management, systems monitoring, and customer solution architecture."),
        ("Infosys", "Specialist Programmer (Power Programmer)", 9.5, "B.Tech All Branches, CGPA >= 7.0", today + datetime.timedelta(days=30), "High-impact development across AI/ML and full-stack enterprise cloud applications."),
        ("Tata Consultancy Services (TCS)", "Digital Innovator", 7.5, "B.Tech All Branches, CGPA >= 6.5", today + datetime.timedelta(days=35), "Digital business transformation, microservices engineering, and enterprise systems.")
    ]
    for comp, role, lpa, elig, ddl, desc in placements_data:
        p = models.Placement(
            company=comp,
            role=role,
            package_lpa=lpa,
            eligibility=elig,
            deadline=ddl,
            description=desc
        )
        db.add(p)

    # 13. General & Academic Notifications
    general_notifs = [
        ("End-Semester Lab Examination Guidelines", "The schedule and SOP for 6th Semester Practical and Laboratory examinations have been published. Ensure attendance requirements are met.", "Exam Announcement"),
        ("Microsoft Campus Recruitment Registration Open", "Eligible students (CGPA >= 8.0, Attendance >= 75%) must register on the Training & Placement portal before the deadline.", "Placement Announcement"),
        ("Semester 6 Fee Clearance Deadline", "All students with pending semester dues must clear payments before the midterm examinations to prevent hall ticket hold.", "Fee Reminder"),
        ("Annual Tech Symposium - 'TechGenesis 2026'", "Department of Computer Science invites paper submissions and hackathon participation for the national symposium next month.", "General Announcement")
    ]
    for title, msg, n_type in general_notifs:
        n = models.Notification(
            user_id=None,  # Broadcast
            title=title,
            message=msg,
            type=n_type,
            is_read=False,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
        )
        db.add(n)

    # 14. System Settings
    settings_records = [
        models.SystemSetting(key="SAFE_THRESHOLD", value="75.0", description="Mandatory minimum percentage for safe attendance standing"),
        models.SystemSetting(key="WARNING_THRESHOLD", value="65.0", description="Lower threshold for warning state"),
        models.SystemSetting(key="COLLEGE_NAME", value="Institute of Technology & Advanced Science", description="College Name"),
        models.SystemSetting(key="ACADEMIC_YEAR", value="2025-2026", description="Active Academic Year"),
        models.SystemSetting(key="AUTO_EMAIL_ALERT", value="true", description="Enable auto parent email alerts on crossing below 75%"),
    ]
    db.add_all(settings_records)
    db.commit()
    print("[SEED] Seed data successfully populated!")

if __name__ == "__main__":
    from app.database import engine, Base, SessionLocal
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        seed_database(session)
    finally:
        session.close()
