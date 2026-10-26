import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Date, Time, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'student', 'faculty', 'admin'
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(100), nullable=True, index=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    complaints = relationship("Complaint", foreign_keys="Complaint.user_id", back_populates="user", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department")
    subjects = relationship("Subject", back_populates="department")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    reg_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(20), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, default=6)
    section = Column(String(10), default="A")
    parent_name = Column(String(100), nullable=False)
    parent_email = Column(String(120), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    cgpa = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    fees = relationship("FeeRecord", back_populates="student", cascade="all, delete-orphan")
    attendance_alerts = relationship("AttendanceAlert", back_populates="student", cascade="all, delete-orphan")
    parent_contacts = relationship("ParentContact", back_populates="student", cascade="all, delete-orphan")
    complaints = relationship("Complaint", foreign_keys="Complaint.student_id", back_populates="student", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    quiz_assignments = relationship("QuizAssignment", back_populates="student", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
    assignment_eligibilities = relationship("AssignmentEligibility", back_populates="student", cascade="all, delete-orphan")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student", cascade="all, delete-orphan")
    documents = relationship("StudentDocument", back_populates="student", cascade="all, delete-orphan")
    ai_conversations = relationship("StudentAIConversation", back_populates="student", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="student", cascade="all, delete-orphan")
    document_requests = relationship("DocumentRequest", back_populates="student", cascade="all, delete-orphan")


class ParentContact(Base):
    __tablename__ = "parent_contacts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    relationship_type = Column(String(50), default="Parent")  # 'Father', 'Mother', 'Guardian'
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="parent_contacts")


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    emp_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(20), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), default="Assistant Professor")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    subjects = relationship("Subject", back_populates="faculty")
    timetable_entries = relationship("TimetableEntry", back_populates="faculty")
    assignments = relationship("Assignment", back_populates="faculty")
    quizzes = relationship("Quiz", back_populates="faculty")
    study_materials = relationship("StudyMaterial", back_populates="faculty", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, default=6)
    credits = Column(Integer, default=3)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="subjects")
    faculty = relationship("Faculty", back_populates="subjects")
    attendance_records = relationship("AttendanceRecord", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")
    marks = relationship("Mark", back_populates="subject")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")
    enrollments = relationship("Enrollment", back_populates="subject")
    assignments = relationship("Assignment", back_populates="subject")
    quizzes = relationship("Quiz", back_populates="subject")
    study_materials = relationship("StudyMaterial", back_populates="subject")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    academic_term = Column(String(50), default="2025-26 Term 2")
    semester = Column(Integer, default=6)
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('student_id', 'subject_id', name='uq_student_subject_enrollment'),
    )

    student = relationship("Student", back_populates="enrollments")
    subject = relationship("Subject", back_populates="enrollments")


class AttendanceRecord(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False)  # 'Present', 'Absent', 'Excused'
    session_name = Column(String(50), default="Lecture")
    marked_by = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index('idx_student_subject_date', 'student_id', 'subject_id', 'date'),
    )

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., 'Midterm Exam', 'End Semester Exam'
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    venue = Column(String(100), nullable=False)
    semester = Column(Integer, default=6)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    subject = relationship("Subject", back_populates="exams")


class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    internal_1 = Column(Float, default=0.0)
    internal_2 = Column(Float, default=0.0)
    assignment = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    grade = Column(String(10), default="A")
    grade_point = Column(Float, default=0.0)

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")


class FeeRecord(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), default="Pending")  # 'Paid', 'Partially Paid', 'Pending'

    student = relationship("Student", back_populates="fees")


class TimetableEntry(Base):
    __tablename__ = "timetable"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    room = Column(String(50), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, default=6)
    section = Column(String(10), default="A")

    subject = relationship("Subject", back_populates="timetable_entries")
    faculty = relationship("Faculty", back_populates="timetable_entries")


class Placement(Base):
    __tablename__ = "placements"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    package_lpa = Column(Float, nullable=False)
    eligibility = Column(String(200), nullable=False)
    deadline = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # None = broadcast
    announcement_id = Column(Integer, ForeignKey("announcements.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    link_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    is_cleared = Column(Boolean, default=False, index=True)
    cleared_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    announcement = relationship("Announcement", back_populates="notifications")


class AttendanceAlert(Base):
    __tablename__ = "attendance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    attendance_pct = Column(Float, nullable=False)
    parent_email = Column(String(120), nullable=False)
    alert_type = Column(String(50), default="Threshold Crossed (<75%)")
    academic_term = Column(String(50), default="2025-26 Term 2")
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(20), default="Sent")  # 'Sent', 'Simulated', 'Failed', 'Blocked'
    attempt_count = Column(Integer, default=1)
    recovery_classes = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    email_preview = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="attendance_alerts")

# Alias for standard schema naming
EmailAlertLog = AttendanceAlert


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(150), nullable=False)
    category = Column(String(50), default="Academic")  # 'Academic', 'Attendance', 'Facilities', 'Fees', 'Other'
    description = Column(Text, nullable=False)
    status = Column(String(20), default="Open")  # 'Open', 'In Progress', 'Resolved'
    response = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", foreign_keys=[student_id], back_populates="complaints")
    user = relationship("User", foreign_keys=[user_id], back_populates="complaints")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    semester = Column(Integer, default=6)
    section = Column(String(10), default="A")
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(Date, nullable=False)
    due_time = Column(String(20), default="23:59")
    max_marks = Column(Float, default=10.0)
    resource_url = Column(String(255), nullable=True)
    allowed_file_types = Column(String(100), default="pdf,docx,zip,txt")
    max_file_size_mb = Column(Integer, default=10)
    submission_format = Column(String(30), default="both")  # 'file', 'drive_link', 'both'
    allow_resubmission = Column(Boolean, default=True)
    allow_late = Column(Boolean, default=True)
    status = Column(String(20), default="published")  # 'draft', 'published', 'closed'
    reminder_interval_minutes = Column(Integer, default=60)
    created_by = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subject = relationship("Subject", back_populates="assignments")
    faculty = relationship("Faculty", back_populates="assignments")
    department = relationship("Department")
    eligibilities = relationship("AssignmentEligibility", back_populates="assignment", cascade="all, delete-orphan")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")
    reminder_logs = relationship("AssignmentReminderLog", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentEligibility(Base):
    __tablename__ = "assignment_eligibility"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    is_excluded = Column(Boolean, default=False)
    last_reminder_sent_at = Column(DateTime, nullable=True)
    next_reminder_at = Column(DateTime, nullable=True)
    reminder_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student_eligibility'),
    )

    assignment = relationship("Assignment", back_populates="eligibilities")
    student = relationship("Student", back_populates="assignment_eligibilities")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_type = Column(String(20), default="file")  # 'file', 'drive_link'
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    drive_link = Column(String(500), nullable=True)
    status = Column(String(30), default="Submitted")  # 'Not Submitted', 'Submitted', 'Late', 'Graded', 'Returned for Resubmission'
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    marks_obtained = Column(Float, nullable=True)
    faculty_feedback = Column(Text, nullable=True)
    graded_by = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    graded_at = Column(DateTime, nullable=True)
    version = Column(Integer, default=1)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="assignment_submissions")
    grader = relationship("Faculty")


class AssignmentReminderLog(Base):
    __tablename__ = "assignment_reminder_logs"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_email = Column(String(120), nullable=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(30), default="Sent")  # 'Sent', 'Failed', 'Simulated', 'Skipped'
    attempt_count = Column(Integer, default=1)
    error_message = Column(Text, nullable=True)
    next_scheduled_time = Column(DateTime, nullable=True)

    assignment = relationship("Assignment", back_populates="reminder_logs")
    student = relationship("Student")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="General Announcement")  # 'Cultural Event', 'Symposium', 'Holiday', 'Placement Drive', 'Exam Schedule', 'General Announcement'
    poster_url = Column(String(500), nullable=True)
    event_date = Column(Date, nullable=True)
    registration_url = Column(String(500), nullable=True)
    audience_type = Column(String(50), default="all")  # 'all', 'department', 'semester', 'section'
    target_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    target_semester = Column(Integer, nullable=True)
    target_section = Column(String(10), nullable=True)
    status = Column(String(20), default="published")  # 'draft', 'published', 'archived'
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    published_at = Column(DateTime, default=datetime.datetime.utcnow)

    creator = relationship("User")
    target_department = relationship("Department")
    notifications = relationship("Notification", back_populates="announcement", cascade="all, delete-orphan")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    academic_year = Column(String(50), default="2025-2026")
    semester = Column(Integer, default=6)
    section = Column(String(10), default="A")
    duration_minutes = Column(Integer, default=30)
    total_marks = Column(Float, default=0.0)
    start_time = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=False)
    status = Column(String(20), default="draft")  # 'draft', 'published', 'closed'
    results_published = Column(Boolean, default=False)
    allow_multiple_attempts = Column(Boolean, default=False)
    max_attempts = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    subject = relationship("Subject", back_populates="quizzes")
    faculty = relationship("Faculty", back_populates="quizzes")
    department = relationship("Department")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    assignments = relationship("QuizAssignment", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), default="mcq")  # 'mcq', 'short_answer'
    marks = Column(Float, default=1.0)
    order = Column(Integer, default=1)
    options = Column(Text, nullable=True)  # JSON-encoded array: [{"id": "A", "text": "..."}, ...]
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAssignment(Base):
    __tablename__ = "quiz_assignments"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    is_excluded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('quiz_id', 'student_id', name='uq_quiz_student_assignment'),
    )

    quiz = relationship("Quiz", back_populates="assignments")
    student = relationship("Student", back_populates="quiz_assignments")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, default=1)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="in_progress")  # 'in_progress', 'submitted', 'evaluated'
    score = Column(Float, default=0.0)
    total_marks = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint('quiz_id', 'student_id', 'attempt_number', name='uq_quiz_student_attempt'),
    )

    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("Student", back_populates="quiz_attempts")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, default=0.0)
    evaluated_at = Column(DateTime, nullable=True)
    evaluator_feedback = Column(Text, nullable=True)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion")


class StudentDocument(Base):
    __tablename__ = "student_documents"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # 'pdf', 'docx', 'txt'
    file_size = Column(Integer, nullable=False)
    extracted_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    summary_type = Column(String(50), default="quick", nullable=True)  # 'quick', 'detailed', 'topic_wise', 'exam_revision'
    processing_status = Column(String(30), default="processed")  # 'uploading', 'processing', 'processed', 'failed'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    conversations = relationship("StudentAIConversation", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("student_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0)
    chunk_text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("StudentDocument", back_populates="chunks")


class StudentAIConversation(Base):
    __tablename__ = "student_ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("student_documents.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(150), default="Notes Q&A")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="ai_conversations")
    document = relationship("StudentDocument", back_populates="conversations")
    messages = relationship("StudentAIMessage", back_populates="conversation", cascade="all, delete-orphan")


class StudentAIMessage(Base):
    __tablename__ = "student_ai_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("student_ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user', 'assistant'
    content = Column(Text, nullable=False)
    action_type = Column(String(50), nullable=True)  # 'summary', 'tanglish', 'english', 'mcqs', 'checklist', 'qa', 'key_concepts'
    sources = Column(Text, nullable=True)  # JSON-encoded array of citations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("StudentAIConversation", back_populates="messages")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type = Column(String(50), nullable=False)  # 'Medical Leave', 'Personal Leave', 'Family Emergency', 'Event Participation', 'Other'
    from_date = Column(String(20), nullable=False)
    to_date = Column(String(20), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="Pending")  # 'Pending', 'Approved', 'Rejected'
    faculty_remark = Column(Text, nullable=True)
    admin_remark = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="leave_requests")


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    semester = Column(Integer, default=6)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_type = Column(String(20), default="pdf")
    file_url = Column(String(500), nullable=True)
    file_size = Column(String(50), default="1.5 MB")
    downloads = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    faculty = relationship("Faculty", back_populates="study_materials")
    subject = relationship("Subject", back_populates="study_materials")


class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    doc_type = Column(String(100), nullable=False)  # 'Bonafide Certificate', 'Transfer Certificate Request', etc.
    description = Column(Text, nullable=False)
    status = Column(String(20), default="Pending")  # 'Pending', 'Approved', 'Rejected'
    admin_reply = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="document_requests")
