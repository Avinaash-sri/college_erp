-- ============================================================================
-- CLOUD-BASED ERP FOR COLLEGES - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ============================================================================
-- Target Engine: Supabase PostgreSQL 15+
-- Instructions: Copy and paste this complete script into your Supabase Dashboard
--               under: SQL Editor -> New Query -> Run
-- Safe to execute: Uses IF NOT EXISTS and creates all necessary constraints and indexes.
-- ============================================================================

-- Enable UUID extension if needed in future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dept_code ON departments(code);

-- 2. USERS TABLE (Core Authentication & Role Management)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(100) NULL,
    reset_token_expiry TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    reg_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    semester INT DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A',
    parent_name VARCHAR(100) NOT NULL,
    parent_email VARCHAR(120) NOT NULL,
    address VARCHAR(255) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_reg ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_student_dept_sem ON students(department_id, semester);
CREATE INDEX IF NOT EXISTS idx_student_parent_email ON students(parent_email);

-- 4. PARENT CONTACTS TABLE (Parent/Guardian Directory)
CREATE TABLE IF NOT EXISTS parent_contacts (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,
    relationship_type VARCHAR(50) DEFAULT 'Parent',
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parent_student_id ON parent_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_contacts_email ON parent_contacts(email);

-- 5. FACULTY TABLE
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    emp_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_emp ON faculty(emp_id);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON faculty(department_id);

-- 6. SUBJECTS TABLE (Courses Curriculum)
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    semester INT DEFAULT 6,
    credits INT DEFAULT 3,
    faculty_id INT NULL REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subject_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subject_dept_sem ON subjects(department_id, semester);

-- 7. ENROLLMENTS TABLE (Student to Course Mapping)
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_term VARCHAR(50) DEFAULT '2025-26 Term 2',
    semester INT DEFAULT 6,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_subject_enrollment UNIQUE (student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_subject ON enrollments(subject_id);

-- 8. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused')),
    session_name VARCHAR(50) DEFAULT 'Lecture',
    marked_by INT NULL REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_att_student_sub_date ON attendance(student_id, subject_id, date);
CREATE INDEX IF NOT EXISTS idx_att_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_att_status ON attendance(status);

-- 9. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    venue VARCHAR(100) NOT NULL,
    semester INT DEFAULT 6,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_exam_date ON exams(date);
CREATE INDEX IF NOT EXISTS idx_exam_dept_sem ON exams(department_id, semester);

-- 10. MARKS TABLE (Assessments)
CREATE TABLE IF NOT EXISTS marks (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    internal_1 DOUBLE PRECISION DEFAULT 0.0,
    internal_2 DOUBLE PRECISION DEFAULT 0.0,
    assignment DOUBLE PRECISION DEFAULT 0.0,
    total DOUBLE PRECISION DEFAULT 0.0,
    grade VARCHAR(10) DEFAULT 'A'
);

CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject ON marks(subject_id);

-- 11. FEES TABLE
CREATE TABLE IF NOT EXISTS fees (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    total_amount DOUBLE PRECISION NOT NULL,
    paid_amount DOUBLE PRECISION DEFAULT 0.0,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Paid', 'Partially Paid', 'Pending'))
);

CREATE INDEX IF NOT EXISTS idx_fee_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_status ON fees(status);

-- 12. TIMETABLE TABLE
CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    room VARCHAR(50) NOT NULL,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    semester INT DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A'
);

CREATE INDEX IF NOT EXISTS idx_timetable_lookup ON timetable(department_id, semester, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetable(faculty_id, day_of_week);

-- 13. PLACEMENTS TABLE
CREATE TABLE IF NOT EXISTS placements (
    id SERIAL PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    package_lpa DOUBLE PRECISION NOT NULL,
    eligibility VARCHAR(200) NOT NULL,
    deadline DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_placements_deadline ON placements(deadline);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE CASCADE, -- NULL = broadcast
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at);

-- 15. ATTENDANCE ALERTS & EMAIL LOGS (Audit Log for Below-75% Notifications)
CREATE TABLE IF NOT EXISTS attendance_alerts (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_pct DOUBLE PRECISION NOT NULL,
    parent_email VARCHAR(120) NOT NULL,
    alert_type VARCHAR(50) DEFAULT 'Threshold Crossed (<75%)',
    academic_term VARCHAR(50) DEFAULT '2025-26 Term 2',
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Sent', -- 'Sent', 'Pending Dispatch', 'Email Not Configured', 'Failed', 'Blocked'
    attempt_count INT DEFAULT 1,
    recovery_classes INT DEFAULT 0,
    last_error TEXT NULL,
    email_preview TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_student_term ON attendance_alerts(student_id, academic_term);
CREATE INDEX IF NOT EXISTS idx_alert_sent_at ON attendance_alerts(sent_at);
CREATE INDEX IF NOT EXISTS idx_alert_status ON attendance_alerts(status);

-- 16. COMPLAINTS / SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'Academic' CHECK (category IN ('Academic', 'Attendance', 'Facilities', 'Fees', 'Other')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    response TEXT NULL,
    resolved_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaint_student ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaint_status ON complaints(status);

-- 17. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    max_marks DOUBLE PRECISION DEFAULT 10.0,
    resource_url VARCHAR(255) NULL,
    created_by INT NULL REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignment_sub ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_due ON assignments(due_date);

-- 18. SYSTEM SETTINGS TABLE (Dynamic Institutional Configurations)
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);

-- ============================================================================
-- INITIAL SEED SETTINGS (Safe idempotent upserts)
-- ============================================================================
INSERT INTO system_settings (key, value, description)
VALUES 
    ('SAFE_THRESHOLD', '75.0', 'Mandatory minimum attendance percentage required for exam eligibility'),
    ('WARNING_THRESHOLD', '65.0', 'Lower bound percentage for warning status before high risk alert'),
    ('COLLEGE_NAME', 'Institute of Technology & Advanced Science', 'Official college institution title'),
    ('ACADEMIC_YEAR', '2025-2026', 'Active academic term year identifier'),
    ('AUTO_EMAIL_ALERT', 'true', 'Enable automatic parent email notification when attendance is strictly below 75%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- SUCCESS CONFIRMATION
-- ============================================================================
SELECT 'Cloud-Based College ERP PostgreSQL Schema Successfully Initialized!' AS status;
