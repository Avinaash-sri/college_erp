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
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


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
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(Date, nullable=False)
    max_marks = Column(Float, default=10.0)
    resource_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subject = relationship("Subject", back_populates="assignments")
    faculty = relationship("Faculty", back_populates="assignments")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
