"""
Generator for database/supabase_master_online_cloud.sql
Creates the complete, all-in-one idempotent SQL setup script for Supabase Cloud.
Can be executed directly in the Supabase SQL Editor.
"""
import os
import sys

# Import students and data from generate_chennai_seed
sys.path.append(os.path.dirname(__file__))
from generate_chennai_seed import ECE_STUDENTS, IT_STUDENTS, CSE_STUDENTS, DEPARTMENTS, SUBJECTS

def build_sql():
    sql = []
    sql.append("-- ============================================================================")
    sql.append("-- MASTER SUPABASE CLOUD SETUP - ALL-IN-ONE PRODUCTION DATABASE")
    sql.append("-- ============================================================================")
    sql.append("-- Project URL: https://wydblgfxdxrwvxhfrjdx.supabase.co")
    sql.append("-- INSTRUCTIONS:")
    sql.append("-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/wydblgfxdxrwvxhfrjdx/sql/new")
    sql.append("-- 2. Paste this ENTIRE script into the SQL editor and click 'RUN'.")
    sql.append("-- 3. It will safely create all tables, storage buckets, RLS policies,")
    sql.append("--    auth triggers, and seed 60 students, faculty, admin, fees, calendar, and timetables.")
    sql.append("-- ============================================================================\n")

    sql.append('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n')

    # 1. DEPARTMENTS
    sql.append("""-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dept_code ON public.departments(code);
""")

    # 2. USERS
    sql.append("""-- 2. USERS
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
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
""")

    # 3. STUDENTS
    sql.append("""-- 3. STUDENTS
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
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS cgpa DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS total_credits DOUBLE PRECISION DEFAULT 0.0;
CREATE INDEX IF NOT EXISTS idx_student_reg ON public.students(reg_no);
CREATE INDEX IF NOT EXISTS idx_student_dept_sem ON public.students(department_id, semester);
CREATE INDEX IF NOT EXISTS idx_student_parent_email ON public.students(parent_email);
""")

    # 4. PARENT CONTACTS
    sql.append("""-- 4. PARENT CONTACTS
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
CREATE INDEX IF NOT EXISTS idx_parent_student_id ON public.parent_contacts(student_id);
""")

    # 5. FACULTY
    sql.append("""-- 5. FACULTY
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
CREATE INDEX IF NOT EXISTS idx_faculty_emp ON public.faculty(emp_id);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON public.faculty(department_id);
""")

    # 6. SUBJECTS
    sql.append("""-- 6. SUBJECTS
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
CREATE INDEX IF NOT EXISTS idx_subject_code ON public.subjects(code);
""")

    # 7. ENROLLMENTS
    sql.append("""-- 7. ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_term VARCHAR(50) DEFAULT '2025-26 Term 2',
    semester INT DEFAULT 6,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_subject_enrollment UNIQUE (student_id, subject_id)
);
""")

    # 8. ATTENDANCE
    sql.append("""-- 8. ATTENDANCE
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
CREATE INDEX IF NOT EXISTS idx_att_student_date ON public.attendance(student_id, date);
""")

    # 9. EXAMS
    sql.append("""-- 9. EXAMS
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
""")

    # 10. MARKS
    sql.append("""-- 10. MARKS
CREATE TABLE IF NOT EXISTS public.marks (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_type VARCHAR(50) DEFAULT 'CIA-1',
    marks_obtained DOUBLE PRECISION DEFAULT 0.0,
    max_marks DOUBLE PRECISION DEFAULT 100.0,
    internal_1 DOUBLE PRECISION DEFAULT 0.0,
    internal_2 DOUBLE PRECISION DEFAULT 0.0,
    assignment DOUBLE PRECISION DEFAULT 0.0,
    total DOUBLE PRECISION DEFAULT 0.0,
    grade VARCHAR(10) DEFAULT 'A',
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS internal_1 DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS internal_2 DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS assignment DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS total DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS exam_type VARCHAR(50) DEFAULT 'CIA-1';
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS marks_obtained DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS max_marks DOUBLE PRECISION DEFAULT 100.0;
ALTER TABLE IF EXISTS public.marks ADD COLUMN IF NOT EXISTS remarks VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_marks_student ON public.marks(student_id);
""")

    # 11. TIMETABLE
    sql.append("""-- 11. TIMETABLE
CREATE TABLE IF NOT EXISTS public.timetable (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INT NOT NULL DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A',
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id INT NULL REFERENCES public.faculty(id) ON DELETE SET NULL,
    room VARCHAR(50) NOT NULL
);
ALTER TABLE IF EXISTS public.timetable ADD COLUMN IF NOT EXISTS department_id INT REFERENCES public.departments(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.timetable ADD COLUMN IF NOT EXISTS semester INT DEFAULT 6;
ALTER TABLE IF EXISTS public.timetable ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'A';
ALTER TABLE IF EXISTS public.timetable ALTER COLUMN faculty_id DROP NOT NULL;
""")

    # 12. FEES
    sql.append("""-- 12. FEES
CREATE TABLE IF NOT EXISTS public.fees (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title VARCHAR(100) DEFAULT 'Semester Tuition & Academic Fee',
    academic_year VARCHAR(20) DEFAULT '2025-2026',
    total_amount DOUBLE PRECISION NOT NULL,
    paid_amount DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'Pending',
    due_date DATE NOT NULL,
    receipt_no VARCHAR(100) NULL,
    payment_mode VARCHAR(50) NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS title VARCHAR(100) DEFAULT 'Semester Tuition & Academic Fee';
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2025-2026';
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(100);
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50);
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_fees_student ON public.fees(student_id);
""")

    # 13. PLACEMENTS
    sql.append("""-- 13. PLACEMENTS
CREATE TABLE IF NOT EXISTS public.placements (
    id SERIAL PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    package_lpa DOUBLE PRECISION NOT NULL,
    deadline DATE NOT NULL,
    eligibility TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
""")

    # 14. COMPLAINTS (Grievances)
    sql.append("""-- 14. COMPLAINTS (Grievances)
CREATE TABLE IF NOT EXISTS public.complaints (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    user_id INT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    title VARCHAR(150) NULL,
    subject VARCHAR(150) NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Academic',
    status VARCHAR(20) DEFAULT 'Pending',
    response TEXT NULL,
    faculty_response TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE IF EXISTS public.complaints ADD COLUMN IF NOT EXISTS title VARCHAR(150);
ALTER TABLE IF EXISTS public.complaints ADD COLUMN IF NOT EXISTS subject VARCHAR(150);
ALTER TABLE IF EXISTS public.complaints ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE IF EXISTS public.complaints ADD COLUMN IF NOT EXISTS faculty_response TEXT;
ALTER TABLE IF EXISTS public.complaints ALTER COLUMN user_id DROP NOT NULL;
""")

    # 15. LEAVE REQUESTS
    sql.append("""-- 15. LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    from_date VARCHAR(20) NOT NULL,
    to_date VARCHAR(20) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending',
    faculty_remark TEXT NULL,
    admin_remark TEXT NULL,
    reviewed_by VARCHAR(100) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE IF EXISTS public.leave_requests ADD COLUMN IF NOT EXISTS from_date VARCHAR(20);
ALTER TABLE IF EXISTS public.leave_requests ADD COLUMN IF NOT EXISTS to_date VARCHAR(20);
ALTER TABLE IF EXISTS public.leave_requests ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE IF EXISTS public.leave_requests ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE IF EXISTS public.leave_requests ADD COLUMN IF NOT EXISTS faculty_remark TEXT;
ALTER TABLE IF EXISTS public.leave_requests ADD COLUMN IF NOT EXISTS admin_remark TEXT;
ALTER TABLE IF EXISTS public.leave_requests ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(100);
""")

    # 16. CALENDAR EVENTS
    sql.append("""-- 16. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'Academic',
    type VARCHAR(50) DEFAULT 'event',
    date VARCHAR(20) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    description TEXT NULL,
    audience VARCHAR(50) DEFAULT 'all',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Academic';
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'event';
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS date VARCHAR(20);
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS end_date DATE;
""")

    # 17. SYSTEM SETTINGS
    sql.append("""-- 17. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL
);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.system_settings(key);
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS college_name VARCHAR(150);
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS current_term VARCHAR(50);
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS attendance_threshold DOUBLE PRECISION DEFAULT 75.0;
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
""")

    # 18. ANNOUNCEMENTS
    sql.append("""-- 18. ANNOUNCEMENTS
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
""")

    # 19. NOTIFICATIONS
    sql.append("""-- 19. NOTIFICATIONS
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
""")

    # 20. ASSIGNMENTS
    sql.append("""-- 20. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id INT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    created_by INT NULL REFERENCES public.faculty(id) ON DELETE SET NULL,
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
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS faculty_id INT REFERENCES public.faculty(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS created_by INT REFERENCES public.faculty(id) ON DELETE SET NULL;
""")

    # 21. ASSIGNMENT SUBMISSIONS
    sql.append("""-- 21. ASSIGNMENT SUBMISSIONS
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
""")

    # 22. QUIZZES
    sql.append("""-- 22. QUIZZES
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
""")

    # 23. QUIZ QUESTIONS
    sql.append("""-- 23. QUIZ QUESTIONS
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
""")

    # 24. QUIZ ATTEMPTS & ANSWERS
    sql.append("""-- 24. QUIZ ATTEMPTS & ANSWERS
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
""")

    # 25. STUDENT DOCUMENTS
    sql.append("""-- 25. STUDENT DOCUMENTS
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
""")

    # 26. STUDY MATERIALS
    sql.append("""-- 26. STUDY MATERIALS
CREATE TABLE IF NOT EXISTS public.study_materials (
    id SERIAL PRIMARY KEY,
    faculty_id INT NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    subject_id INT NULL REFERENCES public.subjects(id) ON DELETE SET NULL,
    department_id INT NULL REFERENCES public.departments(id) ON DELETE SET NULL,
    semester INT DEFAULT 6,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    file_type VARCHAR(20) DEFAULT 'pdf',
    file_url VARCHAR(500) NULL,
    file_size VARCHAR(50) DEFAULT '1.5 MB',
    downloads INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
""")

    # 27. DOCUMENT REQUESTS
    sql.append("""-- 27. DOCUMENT REQUESTS
CREATE TABLE IF NOT EXISTS public.document_requests (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    doc_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    admin_reply TEXT NULL,
    reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
""")

    # Storage Buckets Setup
    sql.append("""-- ============================================================================
-- SUPABASE STORAGE BUCKETS (assignments, documents, circulars)
-- ============================================================================
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
        ('assignments', 'assignments', true),
        ('documents', 'documents', true),
        ('circulars', 'circulars', true)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DROP POLICY IF EXISTS "allow_public_select_storage" ON storage.objects;
        CREATE POLICY "allow_public_select_storage" ON storage.objects FOR SELECT USING (true);
        DROP POLICY IF EXISTS "allow_public_insert_storage" ON storage.objects;
        CREATE POLICY "allow_public_insert_storage" ON storage.objects FOR INSERT WITH CHECK (true);
        DROP POLICY IF EXISTS "allow_public_update_storage" ON storage.objects;
        CREATE POLICY "allow_public_update_storage" ON storage.objects FOR UPDATE USING (true);
        DROP POLICY IF EXISTS "allow_public_delete_storage" ON storage.objects;
        CREATE POLICY "allow_public_delete_storage" ON storage.objects FOR DELETE USING (true);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore if storage extension is not present in local pg
END $$;
""")

    # Auth Auto-Profile Trigger
    sql.append("""-- ============================================================================
-- SUPABASE AUTH AUTO-PROFILE TRIGGER
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

    INSERT INTO public.users (auth_user_id, email, role, is_active)
    VALUES (NEW.id, NEW.email, 'student', true)
    ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id
    RETURNING id INTO new_user_id;

    INSERT INTO public.students (
        user_id, reg_no, name, email, phone, department_id,
        semester, section, parent_name, parent_email, address
    )
    VALUES (
        new_user_id, meta_reg_no, meta_name, NEW.email, meta_phone,
        meta_dept_id, 6, 'A', meta_parent_name, meta_parent_email, meta_address
    )
    ON CONFLICT (reg_no) DO NOTHING;

    INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
    SELECT s.id, meta_parent_name, meta_parent_email, meta_phone, 'Parent/Guardian', true
    FROM public.students s WHERE s.user_id = new_user_id
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
END $$;
""")

    # Enable RLS on all tables with permissive policies
    sql.append("""-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'departments', 'users', 'students', 'parent_contacts', 'faculty', 'subjects',
        'enrollments', 'attendance', 'exams', 'marks', 'timetable', 'fees',
        'placements', 'complaints', 'leave_requests', 'calendar_events', 'system_settings',
        'announcements', 'notifications', 'assignments', 'assignment_submissions',
        'quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_answers', 'student_documents',
        'study_materials', 'document_requests'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_ops_%s" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "allow_all_ops_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;
""")

    # SEED DATA
    sql.append("""-- ============================================================================
-- MASTER SEED DATA
-- ============================================================================
""")

    # Departments
    sql.append("-- Departments")
    for d_id, code, name in DEPARTMENTS:
        sql.append(f"INSERT INTO public.departments (id, code, name) VALUES ({d_id}, '{code}', '{name}') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;")
    sql.append("")

    # Admin User
    sql.append("-- Admin Account (admin@college.edu / password123)")
    sql.append("INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('admin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'admin', true) ON CONFLICT (email) DO UPDATE SET role = 'admin';\n")

    # Faculty Accounts
    sql.append("-- Faculty Accounts (kavitha@college.edu, suresh@college.edu, priya@college.edu / password123)")
    faculty_list = [
        ("kavitha@college.edu", "EMP_CSE_01", "Dr. Kavitha Raman", "9840123456", 3, "Professor & HOD"),
        ("suresh@college.edu", "EMP_ECE_01", "Dr. Suresh Kumar", "9840234567", 1, "Associate Professor"),
        ("priya@college.edu", "EMP_IT_01", "Dr. Priya Sundaram", "9840345678", 2, "Assistant Professor")
    ]
    for email, emp_id, name, phone, dept_id, designation in faculty_list:
        sql.append(f"INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('{email}', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'faculty', true) ON CONFLICT (email) DO UPDATE SET role = 'faculty';")
        sql.append(f"""INSERT INTO public.faculty (user_id, emp_id, name, email, phone, department_id, designation)
SELECT id, '{emp_id}', '{name}', '{email}', '{phone}', {dept_id}, '{designation}'
FROM public.users WHERE email = '{email}'
ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name;
""")

    # Subjects
    sql.append("-- Subjects")
    for s_id, code, name, dept_id, sem, cred in SUBJECTS:
        sql.append(f"""INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT {s_id}, '{code}', '{name}', {dept_id}, {sem}, {cred}, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;""")
    sql.append("")

    # System Settings (Key-Value Schema)
    sql.append("""-- System Settings (Canonical Key-Value Store)
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('SAFE_THRESHOLD', '75.0', 'Mandatory minimum attendance percentage required for exam eligibility'),
    ('WARNING_THRESHOLD', '65.0', 'Lower bound percentage for warning status before high risk alert'),
    ('COLLEGE_NAME', 'Cloud Institute of Technology & Science', 'Official college institution title'),
    ('ACADEMIC_YEAR', '2025-2026', 'Active academic term year identifier'),
    ('CURRENT_TERM', 'Even Semester (Spring 2026)', 'Active academic term'),
    ('AUTO_EMAIL_ALERT', 'true', 'Enable automatic parent email notification when attendance is strictly below 75%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
""")

    # Calendar Events
    sql.append("""-- Calendar Events
INSERT INTO public.calendar_events (id, title, category, type, date, description, audience)
VALUES 
    (1, 'Even Semester Commencement', 'Academic', 'event', '2026-01-05', 'Inaugural address and orientation for Spring 2026 term.', 'all'),
    (2, 'Continuous Internal Assessment (CIA-1)', 'Exam', 'exam', '2026-02-16', 'First internal continuous evaluation cycle for all engineering programs.', 'all'),
    (3, 'National Technical Symposium (TECHFEST 2026)', 'Event', 'event', '2026-03-05', 'Inter-collegiate project exhibition, hackathon, and paper presentations.', 'all'),
    (4, 'Continuous Internal Assessment (CIA-2)', 'Exam', 'exam', '2026-04-06', 'Second internal continuous evaluation cycle covering units 3 and 4.', 'all'),
    (5, 'Model Practical & Viva Voce Examinations', 'Exam', 'exam', '2026-04-20', 'Laboratory practical examinations and project progress reviews.', 'all'),
    (6, 'Last Working Day & Hall Ticket Distribution', 'Academic', 'holiday', '2026-04-30', 'Closure of instruction, final attendance signing, and hall ticket issuance.', 'all')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
""")

    # Timetable
    sql.append("""-- Timetable Entries
INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 1, 3, 6, 'A', 'Monday', '09:00', '10:00', 7, f.id, 'LH-301' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;

INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 2, 3, 6, 'A', 'Monday', '10:00', '11:00', 8, f.id, 'LH-301' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;

INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 3, 3, 6, 'A', 'Monday', '11:15', '12:15', 9, f.id, 'LH-301' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;

INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 4, 3, 6, 'A', 'Tuesday', '09:00', '10:00', 8, f.id, 'LH-301' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;

INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 5, 3, 6, 'A', 'Tuesday', '10:00', '11:00', 7, f.id, 'LH-301' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;

INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 6, 3, 6, 'A', 'Wednesday', '09:00', '11:00', 9, f.id, 'Distributed Systems Lab 1' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;

INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 7, 3, 6, 'A', 'Thursday', '09:00', '10:00', 7, f.id, 'LH-301' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;

INSERT INTO public.timetable (id, department_id, semester, section, day_of_week, start_time, end_time, subject_id, faculty_id, room)
SELECT 8, 3, 6, 'A', 'Friday', '10:00', '11:00', 8, f.id, 'LH-301' FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET room = EXCLUDED.room;
""")

    # Announcements
    sql.append("""-- Announcements
INSERT INTO public.announcements (id, title, description, category, audience_type, status, created_by)
SELECT 1, 'End Semester Exam Schedule Published', 'The official examination timetable for Even Semester 2025-26 has been approved by the Controller of Examinations. Hall tickets will be issued next week.', 'Academic Notice', 'all', 'published', u.id
FROM public.users u WHERE u.email = 'admin@college.edu'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.announcements (id, title, description, category, audience_type, status, created_by)
SELECT 2, 'Annual Inter-College Tech Fest "INNOVENT 2026"', 'Registration is now open for the annual hackathon and robotics showcase with cash prizes exceeding 2 Lakhs. Teams of up to 4 can register.', 'Event Announcement', 'all', 'published', u.id
FROM public.users u WHERE u.email = 'admin@college.edu'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
""")

    # 60 Students per Department
    def process_dept_students(dept_code, dept_id, student_list):
        lines = [f"-- {dept_code} Students (20 Students)"]
        dept_subject_ids = [1, 2, 3] if dept_id == 1 else ([4, 5, 6] if dept_id == 2 else [7, 8, 9])
        
        for idx, (name, email, parent_name, parent_email, att_pct, risk) in enumerate(student_list, start=1):
            reg_no = f"21{dept_code[:2]}{100 + idx}"
            phone = f"9841{idx:02d}00{idx:02d}"

            # Distinct score generator based on academic performance and unique seed
            base = 88.0 if att_pct >= 85 else (76.0 if att_pct >= 72 else 58.0)
            off1 = ((idx * 7 + dept_id * 3) % 11) - 4
            off2 = ((idx * 11 + dept_id * 5) % 9) - 3
            off3 = ((idx * 13 + dept_id * 7) % 11) - 5

            m1 = max(42.0, min(98.0, round(base + off1, 1)))
            m2 = max(45.0, min(97.0, round(base + off2, 1)))
            m3 = max(40.0, min(99.0, round(base + off3, 1)))

            def grade_info(score):
                if score >= 91: return (10.0, 'O')
                if score >= 81: return (9.0, 'A+')
                if score >= 71: return (8.0, 'A')
                if score >= 61: return (7.0, 'B+')
                if score >= 50: return (6.0, 'B')
                if score >= 40: return (5.0, 'C')
                return (0.0, 'F')

            gp1, gr1 = grade_info(m1)
            gp2, gr2 = grade_info(m2)
            gp3, gr3 = grade_info(m3)

            # Credits: Sub1 = 4, Sub2 = 4, Sub3 = 3 -> Total 11 credits
            weighted = gp1 * 4.0 + gp2 * 4.0 + gp3 * 3.0
            cgpa = round(weighted / 11.0, 2)

            lines.append(f"INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('{email}', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;")
            lines.append(f"""INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '{reg_no}', '{name}', '{email}', '{phone}', {dept_id}, 6, 'A', '{parent_name}', '{parent_email}', 'Chennai, Tamil Nadu', {cgpa}, 11.0
FROM public.users WHERE email = '{email}'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = {cgpa}, total_credits = 11.0;""")

            lines.append(f"""INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, '{parent_name}', '{parent_email}', '{phone}', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '{reg_no}'
ON CONFLICT DO NOTHING;""")

            # Insert individual subject marks into public.marks
            lines.append(f"""INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, {dept_subject_ids[0]}, 'CIA-1', {m1}, 100.0, {m1}, '{gr1}', 'Evaluated'
FROM public.students s WHERE s.reg_no = '{reg_no}'
ON CONFLICT DO NOTHING;""")
            lines.append(f"""INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, {dept_subject_ids[1]}, 'CIA-1', {m2}, 100.0, {m2}, '{gr2}', 'Evaluated'
FROM public.students s WHERE s.reg_no = '{reg_no}'
ON CONFLICT DO NOTHING;""")
            lines.append(f"""INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, {dept_subject_ids[2]}, 'CIA-1', {m3}, 100.0, {m3}, '{gr3}', 'Evaluated'
FROM public.students s WHERE s.reg_no = '{reg_no}'
ON CONFLICT DO NOTHING;""")

            # Fees (using title and academic_year)
            paid = 65000.0 if att_pct > 70 else 35000.0
            status = 'Paid' if paid == 65000.0 else 'Pending'
            lines.append(f"""INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, {paid}, '{status}', '2026-04-30', 'REC-2026-{reg_no}', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '{reg_no}'
ON CONFLICT DO NOTHING;""")

        return "\n".join(lines)

    sql.append(process_dept_students("ECE", 1, ECE_STUDENTS))
    sql.append(process_dept_students("IT", 2, IT_STUDENTS))
    sql.append(process_dept_students("CSE", 3, CSE_STUDENTS))

    # Quizzes
    sql.append("""-- Quizzes
INSERT INTO public.quizzes (id, title, description, subject_id, faculty_id, department_id, deadline, status, results_published, total_marks)
SELECT 1, 'Algorithms & Complexity MCQ Assessment', 'Unit 1 & 2 Asymptotic Analysis, Recurrences and Divide-and-Conquer paradigms.', 7, f.id, 3, '2026-05-15 23:59:00+00', 'published', true, 10.0
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, marks, "order", options, correct_answer, explanation)
VALUES
    (1, 1, 'What is the worst-case time complexity of QuickSort?', 2.5, 1, '["O(n log n)", "O(n^2)", "O(log n)", "O(n)"]', 'O(n^2)', 'Occurs when the chosen pivot is always the extreme element.'),
    (2, 1, 'Which algorithmic paradigm does MergeSort follow?', 2.5, 2, '["Greedy Approach", "Dynamic Programming", "Divide and Conquer", "Backtracking"]', 'Divide and Conquer', 'MergeSort recursively halves the array, sorts halves, and merges them.'),
    (3, 1, 'What is the best asymptotic time complexity of HeapSort?', 2.5, 3, '["O(n)", "O(n log n)", "O(n^2)", "O(log n)"]', 'O(n log n)', 'Building heap takes O(n), and n extractions each take O(log n).'),
    (4, 1, 'Which data structure is primarily used to implement Breadth First Search (BFS)?', 2.5, 4, '["Stack", "Queue", "Priority Queue", "Hash Map"]', 'Queue', 'BFS traverses nodes level by level using a FIFO Queue.')
ON CONFLICT (id) DO UPDATE SET question_text = EXCLUDED.question_text;
""")

    # Assignments
    sql.append("""-- Assignments
INSERT INTO public.assignments (id, title, description, subject_id, faculty_id, created_by, department_id, semester, section, due_date, max_marks, status)
SELECT 1, 'Design & Analysis of Algorithms - Mini-Project Report', 'Implement and compare empirical running times of QuickSort vs MergeSort across varied input sizes up to 100,000 elements.', 7, f.id, f.id, 3, 6, 'A', '2026-05-10', 10.0, 'published'
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
""")

    sql.append("\n-- ============================================================================")
    sql.append("-- SETUP COMPLETE! ALL 27 TABLES, STORAGE, POLICIES & SEED DATA READY.")
    sql.append("-- ============================================================================")

    return "\n".join(sql)

if __name__ == '__main__':
    out_path = os.path.join(os.path.dirname(__file__), 'supabase_master_online_cloud.sql')
    content = build_sql()
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully generated {out_path} ({len(content)} bytes)")
