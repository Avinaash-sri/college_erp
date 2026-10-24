from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
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
    cgpa: Optional[float] = 0.0
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
    grade_point: Optional[float] = 0.0

class MarkCreate(MarkBase):
    pass

class MarkResponse(MarkBase):
    id: int
    student_name: Optional[str] = None
    reg_no: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    credits: Optional[float] = 3.0
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
    department_id: Optional[int] = None
    semester: int = 6
    section: str = "A"
    title: str
    description: str
    due_date: date
    due_time: str = "23:59"
    max_marks: float = 10.0
    resource_url: Optional[str] = None
    allowed_file_types: str = "pdf,docx,zip,txt"
    max_file_size_mb: int = 10
    submission_format: str = "both"  # 'file', 'drive_link', 'both'
    allow_resubmission: bool = True
    allow_late: bool = True
    reminder_interval_minutes: int = 60
    status: str = "published"
    excluded_student_ids: List[int] = []

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    max_marks: Optional[float] = None
    allowed_file_types: Optional[str] = None
    max_file_size_mb: Optional[int] = None
    submission_format: Optional[str] = None
    allow_resubmission: Optional[bool] = None
    allow_late: Optional[bool] = None
    status: Optional[str] = None
    reminder_interval_minutes: Optional[int] = None
    excluded_student_ids: Optional[List[int]] = None

class AssignmentResponse(BaseModel):
    id: int
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    semester: int = 6
    section: str = "A"
    title: str
    description: str
    due_date: date
    due_time: str = "23:59"
    max_marks: float = 10.0
    resource_url: Optional[str] = None
    allowed_file_types: str = "pdf,docx,zip,txt"
    max_file_size_mb: int = 10
    submission_format: str = "both"
    allow_resubmission: bool = True
    allow_late: bool = True
    status: str = "published"
    reminder_interval_minutes: int = 60
    faculty_name: Optional[str] = None
    created_at: datetime
    my_submission: Optional[Dict[str, Any]] = None
    total_eligible: Optional[int] = 0
    submitted_count: Optional[int] = 0
    pending_count: Optional[int] = 0
    graded_count: Optional[int] = 0
    class Config:
        from_attributes = True

class AssignmentRosterItem(BaseModel):
    student_id: int
    reg_no: str
    name: str
    email: str
    status: str  # 'Pending — Not Submitted', 'Submitted', 'Late', 'Graded', 'Returned for Resubmission', 'Excluded'
    is_excluded: bool = False
    submitted_at: Optional[datetime] = None
    submission_type: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    drive_link: Optional[str] = None
    marks_obtained: Optional[float] = None
    faculty_feedback: Optional[str] = None
    graded_at: Optional[datetime] = None
    graded_by_name: Optional[str] = None
    last_reminder_sent_at: Optional[datetime] = None
    next_reminder_at: Optional[datetime] = None
    reminder_count: int = 0
    version: int = 1

class AssignmentGradeRequest(BaseModel):
    marks_obtained: float
    faculty_feedback: Optional[str] = None
    return_for_resubmission: bool = False

class DriveSubmissionRequest(BaseModel):
    drive_link: str
    confirmed_access_granted: bool = True

class ReminderTriggerResponse(BaseModel):
    status: str
    assignment_id: int
    sent_count: int
    failed_count: int
    skipped_count: int
    next_run: Optional[str] = None
    details: List[Dict[str, Any]] = []

# Quizzes
class QuizQuestionCreate(BaseModel):
    question_text: str
    question_type: str = "mcq"  # 'mcq', 'short_answer'
    marks: float = 1.0
    order: int = 1
    options: Optional[List[Dict[str, Any]]] = None  # [{"id": "A", "text": "Option A"}, ...]
    correct_answer: str
    explanation: Optional[str] = None

class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: str
    marks: float
    order: int
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[str] = None  # Redacted during taking
    explanation: Optional[str] = None  # Redacted during taking
    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: int
    department_id: int
    academic_year: str = "2025-2026"
    semester: int = 6
    section: str = "A"
    duration_minutes: int = 30
    deadline: datetime
    start_time: Optional[datetime] = None
    status: str = "draft"  # 'draft', 'published', 'closed'
    allow_multiple_attempts: bool = False
    max_attempts: int = 1
    excluded_student_ids: List[int] = []
    questions: List[QuizQuestionCreate] = []

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    duration_minutes: Optional[int] = None
    deadline: Optional[datetime] = None
    start_time: Optional[datetime] = None
    status: Optional[str] = None
    results_published: Optional[bool] = None
    allow_multiple_attempts: Optional[bool] = None
    max_attempts: Optional[int] = None
    excluded_student_ids: Optional[List[int]] = None
    questions: Optional[List[QuizQuestionCreate]] = None

class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    faculty_id: int
    faculty_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    semester: int
    section: str
    duration_minutes: int
    total_marks: float
    deadline: datetime
    start_time: Optional[datetime] = None
    status: str
    results_published: bool
    allow_multiple_attempts: bool
    max_attempts: int
    created_at: datetime
    question_count: int = 0
    eligible_count: int = 0
    submitted_count: int = 0
    my_attempt: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    answers: List[Dict[str, Any]]  # [{"question_id": 1, "selected_answer": "A"}, ...]

# Announcements & Enhanced Notifications
class AnnouncementCreate(BaseModel):
    title: str
    description: str
    category: str = "General Announcement"
    poster_url: Optional[str] = None
    event_date: Optional[date] = None
    registration_url: Optional[str] = None
    audience_type: str = "all"  # 'all', 'department', 'semester', 'section'
    target_department_id: Optional[int] = None
    target_semester: Optional[int] = None
    target_section: Optional[str] = None
    status: str = "published"

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    poster_url: Optional[str] = None
    event_date: Optional[date] = None
    registration_url: Optional[str] = None
    status: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    poster_url: Optional[str] = None
    event_date: Optional[date] = None
    registration_url: Optional[str] = None
    audience_type: str
    target_department_id: Optional[int] = None
    target_department_name: Optional[str] = None
    target_semester: Optional[int] = None
    target_section: Optional[str] = None
    status: str
    created_by_name: Optional[str] = None
    created_at: datetime
    published_at: datetime
    class Config:
        from_attributes = True

class NotificationEnhancedResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    link_url: Optional[str] = None
    announcement_id: Optional[int] = None
    announcement: Optional[AnnouncementResponse] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Notes AI Assistant
class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    extracted_length: int
    total_chunks: int
    processing_status: str
    created_at: datetime
    summary: Optional[str] = None

class DocumentActionRequest(BaseModel):
    action: str  # 'summarise_full', 'summarise_topic', 'explain_english', 'explain_tanglish', 'qa', 'generate_mcqs', 'key_concepts', 'revision_checklist'
    query: Optional[str] = None
    topic: Optional[str] = None

class DocumentActionResponse(BaseModel):
    action: str
    response: str
    result: Optional[str] = None
    sources: List[Dict[str, Any]] = []
    document_id: int
    document_name: str
    engine: str = "Gemini Flash Grounded Engine"

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

# Leave Requests
class LeaveRequestCreate(BaseModel):
    leave_type: str
    from_date: str
    to_date: str
    reason: str

class LeaveRequestUpdate(BaseModel):
    status: str
    faculty_remark: Optional[str] = None
    admin_remark: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    reg_no: Optional[str] = None
    department_name: Optional[str] = None
    leave_type: str
    from_date: str
    to_date: str
    reason: str
    status: str
    faculty_remark: Optional[str] = None
    admin_remark: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Study Materials
class StudyMaterialCreate(BaseModel):
    title: str
    subject_id: Optional[int] = None
    department_id: Optional[int] = None
    semester: Optional[int] = 6
    description: Optional[str] = None
    file_type: Optional[str] = "pdf"
    file_url: Optional[str] = None
    file_size: Optional[str] = "1.5 MB"

class StudyMaterialResponse(BaseModel):
    id: int
    faculty_id: int
    faculty_name: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    file_type: str
    file_url: Optional[str] = None
    file_size: str
    downloads: int = 0
    uploaded_at: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Document Requests
class DocumentRequestCreate(BaseModel):
    doc_type: str
    description: str

class DocumentRequestUpdate(BaseModel):
    status: str
    admin_reply: Optional[str] = None

class DocumentRequestResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    reg_no: Optional[str] = None
    department: Optional[str] = None
    doc_type: str
    description: str
    status: str
    admin_reply: Optional[str] = None
    submitted_at: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True
