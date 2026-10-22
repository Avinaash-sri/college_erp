-- ============================================================================
-- MASTER SUPABASE CLOUD MIGRATION SCRIPT - COLLEGE ERP
-- ============================================================================
-- Description: Sets up all PostgreSQL tables, extensions, RLS policies,
--              Supabase Storage buckets, and auto-registration trigger.
-- Safe to execute: Fully idempotent with IF NOT EXISTS and ON CONFLICT.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    auth_user_id UUID NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(100) NULL,
    reset_token_expiry TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    reg_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,
    department_id INT NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    semester INT DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A',
    parent_name VARCHAR(100) NOT NULL,
    parent_email VARCHAR(120) NOT NULL,
    address VARCHAR(255) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. PARENT CONTACTS
CREATE TABLE IF NOT EXISTS public.parent_contacts (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,
    relationship_type VARCHAR(50) DEFAULT 'Parent/Guardian',
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. FACULTY
CREATE TABLE IF NOT EXISTS public.faculty (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    emp_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,
    department_id INT NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    semester INT DEFAULT 6,
    credits INT DEFAULT 3,
    faculty_id INT NULL REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_term VARCHAR(50) DEFAULT '2025-26 Term 2',
    semester INT DEFAULT 6,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_subject_enrollment UNIQUE (student_id, subject_id)
);

-- 8. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused')),
    session_name VARCHAR(50) DEFAULT 'Lecture',
    marked_by INT NULL REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. EXAMS
CREATE TABLE IF NOT EXISTS public.exams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    venue VARCHAR(100) NOT NULL,
    semester INT DEFAULT 6,
    department_id INT NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT
);

-- 10. MARKS
CREATE TABLE IF NOT EXISTS public.marks (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_type VARCHAR(50) NOT NULL,
    marks_obtained DOUBLE PRECISION NOT NULL,
    max_marks DOUBLE PRECISION NOT NULL,
    grade VARCHAR(5) NULL,
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. TIMETABLE
CREATE TABLE IF NOT EXISTS public.timetable (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id INT NULL REFERENCES public.faculty(id) ON DELETE SET NULL,
    room VARCHAR(50) NOT NULL
);

-- 12. FEES
CREATE TABLE IF NOT EXISTS public.fees (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    total_amount DOUBLE PRECISION NOT NULL,
    paid_amount DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'Pending',
    due_date DATE NOT NULL,
    receipt_no VARCHAR(100) NULL,
    payment_mode VARCHAR(50) NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. PLACEMENTS
CREATE TABLE IF NOT EXISTS public.placements (
    id SERIAL PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    package_lpa DOUBLE PRECISION NOT NULL,
    deadline DATE NOT NULL,
    eligibility TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. COMPLAINTS (Grievances)
CREATE TABLE IF NOT EXISTS public.complaints (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    faculty_response TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General Announcement',
    poster_url VARCHAR(500) NULL,
    event_date DATE NULL,
    registration_url VARCHAR(500) NULL,
    audience_type VARCHAR(50) DEFAULT 'all',
    target_department_id INT REFERENCES public.departments(id) ON DELETE SET NULL,
    target_semester INT NULL,
    target_section VARCHAR(10) NULL,
    status VARCHAR(20) DEFAULT 'published',
    created_by INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    link_url VARCHAR(255) NULL,
    announcement_id INT REFERENCES public.announcements(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    is_cleared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id INT NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    department_id INT REFERENCES public.departments(id) ON DELETE SET NULL,
    semester INT DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A',
    due_date DATE NOT NULL,
    due_time VARCHAR(20) DEFAULT '23:59',
    max_marks DOUBLE PRECISION DEFAULT 10.0,
    allowed_file_types VARCHAR(100) DEFAULT 'pdf,docx,zip,txt',
    max_file_size_mb INT DEFAULT 10,
    submission_format VARCHAR(30) DEFAULT 'both',
    allow_resubmission BOOLEAN DEFAULT TRUE,
    allow_late BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'published',
    reminder_interval_minutes INT DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure faculty_id and enhancement columns exist if table was already present
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS faculty_id INT REFERENCES public.faculty(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS department_id INT REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS semester INT DEFAULT 6;
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'A';
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS due_time VARCHAR(20) DEFAULT '23:59';
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS allowed_file_types VARCHAR(100) DEFAULT 'pdf,docx,zip,txt';
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS max_file_size_mb INT DEFAULT 10;
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS submission_format VARCHAR(30) DEFAULT 'both';
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS allow_late BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS reminder_interval_minutes INT DEFAULT 60;

-- 18. ASSIGNMENT SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_type VARCHAR(20) DEFAULT 'file',
    file_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    file_size INT NULL,
    drive_link VARCHAR(500) NULL,
    status VARCHAR(30) DEFAULT 'Submitted',
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    marks_obtained DOUBLE PRECISION NULL,
    faculty_feedback TEXT NULL,
    graded_by INT REFERENCES public.faculty(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ NULL,
    version INT DEFAULT 1
);

-- 19. ASSIGNMENT ELIGIBILITY
CREATE TABLE IF NOT EXISTS public.assignment_eligibility (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    is_excluded BOOLEAN DEFAULT FALSE,
    last_reminder_sent_at TIMESTAMPTZ NULL,
    next_reminder_at TIMESTAMPTZ NULL,
    reminder_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_assignment_student_eligibility UNIQUE (assignment_id, student_id)
);

-- 20. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id INT NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) DEFAULT '2025-2026',
    semester INT DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A',
    duration_minutes INT DEFAULT 30,
    total_marks DOUBLE PRECISION DEFAULT 0.0,
    start_time TIMESTAMPTZ NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'published',
    results_published BOOLEAN DEFAULT FALSE,
    allow_multiple_attempts BOOLEAN DEFAULT FALSE,
    max_attempts INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 21. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'mcq',
    marks DOUBLE PRECISION DEFAULT 1.0,
    "order" INT DEFAULT 1,
    options TEXT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NULL
);

-- 22. QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ NULL,
    status VARCHAR(20) DEFAULT 'in_progress',
    score DOUBLE PRECISION DEFAULT 0.0,
    total_marks DOUBLE PRECISION DEFAULT 0.0,
    feedback TEXT NULL,
    CONSTRAINT uq_quiz_student_attempt UNIQUE (quiz_id, student_id, attempt_number)
);

-- 23. QUIZ ANSWERS
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INT NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answer TEXT NULL,
    is_correct BOOLEAN NULL,
    marks_awarded DOUBLE PRECISION DEFAULT 0.0,
    evaluated_at TIMESTAMPTZ NULL,
    evaluator_feedback TEXT NULL
);

-- 24. STUDENT DOCUMENTS (AI Assistant)
CREATE TABLE IF NOT EXISTS public.student_documents (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size INT NOT NULL,
    extracted_text TEXT NOT NULL,
    summary TEXT NULL,
    processing_status VARCHAR(30) DEFAULT 'processed',
    error_message TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUPABASE AUTH AUTO-PROFILE TRIGGER
-- When a user registers through Supabase Auth, securely provision public.users
-- and a fresh public.students record with role 'student'.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id INT;
    meta_name VARCHAR(100);
    meta_reg_no VARCHAR(50);
    meta_dept_id INT;
    meta_parent_name VARCHAR(100);
    meta_parent_email VARCHAR(120);
    meta_phone VARCHAR(20);
    meta_address VARCHAR(255);
BEGIN
    meta_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    meta_reg_no := COALESCE(NEW.raw_user_meta_data->>'reg_no', '21REG' || floor(random() * 899 + 100)::text);
    meta_dept_id := COALESCE((NEW.raw_user_meta_data->>'department_id')::int, 3);
    meta_parent_name := COALESCE(NEW.raw_user_meta_data->>'parent_name', 'Parent of ' || meta_name);
    meta_parent_email := COALESCE(NEW.raw_user_meta_data->>'parent_email', 'parent.' || split_part(NEW.email, '@', 1) || '@gmail.com');
    meta_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '9840000000');
    meta_address := COALESCE(NEW.raw_user_meta_data->>'address', 'Chennai, Tamil Nadu');

    -- Insert into public.users (strictly 'student' role for public signups)
    INSERT INTO public.users (auth_user_id, email, role, is_active)
    VALUES (NEW.id, NEW.email, 'student', true)
    ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id
    RETURNING id INTO new_user_id;

    -- Create fresh student profile
    INSERT INTO public.students (
        user_id, reg_no, name, email, phone, department_id,
        semester, section, parent_name, parent_email, address
    )
    VALUES (
        new_user_id, meta_reg_no, meta_name, NEW.email, meta_phone,
        meta_dept_id, 6, 'A', meta_parent_name, meta_parent_email, meta_address
    )
    ON CONFLICT (reg_no) DO NOTHING;

    -- Create parent contact
    INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
    SELECT s.id, meta_parent_name, meta_parent_email, meta_phone, 'Parent/Guardian', true
    FROM public.students s WHERE s.user_id = new_user_id
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users if running in Supabase environment
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated read policies for public entities
DROP POLICY IF EXISTS "Allow read announcements" ON public.announcements;
CREATE POLICY "Allow read announcements" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read quizzes" ON public.quizzes;
CREATE POLICY "Allow read quizzes" ON public.quizzes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read assignments" ON public.assignments;
CREATE POLICY "Allow read assignments" ON public.assignments FOR SELECT USING (true);

-- Marks RLS policies
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read marks" ON public.marks;
CREATE POLICY "Allow read marks" ON public.marks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow faculty insert marks" ON public.marks;
CREATE POLICY "Allow faculty insert marks" ON public.marks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow faculty update marks" ON public.marks;
CREATE POLICY "Allow faculty update marks" ON public.marks FOR UPDATE USING (true);

-- Notifications RLS policies
DROP POLICY IF EXISTS "Allow read notifications" ON public.notifications;
CREATE POLICY "Allow read notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;
CREATE POLICY "Allow update notifications" ON public.notifications FOR UPDATE USING (true);

-- Student documents (Notes) RLS policies
DROP POLICY IF EXISTS "Allow read student documents" ON public.student_documents;
CREATE POLICY "Allow read student documents" ON public.student_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert student documents" ON public.student_documents;
CREATE POLICY "Allow insert student documents" ON public.student_documents FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete student documents" ON public.student_documents;
CREATE POLICY "Allow delete student documents" ON public.student_documents FOR DELETE USING (true);


