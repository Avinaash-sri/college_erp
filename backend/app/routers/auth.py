import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.email_service import send_smtp_message

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email.strip().lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    # Determine user name
    name = user.email.split("@")[0].replace(".", " ").title()
    if user.role == "student" and user.student_profile:
        name = user.student_profile.name
    elif user.role == "faculty" and user.faculty_profile:
        name = user.faculty_profile.name
    elif user.role == "admin":
        name = "Administrator"

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "email": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": name,
        "email": user.email
    }

@router.post("/register", response_model=schemas.Token)
def register_student(reg_data: schemas.StudentRegisterRequest, db: Session = Depends(get_db)):
    """
    Self-service student registration.
    Security: Role is hardcoded to 'student' to strictly prevent privilege escalation.
    Creates isolated student account without copied demo data.
    """
    email_clean = reg_data.email.strip().lower()
    reg_clean = reg_data.reg_no.strip().upper()

    # 1. Validation: Existing email / reg_no
    if db.query(models.User).filter(models.User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    if db.query(models.Student).filter(models.Student.reg_no == reg_clean).first():
        raise HTTPException(status_code=400, detail="A student with this Register Number already exists.")

    # Validate department exists
    dept = db.query(models.Department).filter(models.Department.id == reg_data.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Selected department does not exist.")

    # 2. Create User account
    new_user = models.User(
        email=email_clean,
        hashed_password=get_password_hash(reg_data.password),
        role="student",
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # 3. Create Student profile
    new_student = models.Student(
        user_id=new_user.id,
        reg_no=reg_clean,
        name=reg_data.name.strip(),
        email=email_clean,
        phone=reg_data.phone.strip() if reg_data.phone else None,
        department_id=reg_data.department_id,
        semester=reg_data.semester,
        section=reg_data.section.strip().upper() if reg_data.section else "A",
        parent_name=reg_data.parent_name.strip(),
        parent_email=reg_data.parent_email.strip().lower(),
        address=reg_data.address.strip() if reg_data.address else None
    )
    db.add(new_student)
    db.flush()

    # 4. Create primary ParentContact record
    parent_contact = models.ParentContact(
        student_id=new_student.id,
        name=reg_data.parent_name.strip(),
        email=reg_data.parent_email.strip().lower(),
        phone=None,
        relationship_type="Parent",
        is_primary=True
    )
    db.add(parent_contact)

    # 5. Enroll in semester subjects
    subjects = db.query(models.Subject).filter(
        models.Subject.department_id == reg_data.department_id,
        models.Subject.semester == reg_data.semester
    ).all()
    for sub in subjects:
        enrollment = models.Enrollment(
            student_id=new_student.id,
            subject_id=sub.id,
            semester=reg_data.semester
        )
        db.add(enrollment)

    # 6. Welcome notification
    welcome_notif = models.Notification(
        user_id=new_user.id,
        title="Welcome to College ERP Portal",
        message=f"Welcome, {new_student.name}! Your student registration is complete. You are enrolled in {len(subjects)} subjects for Semester {new_student.semester}.",
        type="General Announcement",
        is_read=False
    )
    db.add(welcome_notif)

    db.commit()

    # 7. Auto-login token
    access_token = create_access_token(
        data={"sub": str(new_user.id), "role": "student", "email": new_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "student",
        "user_id": new_user.id,
        "name": new_student.name,
        "email": new_user.email
    }

@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a secure password reset token and dispatches reset instructions.
    """
    user = db.query(models.User).filter(models.User.email == req.email.strip().lower()).first()
    if not user:
        # Prevent user enumeration by returning standard positive feedback
        return {
            "status": "success",
            "message": "If an account exists with that email address, password recovery instructions have been dispatched."
        }

    # Generate 32-character urlsafe recovery token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # Format recovery email
    subject = "Password Reset Request - College ERP"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #1e3a8a;">College ERP Password Reset</h3>
        <p>A password reset was requested for your account (<strong>{user.email}</strong>).</p>
        <p>Your one-time recovery token is:</p>
        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 1px; text-align: center;">
            {token}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
            This token expires in 1 hour. If you did not request this, you may safely ignore this message.
        </p>
    </div>
    """
    text_content = f"Password reset requested for {user.email}. Your recovery token is: {token}. Expires in 1 hour."

    # Dispatch email
    email_res = send_smtp_message(
        to_email=user.email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        db=db
    )

    return {
        "status": "success",
        "message": "Password recovery token generated successfully.",
        "delivery_status": email_res["status"],
        "reset_token": token if email_res["status"] == "Simulated" else None,
        "note": "Reset token provided directly for local testing/simulation mode." if email_res["status"] == "Simulated" else "Instructions dispatched to registered email."
    }

@router.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validates token and updates user password securely.
    """
    user = db.query(models.User).filter(models.User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or expired recovery token.")

    if not user.reset_token or user.reset_token != req.reset_token.strip():
        raise HTTPException(status_code=400, detail="Invalid recovery token.")

    if user.reset_token_expiry and datetime.utcnow() > user.reset_token_expiry:
        raise HTTPException(status_code=400, detail="Recovery token has expired. Please request a new one.")

    # Update password and clear token
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    return {"status": "success", "message": "Password updated successfully. You can now log in with your new password."}

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    res = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }
    if current_user.role == "student" and current_user.student_profile:
        sp = current_user.student_profile
        res["student_id"] = sp.id
        res["name"] = sp.name
        res["reg_no"] = sp.reg_no
        res["department_id"] = sp.department_id
        res["department_name"] = sp.department.name if sp.department else ""
        res["semester"] = sp.semester
        res["section"] = sp.section
        res["parent_name"] = sp.parent_name
        res["parent_email"] = sp.parent_email
        res["phone"] = sp.phone
    elif current_user.role == "faculty" and current_user.faculty_profile:
        fp = current_user.faculty_profile
        res["faculty_id"] = fp.id
        res["name"] = fp.name
        res["emp_id"] = fp.emp_id
        res["department_id"] = fp.department_id
        res["department_name"] = fp.department.name if fp.department else ""
        res["designation"] = fp.designation
        res["phone"] = fp.phone
    elif current_user.role == "admin":
        res["name"] = "System Administrator"

    return res

@router.get("/demo-accounts")
def get_demo_accounts():
    """Provides instant 1-click test credentials for the frontend demo modal"""
    return [
        {
            "role": "admin",
            "label": "Admin Portal",
            "description": "Full institutional control, KPI metrics, attendance alert center",
            "email": "admin@college.edu",
            "password": "admin123",
            "name": "System Administrator"
        },
        {
            "role": "faculty",
            "label": "Faculty Portal (Dr. Rajesh Kulkarni)",
            "description": "HOD CSE, handles subjects, marks attendance, views risk filters",
            "email": "rajesh.kulkarni@college.edu",
            "password": "faculty123",
            "name": "Dr. Rajesh Kulkarni"
        },
        {
            "role": "student",
            "label": "Student - Safe Standing (82%)",
            "description": "Aarav Sharma (21CS101) - Attendance Safe, normal status",
            "email": "aarav.sharma@student.edu",
            "password": "student123",
            "name": "Aarav Sharma"
        },
        {
            "role": "student",
            "label": "Student - Warning Standing (68%)",
            "description": "Ananya Iyer (21CS104) - Attendance Warning, parent alert logged",
            "email": "ananya.iyer@student.edu",
            "password": "student123",
            "name": "Ananya Iyer"
        },
        {
            "role": "student",
            "label": "Student - High Risk (58%)",
            "description": "Vikram Singh (21CS105) - Attendance High Risk (<65%), active shortage",
            "email": "vikram.singh@student.edu",
            "password": "student123",
            "name": "Vikram Singh"
        }
    ]
