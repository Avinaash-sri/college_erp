from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# Token & Auth
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str
    email: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# User
class UserBase(BaseModel):
    email: str
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Department
class DepartmentBase(BaseModel):
    code: str
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# Student
class StudentBase(BaseModel):
    reg_no: str
    name: str
    email: str
    phone: Optional[str] = None
    department_id: int
    semester: int = 6
    section: str = "A"
    parent_name: str
    parent_email: str
    address: Optional[str] = None

class StudentCreate(StudentBase):
    password: Optional[str] = "student123"

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    department_name: Optional[str] = None
    overall_attendance: Optional[float] = 0.0
    risk_level: Optional[str] = "SAFE"
    recovery_classes: Optional[int] = 0
    class Config:
        from_attributes = True

# Faculty
class FacultyBase(BaseModel):
    emp_id: str
    name: str
    email: str
    phone: Optional[str] = None
    department_id: int
    designation: str = "Assistant Professor"

class FacultyCreate(FacultyBase):
    password: Optional[str] = "faculty123"

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None

class FacultyResponse(FacultyBase):
    id: int
    user_id: int
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

# Subject
class SubjectBase(BaseModel):
    code: str
    name: str
    department_id: int
    semester: int = 6
    credits: int = 3
    faculty_id: Optional[int] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    credits: Optional[int] = None
    faculty_id: Optional[int] = None

class SubjectResponse(SubjectBase):
    id: int
    department_name: Optional[str] = None
    faculty_name: Optional[str] = None
    class Config:
        from_attributes = True

# Attendance
class AttendanceMarkItem(BaseModel):
    student_id: int
    status: str  # 'Present' or 'Absent'

class AttendanceBatchCreate(BaseModel):
    subject_id: int
    date: date
    session_name: str = "Lecture"
    records: List[AttendanceMarkItem]

class SubjectAttendanceDetail(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    attended_classes: int
    total_classes: int
    percentage: float
    status: str  # 'SAFE', 'WARNING', 'HIGH RISK'
    recovery_classes: int = 0

class StudentAttendanceSummary(BaseModel):
    student_id: int
    student_name: str
    reg_no: str
    total_attended: int
    total_conducted: int
    overall_percentage: float
    risk_status: str  # 'SAFE', 'WARNING', 'HIGH RISK'
    recovery_classes: int = 0
    required_percentage: float = 75.0
    subjects: List[SubjectAttendanceDetail]

# Exam
class ExamBase(BaseModel):
    name: str
    subject_id: int
    date: date
    start_time: str
    end_time: str
    venue: str
    semester: int = 6
    department_id: int

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

# Mark
class MarkBase(BaseModel):
    student_id: int
    subject_id: int
    internal_1: float = 0.0
    internal_2: float = 0.0
    assignment: float = 0.0
    total: float = 0.0
    grade: str = "A"

class MarkCreate(MarkBase):
    pass

class MarkResponse(MarkBase):
    id: int
    student_name: Optional[str] = None
    reg_no: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    class Config:
        from_attributes = True

# FeeRecord
class FeeBase(BaseModel):
    student_id: int
    title: str
    total_amount: float
    paid_amount: float = 0.0
    due_date: date
    status: str = "Pending"

class FeeCreate(FeeBase):
    pass

class FeeResponse(FeeBase):
    id: int
    student_name: Optional[str] = None
    reg_no: Optional[str] = None
    pending_amount: float = 0.0
    class Config:
        from_attributes = True

# Timetable
class TimetableBase(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    subject_id: int
    faculty_id: int
    room: str
    department_id: int
    semester: int = 6
    section: str = "A"

class TimetableCreate(TimetableBase):
    pass

class TimetableResponse(TimetableBase):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    faculty_name: Optional[str] = None
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

# Placement
class PlacementBase(BaseModel):
    company: str
    role: str
    package_lpa: float
    eligibility: str
    deadline: date
    description: str

class PlacementCreate(PlacementBase):
    pass

class PlacementResponse(PlacementBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Notification
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str  # 'Attendance Alert', 'Exam Announcement', 'Fee Reminder', 'Placement Announcement', 'General Announcement'
    user_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Attendance Alert & Email Alert Log
class AttendanceAlertResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    reg_no: str
    department_name: str
    attendance_pct: float
    risk_level: str
    parent_email: str
    parent_name: str
    alert_type: str
    academic_term: Optional[str] = "2025-26 Term 2"
    sent_at: datetime
    status: str
    attempt_count: Optional[int] = 1
    recovery_classes: int
    last_error: Optional[str] = None
    email_preview: Optional[str] = None
    class Config:
        from_attributes = True

EmailAlertLogResponse = AttendanceAlertResponse

# Registration & Password Recovery
class StudentRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    reg_no: str
    department_id: int
    semester: int = 6
    section: str = "A"
    parent_name: str
    parent_email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

# Complaints / Support Tickets
class ComplaintCreate(BaseModel):
    subject: str
    category: str = "Academic"  # 'Academic', 'Attendance', 'Facilities', 'Fees', 'Other'
    description: str

class ComplaintUpdate(BaseModel):
    status: str  # 'Open', 'In Progress', 'Resolved'
    response: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_reg_no: Optional[str] = None
    subject: str
    category: str
    description: str
    status: str
    response: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Assignments & Resources
class AssignmentCreate(BaseModel):
    subject_id: int
    title: str
    description: str
    due_date: date
    max_marks: float = 10.0
    resource_url: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: int
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    title: str
    description: str
    due_date: date
    max_marks: float
    resource_url: Optional[str] = None
    faculty_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# AI Chat
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = None
    suggested_questions: List[str] = []
    engine: Optional[str] = "Rule Engine"
    model: Optional[str] = None

class TestSMTPRequest(BaseModel):
    to_email: Optional[str] = None
