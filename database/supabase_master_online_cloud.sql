-- ============================================================================
-- MASTER SUPABASE CLOUD SETUP - ALL-IN-ONE PRODUCTION DATABASE
-- ============================================================================
-- Project URL: https://wydblgfxdxrwvxhfrjdx.supabase.co
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/wydblgfxdxrwvxhfrjdx/sql/new
-- 2. Paste this ENTIRE script into the SQL editor and click 'RUN'.
-- 3. It will safely create all tables, storage buckets, RLS policies,
--    auth triggers, and seed 60 students, faculty, admin, fees, calendar, and timetables.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dept_code ON public.departments(code);

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
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

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
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS cgpa DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS total_credits DOUBLE PRECISION DEFAULT 0.0;
CREATE INDEX IF NOT EXISTS idx_student_reg ON public.students(reg_no);
CREATE INDEX IF NOT EXISTS idx_student_dept_sem ON public.students(department_id, semester);
CREATE INDEX IF NOT EXISTS idx_student_parent_email ON public.students(parent_email);

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
CREATE INDEX IF NOT EXISTS idx_parent_student_id ON public.parent_contacts(student_id);

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
CREATE INDEX IF NOT EXISTS idx_faculty_emp ON public.faculty(emp_id);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON public.faculty(department_id);

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
CREATE INDEX IF NOT EXISTS idx_subject_code ON public.subjects(code);

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
CREATE INDEX IF NOT EXISTS idx_att_student_date ON public.attendance(student_id, date);

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

-- 11. TIMETABLE
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

-- 12. FEES
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

-- 15. LEAVE REQUESTS
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

-- 16. CALENDAR EVENTS
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

-- 17. SYSTEM SETTINGS
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

-- 18. ANNOUNCEMENTS
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

-- 19. NOTIFICATIONS
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

-- 20. ASSIGNMENTS
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

-- 21. ASSIGNMENT SUBMISSIONS
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

-- 22. QUIZZES
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

-- 23. QUIZ QUESTIONS
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

-- 24. QUIZ ATTEMPTS & ANSWERS
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

-- 25. STUDENT DOCUMENTS
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

-- 26. STUDY MATERIALS
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

-- 27. DOCUMENT REQUESTS
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

-- ============================================================================
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

-- ============================================================================
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

-- ============================================================================
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

-- ============================================================================
-- MASTER SEED DATA
-- ============================================================================

-- Departments
INSERT INTO public.departments (id, code, name) VALUES (1, 'ECE', 'Electronics and Communication Engineering') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.departments (id, code, name) VALUES (2, 'IT', 'Information Technology') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.departments (id, code, name) VALUES (3, 'CSE', 'Computer Science and Engineering') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Admin Account (admin@college.edu / password123)
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('admin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'admin', true) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Faculty Accounts (kavitha@college.edu, suresh@college.edu, priya@college.edu / password123)
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('kavitha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'faculty', true) ON CONFLICT (email) DO UPDATE SET role = 'faculty';
INSERT INTO public.faculty (user_id, emp_id, name, email, phone, department_id, designation)
SELECT id, 'EMP_CSE_01', 'Dr. Kavitha Raman', 'kavitha@college.edu', '9840123456', 3, 'Professor & HOD'
FROM public.users WHERE email = 'kavitha@college.edu'
ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('suresh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'faculty', true) ON CONFLICT (email) DO UPDATE SET role = 'faculty';
INSERT INTO public.faculty (user_id, emp_id, name, email, phone, department_id, designation)
SELECT id, 'EMP_ECE_01', 'Dr. Suresh Kumar', 'suresh@college.edu', '9840234567', 1, 'Associate Professor'
FROM public.users WHERE email = 'suresh@college.edu'
ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('priya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'faculty', true) ON CONFLICT (email) DO UPDATE SET role = 'faculty';
INSERT INTO public.faculty (user_id, emp_id, name, email, phone, department_id, designation)
SELECT id, 'EMP_IT_01', 'Dr. Priya Sundaram', 'priya@college.edu', '9840345678', 2, 'Assistant Professor'
FROM public.users WHERE email = 'priya@college.edu'
ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name;

-- Subjects
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 1, 'EC601', 'Digital Signal Processing', 1, 6, 4, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 2, 'EC602', 'VLSI Design & Embedded Systems', 1, 6, 4, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 3, 'EC603', 'Wireless Communication Networks', 1, 6, 3, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 4, 'IT601', 'Cloud Computing & Virtualization', 2, 6, 4, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 5, 'IT602', 'Full-Stack Web Development', 2, 6, 4, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 6, 'IT603', 'Information Security & Cryptography', 2, 6, 3, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 7, 'CS601', 'Design and Analysis of Algorithms', 3, 6, 4, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 8, 'CS602', 'Artificial Intelligence & Machine Learning', 3, 6, 4, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 9, 'CS603', 'Database Engineering & Distributed Systems', 3, 6, 3, f.id
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- System Settings (Canonical Key-Value Store)
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('SAFE_THRESHOLD', '75.0', 'Mandatory minimum attendance percentage required for exam eligibility'),
    ('WARNING_THRESHOLD', '65.0', 'Lower bound percentage for warning status before high risk alert'),
    ('COLLEGE_NAME', 'Cloud Institute of Technology & Science', 'Official college institution title'),
    ('ACADEMIC_YEAR', '2025-2026', 'Active academic term year identifier'),
    ('CURRENT_TERM', 'Even Semester (Spring 2026)', 'Active academic term'),
    ('AUTO_EMAIL_ALERT', 'true', 'Enable automatic parent email notification when attendance is strictly below 75%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Calendar Events
INSERT INTO public.calendar_events (id, title, category, type, date, description, audience)
VALUES 
    (1, 'Even Semester Commencement', 'Academic', 'event', '2026-01-05', 'Inaugural address and orientation for Spring 2026 term.', 'all'),
    (2, 'Continuous Internal Assessment (CIA-1)', 'Exam', 'exam', '2026-02-16', 'First internal continuous evaluation cycle for all engineering programs.', 'all'),
    (3, 'National Technical Symposium (TECHFEST 2026)', 'Event', 'event', '2026-03-05', 'Inter-collegiate project exhibition, hackathon, and paper presentations.', 'all'),
    (4, 'Continuous Internal Assessment (CIA-2)', 'Exam', 'exam', '2026-04-06', 'Second internal continuous evaluation cycle covering units 3 and 4.', 'all'),
    (5, 'Model Practical & Viva Voce Examinations', 'Exam', 'exam', '2026-04-20', 'Laboratory practical examinations and project progress reviews.', 'all'),
    (6, 'Last Working Day & Hall Ticket Distribution', 'Academic', 'holiday', '2026-04-30', 'Closure of instruction, final attendance signing, and hall ticket issuance.', 'all')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Timetable Entries
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

-- Announcements
INSERT INTO public.announcements (id, title, description, category, audience_type, status, created_by)
SELECT 1, 'End Semester Exam Schedule Published', 'The official examination timetable for Even Semester 2025-26 has been approved by the Controller of Examinations. Hall tickets will be issued next week.', 'Academic Notice', 'all', 'published', u.id
FROM public.users u WHERE u.email = 'admin@college.edu'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.announcements (id, title, description, category, audience_type, status, created_by)
SELECT 2, 'Annual Inter-College Tech Fest "INNOVENT 2026"', 'Registration is now open for the annual hackathon and robotics showcase with cash prizes exceeding 2 Lakhs. Teams of up to 4 can register.', 'Event Announcement', 'all', 'published', u.id
FROM public.users u WHERE u.email = 'admin@college.edu'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- ECE Students (20 Students)
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('harish@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC101', 'Harish Prabhu', 'harish@college.edu', '9841010001', 1, 6, 'A', 'Prabhu Ramanathan', 'prabhu.r@gmail.com', 'Chennai, Tamil Nadu', 8.36, 11.0
FROM public.users WHERE email = 'harish@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Prabhu Ramanathan', 'prabhu.r@gmail.com', '9841010001', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 82.0, 100.0, 82.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 80.0, 100.0, 80.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 80.0, 100.0, 80.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC101', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('dharani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC102', 'Dharani V', 'dharani@college.edu', '9841020002', 1, 6, 'A', 'Vijay Anand', 'vijay.anand@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'dharani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Vijay Anand', 'vijay.anand@gmail.com', '9841020002', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 73.0, 100.0, 73.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 71.0, 100.0, 71.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC102', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('manoj@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC103', 'Manoj Kumar', 'manoj@college.edu', '9841030003', 1, 6, 'A', 'Kumaraswamy M', 'kumar.m@gmail.com', 'Chennai, Tamil Nadu', 6.0, 11.0
FROM public.users WHERE email = 'manoj@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Kumaraswamy M', 'kumar.m@gmail.com', '9841030003', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 56.0, 100.0, 56.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 57.0, 100.0, 57.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 55.0, 100.0, 55.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21EC103', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('keerthana@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC104', 'Keerthana R', 'keerthana@college.edu', '9841040004', 1, 6, 'A', 'Ramesh Kumar', 'ramesh.k@gmail.com', 'Chennai, Tamil Nadu', 9.36, 11.0
FROM public.users WHERE email = 'keerthana@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Ramesh Kumar', 'ramesh.k@gmail.com', '9841040004', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 93.0, 100.0, 93.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 89.0, 100.0, 89.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 87.0, 100.0, 87.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC104', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('sathish@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC105', 'Sathish Kumar', 'sathish@college.edu', '9841050005', 1, 6, 'A', 'Murugan K', 'murugan.k@gmail.com', 'Chennai, Tamil Nadu', 6.36, 11.0
FROM public.users WHERE email = 'sathish@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Murugan K', 'murugan.k@gmail.com', '9841050005', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 59.0, 100.0, 59.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 61.0, 100.0, 61.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 59.0, 100.0, 59.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21EC105', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('divya.b@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC106', 'Divya Bharathi', 'divya.b@college.edu', '9841060006', 1, 6, 'A', 'Sundaram P', 'sundaram.p@gmail.com', 'Chennai, Tamil Nadu', 9.64, 11.0
FROM public.users WHERE email = 'divya.b@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.64, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Sundaram P', 'sundaram.p@gmail.com', '9841060006', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 93.0, 100.0, 93.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 91.0, 100.0, 91.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC106', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('praveen@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC107', 'Praveen Chandran', 'praveen@college.edu', '9841070007', 1, 6, 'A', 'Chandran S', 'chandran.s@gmail.com', 'Chennai, Tamil Nadu', 8.27, 11.0
FROM public.users WHERE email = 'praveen@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.27, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Chandran S', 'chandran.s@gmail.com', '9841070007', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 80.0, 100.0, 80.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 74.0, 100.0, 74.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC107', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('subhashini@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC108', 'Subhashini M', 'subhashini@college.edu', '9841080008', 1, 6, 'A', 'Mani V', 'mani.v@gmail.com', 'Chennai, Tamil Nadu', 9.0, 11.0
FROM public.users WHERE email = 'subhashini@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Mani V', 'mani.v@gmail.com', '9841080008', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 88.0, 100.0, 88.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 88.0, 100.0, 88.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 84.0, 100.0, 84.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC108', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('vignesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC109', 'Vigneshwaran K', 'vignesh@college.edu', '9841090009', 1, 6, 'A', 'Krishnan G', 'krishnan.g@gmail.com', 'Chennai, Tamil Nadu', 6.0, 11.0
FROM public.users WHERE email = 'vignesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Krishnan G', 'krishnan.g@gmail.com', '9841090009', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 54.0, 100.0, 54.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 60.0, 100.0, 60.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 56.0, 100.0, 56.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21EC109', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('lavanya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC110', 'Lavanya S', 'lavanya@college.edu', '9841100010', 1, 6, 'A', 'Selvaraj T', 'selvaraj.t@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'lavanya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Selvaraj T', 'selvaraj.t@gmail.com', '9841100010', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 79.0, 100.0, 79.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 80.0, 100.0, 80.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC110', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('aravind@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC111', 'Aravind Swamy', 'aravind@college.edu', '9841110011', 1, 6, 'A', 'Swaminathan R', 'swami.r@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'aravind@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Swaminathan R', 'swami.r@gmail.com', '9841110011', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 73.0, 100.0, 73.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC111', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('deepika@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC112', 'Deepika N', 'deepika@college.edu', '9841120012', 1, 6, 'A', 'Natarajan S', 'natarajan.s@gmail.com', 'Chennai, Tamil Nadu', 6.64, 11.0
FROM public.users WHERE email = 'deepika@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.64, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Natarajan S', 'natarajan.s@gmail.com', '9841120012', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 64.0, 100.0, 64.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 57.0, 100.0, 57.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 62.0, 100.0, 62.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21EC112', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('karthik.p@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC113', 'Karthikeyan P', 'karthik.p@college.edu', '9841130013', 1, 6, 'A', 'Perumal K', 'perumal.k@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'karthik.p@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Perumal K', 'perumal.k@gmail.com', '9841130013', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 77.0, 100.0, 77.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 71.0, 100.0, 71.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC113', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('sandhya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC114', 'Sandhya V', 'sandhya@college.edu', '9841140014', 1, 6, 'A', 'Venkatesan R', 'venkat.r@gmail.com', 'Chennai, Tamil Nadu', 9.36, 11.0
FROM public.users WHERE email = 'sandhya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Venkatesan R', 'venkat.r@gmail.com', '9841140014', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 86.0, 100.0, 86.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 91.0, 100.0, 91.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC114', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('saravanan@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC115', 'Saravanan B', 'saravanan@college.edu', '9841150015', 1, 6, 'A', 'Baskaran K', 'baskaran.k@gmail.com', 'Chennai, Tamil Nadu', 6.73, 11.0
FROM public.users WHERE email = 'saravanan@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.73, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Baskaran K', 'baskaran.k@gmail.com', '9841150015', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 63.0, 100.0, 63.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 63.0, 100.0, 63.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 57.0, 100.0, 57.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21EC115', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('monisha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC116', 'Monisha T', 'monisha@college.edu', '9841160016', 1, 6, 'A', 'Thangaraj M', 'thangaraj.m@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'monisha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Thangaraj M', 'thangaraj.m@gmail.com', '9841160016', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 77.0, 100.0, 77.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 74.0, 100.0, 74.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 77.0, 100.0, 77.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC116', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('ganesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC117', 'Ganesh Moorthy', 'ganesh@college.edu', '9841170017', 1, 6, 'A', 'Moorthy S', 'moorthy.s@gmail.com', 'Chennai, Tamil Nadu', 6.27, 11.0
FROM public.users WHERE email = 'ganesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.27, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Moorthy S', 'moorthy.s@gmail.com', '9841170017', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 55.0, 100.0, 55.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 58.0, 100.0, 58.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 61.0, 100.0, 61.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC117', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('shalini@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC118', 'Shalini P', 'shalini@college.edu', '9841180018', 1, 6, 'A', 'Palani M', 'palani.m@gmail.com', 'Chennai, Tamil Nadu', 9.64, 11.0
FROM public.users WHERE email = 'shalini@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.64, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Palani M', 'palani.m@gmail.com', '9841180018', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 92.0, 100.0, 92.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 90.0, 100.0, 90.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 93.0, 100.0, 93.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC118', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('naveen@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC119', 'Naveen Prasad', 'naveen@college.edu', '9841190019', 1, 6, 'A', 'Prasad K', 'prasad.k@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'naveen@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Prasad K', 'prasad.k@gmail.com', '9841190019', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 80.0, 100.0, 80.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 72.0, 100.0, 72.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC119', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('janani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21EC120', 'Janani K', 'janani@college.edu', '9841200020', 1, 6, 'A', 'Kothandaraman V', 'kothanda.v@gmail.com', 'Chennai, Tamil Nadu', 9.0, 11.0
FROM public.users WHERE email = 'janani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Kothandaraman V', 'kothanda.v@gmail.com', '9841200020', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 1, 'CIA-1', 84.0, 100.0, 84.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 2, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 3, 'CIA-1', 86.0, 100.0, 86.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21EC120', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
-- IT Students (20 Students)
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('kavin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT101', 'Kavin Raj', 'kavin@college.edu', '9841010001', 2, 6, 'A', 'Rajendran S', 'rajendran.s@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'kavin@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Rajendran S', 'rajendran.s@gmail.com', '9841010001', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 74.0, 100.0, 74.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT101', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('anitha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT102', 'Anitha Ramasamy', 'anitha@college.edu', '9841020002', 2, 6, 'A', 'Ramasamy K', 'ramasamy.k@gmail.com', 'Chennai, Tamil Nadu', 9.36, 11.0
FROM public.users WHERE email = 'anitha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Ramasamy K', 'ramasamy.k@gmail.com', '9841020002', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 93.0, 100.0, 93.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 90.0, 100.0, 90.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 90.0, 100.0, 90.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT102', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('balaji@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT103', 'Balaji Venkatesh', 'balaji@college.edu', '9841030003', 2, 6, 'A', 'Venkatesh Babu', 'venkatesh.b@gmail.com', 'Chennai, Tamil Nadu', 6.64, 11.0
FROM public.users WHERE email = 'balaji@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.64, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Venkatesh Babu', 'venkatesh.b@gmail.com', '9841030003', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 59.0, 100.0, 59.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 62.0, 100.0, 62.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 62.0, 100.0, 62.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21IT103', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('gayathri@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT104', 'Gayathri Natarajan', 'gayathri@college.edu', '9841040004', 2, 6, 'A', 'Natarajan P', 'natarajan.p@gmail.com', 'Chennai, Tamil Nadu', 9.0, 11.0
FROM public.users WHERE email = 'gayathri@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Natarajan P', 'natarajan.p@gmail.com', '9841040004', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 83.0, 100.0, 83.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT104', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('dinesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT105', 'Dinesh Karthik', 'dinesh@college.edu', '9841050005', 2, 6, 'A', 'Karthikeyan S', 'karthik.s@gmail.com', 'Chennai, Tamil Nadu', 6.36, 11.0
FROM public.users WHERE email = 'dinesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Karthikeyan S', 'karthik.s@gmail.com', '9841050005', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 62.0, 100.0, 62.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 57.0, 100.0, 57.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 55.0, 100.0, 55.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT105', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('poornima@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT106', 'Poornima Devi', 'poornima@college.edu', '9841060006', 2, 6, 'A', 'Devendran M', 'devendran.m@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'poornima@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Devendran M', 'devendran.m@gmail.com', '9841060006', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 77.0, 100.0, 77.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT106', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('sridhar@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT107', 'Sridhar Ganesan', 'sridhar@college.edu', '9841070007', 2, 6, 'A', 'Ganesan T', 'ganesan.t@gmail.com', 'Chennai, Tamil Nadu', 6.36, 11.0
FROM public.users WHERE email = 'sridhar@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Ganesan T', 'ganesan.t@gmail.com', '9841070007', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 54.0, 100.0, 54.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 61.0, 100.0, 61.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 59.0, 100.0, 59.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21IT107', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('meenakshi@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT108', 'Meenakshi S', 'meenakshi@college.edu', '9841080008', 2, 6, 'A', 'Shanmugam K', 'shanmugam.k@gmail.com', 'Chennai, Tamil Nadu', 10.0, 11.0
FROM public.users WHERE email = 'meenakshi@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 10.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Shanmugam K', 'shanmugam.k@gmail.com', '9841080008', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 91.0, 100.0, 91.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 93.0, 100.0, 93.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 91.0, 100.0, 91.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT108', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('pradeep@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT109', 'Pradeep Kumar', 'pradeep@college.edu', '9841090009', 2, 6, 'A', 'Vijayakumar R', 'vijay.r@gmail.com', 'Chennai, Tamil Nadu', 8.27, 11.0
FROM public.users WHERE email = 'pradeep@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.27, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Vijayakumar R', 'vijay.r@gmail.com', '9841090009', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 74.0, 100.0, 74.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT109', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('revathi@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT110', 'Revathi Murugan', 'revathi@college.edu', '9841100010', 2, 6, 'A', 'Murugesan P', 'murugesan.p@gmail.com', 'Chennai, Tamil Nadu', 8.36, 11.0
FROM public.users WHERE email = 'revathi@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Murugesan P', 'murugesan.p@gmail.com', '9841100010', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 82.0, 100.0, 82.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 72.0, 100.0, 72.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT110', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('gokul@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT111', 'Gokulnath R', 'gokul@college.edu', '9841110011', 2, 6, 'A', 'Ravichandran M', 'ravi.m@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'gokul@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Ravichandran M', 'ravi.m@gmail.com', '9841110011', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 74.0, 100.0, 74.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT111', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('hema@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT112', 'Hemalatha C', 'hema@college.edu', '9841120012', 2, 6, 'A', 'Chandrasekaran V', 'chandra.v@gmail.com', 'Chennai, Tamil Nadu', 6.36, 11.0
FROM public.users WHERE email = 'hema@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Chandrasekaran V', 'chandra.v@gmail.com', '9841120012', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 56.0, 100.0, 56.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 62.0, 100.0, 62.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 58.0, 100.0, 58.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21IT112', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('rajesh.k@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT113', 'Rajesh Kannan', 'rajesh.k@college.edu', '9841130013', 2, 6, 'A', 'Kannan S', 'kannan.s@gmail.com', 'Chennai, Tamil Nadu', 8.36, 11.0
FROM public.users WHERE email = 'rajesh.k@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Kannan S', 'kannan.s@gmail.com', '9841130013', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 73.0, 100.0, 73.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT113', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('sowmya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT114', 'Sowmya Lakshmi', 'sowmya@college.edu', '9841140014', 2, 6, 'A', 'Lakshmipathy K', 'lakshmi.k@gmail.com', 'Chennai, Tamil Nadu', 9.27, 11.0
FROM public.users WHERE email = 'sowmya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.27, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Lakshmipathy K', 'lakshmi.k@gmail.com', '9841140014', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 89.0, 100.0, 89.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 87.0, 100.0, 87.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 92.0, 100.0, 92.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT114', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('vasanth@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT115', 'Vasanth Kumar', 'vasanth@college.edu', '9841150015', 2, 6, 'A', 'Saravanan R', 'saravanan.r@gmail.com', 'Chennai, Tamil Nadu', 6.0, 11.0
FROM public.users WHERE email = 'vasanth@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Saravanan R', 'saravanan.r@gmail.com', '9841150015', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 55.0, 100.0, 55.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 59.0, 100.0, 59.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 53.0, 100.0, 53.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21IT115', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('pavithra@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT116', 'Pavithra M', 'pavithra@college.edu', '9841160016', 2, 6, 'A', 'Mahalingam S', 'mahalingam.s@gmail.com', 'Chennai, Tamil Nadu', 9.73, 11.0
FROM public.users WHERE email = 'pavithra@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.73, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Mahalingam S', 'mahalingam.s@gmail.com', '9841160016', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 92.0, 100.0, 92.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 91.0, 100.0, 91.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT116', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('vijay.s@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT117', 'Vijay Sethupathi', 'vijay.s@college.edu', '9841170017', 2, 6, 'A', 'Sethuraman P', 'sethu.p@gmail.com', 'Chennai, Tamil Nadu', 8.36, 11.0
FROM public.users WHERE email = 'vijay.s@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Sethuraman P', 'sethu.p@gmail.com', '9841170017', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT117', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('sneha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT118', 'Sneha Parthasarathy', 'sneha@college.edu', '9841180018', 2, 6, 'A', 'Parthasarathy K', 'partha.k@gmail.com', 'Chennai, Tamil Nadu', 9.0, 11.0
FROM public.users WHERE email = 'sneha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Parthasarathy K', 'partha.k@gmail.com', '9841180018', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 84.0, 100.0, 84.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 86.0, 100.0, 86.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 89.0, 100.0, 89.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT118', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('ashwin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT119', 'Ashwin Raghav', 'ashwin@college.edu', '9841190019', 2, 6, 'A', 'Raghavan N', 'raghavan.n@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'ashwin@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Raghavan N', 'raghavan.n@gmail.com', '9841190019', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 79.0, 100.0, 79.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 79.0, 100.0, 79.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT119', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('tharani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21IT120', 'Tharani K', 'tharani@college.edu', '9841200020', 2, 6, 'A', 'Kailasam M', 'kailasam.m@gmail.com', 'Chennai, Tamil Nadu', 8.27, 11.0
FROM public.users WHERE email = 'tharani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.27, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Kailasam M', 'kailasam.m@gmail.com', '9841200020', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 4, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 5, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 6, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21IT120', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
-- CSE Students (20 Students)
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('arun@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS101', 'Arun Kumar', 'arun@college.edu', '9841010001', 3, 6, 'A', 'Kumaravel S', 'kumaravel.s@gmail.com', 'Chennai, Tamil Nadu', 8.36, 11.0
FROM public.users WHERE email = 'arun@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Kumaravel S', 'kumaravel.s@gmail.com', '9841010001', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 77.0, 100.0, 77.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 72.0, 100.0, 72.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS101', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('nivetha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS102', 'Nivetha S', 'nivetha@college.edu', '9841020002', 3, 6, 'A', 'Sundaramorthy K', 'sundar.k@gmail.com', 'Chennai, Tamil Nadu', 6.0, 11.0
FROM public.users WHERE email = 'nivetha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Sundaramorthy K', 'sundar.k@gmail.com', '9841020002', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 55.0, 100.0, 55.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 56.0, 100.0, 56.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 56.0, 100.0, 56.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21CS102', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('vignesh.r@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS103', 'Vigneshwaran R', 'vignesh.r@college.edu', '9841030003', 3, 6, 'A', 'Ramakrishnan S', 'ramki.s@gmail.com', 'Chennai, Tamil Nadu', 9.36, 11.0
FROM public.users WHERE email = 'vignesh.r@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Ramakrishnan S', 'ramki.s@gmail.com', '9841030003', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 92.0, 100.0, 92.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 88.0, 100.0, 88.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 88.0, 100.0, 88.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS103', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('pooja@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS104', 'Pooja Sundaram', 'pooja@college.edu', '9841040004', 3, 6, 'A', 'Sundaram V', 'sundaram.v@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'pooja@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Sundaram V', 'sundaram.v@gmail.com', '9841040004', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 76.0, 100.0, 76.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 78.0, 100.0, 78.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS104', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('sanjay@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS105', 'Sanjay Kumar', 'sanjay@college.edu', '9841050005', 3, 6, 'A', 'Mohan Kumar R', 'mohan.r@gmail.com', 'Chennai, Tamil Nadu', 6.64, 11.0
FROM public.users WHERE email = 'sanjay@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.64, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Mohan Kumar R', 'mohan.r@gmail.com', '9841050005', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 54.0, 100.0, 54.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 62.0, 100.0, 62.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 62.0, 100.0, 62.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21CS105', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('akshaya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS106', 'Akshaya Raman', 'akshaya@college.edu', '9841060006', 3, 6, 'A', 'Ramanathan M', 'raman.m@gmail.com', 'Chennai, Tamil Nadu', 9.36, 11.0
FROM public.users WHERE email = 'akshaya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Ramanathan M', 'raman.m@gmail.com', '9841060006', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 91.0, 100.0, 91.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 83.0, 100.0, 83.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS106', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('kishore@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS107', 'Kishore Kumar', 'kishore@college.edu', '9841070007', 3, 6, 'A', 'Gopalakrishnan P', 'gopal.p@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'kishore@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Gopalakrishnan P', 'gopal.p@gmail.com', '9841070007', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 73.0, 100.0, 73.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS107', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('swetha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS108', 'Swetha Varadharajan', 'swetha@college.edu', '9841080008', 3, 6, 'A', 'Varadharajan K', 'varadhan.k@gmail.com', 'Chennai, Tamil Nadu', 9.36, 11.0
FROM public.users WHERE email = 'swetha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Varadharajan K', 'varadhan.k@gmail.com', '9841080008', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 94.0, 100.0, 94.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 89.0, 100.0, 89.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 87.0, 100.0, 87.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS108', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('mukesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS109', 'Mukesh Kannan', 'mukesh@college.edu', '9841090009', 3, 6, 'A', 'Kannan D', 'kannan.d@gmail.com', 'Chennai, Tamil Nadu', 6.36, 11.0
FROM public.users WHERE email = 'mukesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Kannan D', 'kannan.d@gmail.com', '9841090009', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 60.0, 100.0, 60.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 61.0, 100.0, 61.0, 'B+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 59.0, 100.0, 59.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21CS109', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('bhavani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS110', 'Bhavani Shankar', 'bhavani@college.edu', '9841100010', 3, 6, 'A', 'Shankaran T', 'shankaran.t@gmail.com', 'Chennai, Tamil Nadu', 8.36, 11.0
FROM public.users WHERE email = 'bhavani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Shankaran T', 'shankaran.t@gmail.com', '9841100010', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 74.0, 100.0, 74.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 79.0, 100.0, 79.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS110', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('surya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS111', 'Surya Narayanan', 'surya@college.edu', '9841110011', 3, 6, 'A', 'Narayanan S', 'narayanan.s@gmail.com', 'Chennai, Tamil Nadu', 8.64, 11.0
FROM public.users WHERE email = 'surya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.64, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Narayanan S', 'narayanan.s@gmail.com', '9841110011', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 74.0, 100.0, 74.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS111', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('madhu@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS112', 'Madhumitha K', 'madhu@college.edu', '9841120012', 3, 6, 'A', 'Kasiviswanathan R', 'kasi.r@gmail.com', 'Chennai, Tamil Nadu', 6.0, 11.0
FROM public.users WHERE email = 'madhu@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Kasiviswanathan R', 'kasi.r@gmail.com', '9841120012', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 59.0, 100.0, 59.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 58.0, 100.0, 58.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 54.0, 100.0, 54.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21CS112', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('ajith@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS113', 'Ajith Kumar', 'ajith@college.edu', '9841130013', 3, 6, 'A', 'Subramanian M', 'subramanian.m@gmail.com', 'Chennai, Tamil Nadu', 9.0, 11.0
FROM public.users WHERE email = 'ajith@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Subramanian M', 'subramanian.m@gmail.com', '9841130013', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 90.0, 100.0, 90.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 86.0, 100.0, 86.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS113', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('preethi@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS114', 'Preethi S', 'preethi@college.edu', '9841140014', 3, 6, 'A', 'Srinivasan K', 'srini.k@gmail.com', 'Chennai, Tamil Nadu', 9.73, 11.0
FROM public.users WHERE email = 'preethi@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.73, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Srinivasan K', 'srini.k@gmail.com', '9841140014', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 92.0, 100.0, 92.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 92.0, 100.0, 92.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 88.0, 100.0, 88.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS114', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('raghav@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS115', 'Raghavendra Rao', 'raghav@college.edu', '9841150015', 3, 6, 'A', 'Ramamurthy R', 'ramamurthy.r@gmail.com', 'Chennai, Tamil Nadu', 6.0, 11.0
FROM public.users WHERE email = 'raghav@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 6.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Ramamurthy R', 'ramamurthy.r@gmail.com', '9841150015', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 58.0, 100.0, 58.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 55.0, 100.0, 55.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 60.0, 100.0, 60.0, 'B', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 35000.0, 'Pending', '2026-04-30', 'REC-2026-21CS115', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('kavitha.s@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS116', 'Kavitha Selvam', 'kavitha.s@college.edu', '9841160016', 3, 6, 'A', 'Selvarajan N', 'selvaraj.n@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'kavitha.s@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Selvarajan N', 'selvaraj.n@gmail.com', '9841160016', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 72.0, 100.0, 72.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 80.0, 100.0, 80.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS116', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('madhavan@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS117', 'Madhavan Govind', 'madhavan@college.edu', '9841170017', 3, 6, 'A', 'Govindaraj P', 'govind.p@gmail.com', 'Chennai, Tamil Nadu', 8.0, 11.0
FROM public.users WHERE email = 'madhavan@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Govindaraj P', 'govind.p@gmail.com', '9841170017', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 79.0, 100.0, 79.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 77.0, 100.0, 77.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 71.0, 100.0, 71.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS117', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('charu@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS118', 'Charulatha V', 'charu@college.edu', '9841180018', 3, 6, 'A', 'Veeramani S', 'veeramani.s@gmail.com', 'Chennai, Tamil Nadu', 9.36, 11.0
FROM public.users WHERE email = 'charu@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.36, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Veeramani S', 'veeramani.s@gmail.com', '9841180018', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 87.0, 100.0, 87.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 91.0, 100.0, 91.0, 'O', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 85.0, 100.0, 85.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS118', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('karthik.r@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS119', 'Karthik Raja', 'karthik.r@college.edu', '9841190019', 3, 6, 'A', 'Rajagopal M', 'rajagopal.m@gmail.com', 'Chennai, Tamil Nadu', 8.73, 11.0
FROM public.users WHERE email = 'karthik.r@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 8.73, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Rajagopal M', 'rajagopal.m@gmail.com', '9841190019', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 82.0, 100.0, 82.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 81.0, 100.0, 81.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 75.0, 100.0, 75.0, 'A', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS119', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO public.users (email, hashed_password, role, is_active) VALUES ('anand@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO public.students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address, cgpa, total_credits)
SELECT id, '21CS120', 'Anand Subramanian', 'anand@college.edu', '9841200020', 3, 6, 'A', 'Subramaniam V', 'subbu.v@gmail.com', 'Chennai, Tamil Nadu', 9.0, 11.0
FROM public.users WHERE email = 'anand@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, cgpa = 9.0, total_credits = 11.0;
INSERT INTO public.parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT s.id, 'Subramaniam V', 'subbu.v@gmail.com', '9841200020', 'Parent/Guardian', true
FROM public.students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 7, 'CIA-1', 90.0, 100.0, 90.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 8, 'CIA-1', 86.0, 100.0, 86.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO public.marks (student_id, subject_id, exam_type, marks_obtained, max_marks, total, grade, remarks)
SELECT s.id, 9, 'CIA-1', 89.0, 100.0, 89.0, 'A+', 'Evaluated'
FROM public.students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO public.fees (student_id, title, academic_year, total_amount, paid_amount, status, due_date, receipt_no, payment_mode)
SELECT s.id, 'Semester Tuition & Academic Fee', '2025-2026', 65000.0, 65000.0, 'Paid', '2026-04-30', 'REC-2026-21CS120', 'Online NetBanking'
FROM public.students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
-- Quizzes
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

-- Assignments
INSERT INTO public.assignments (id, title, description, subject_id, faculty_id, created_by, department_id, semester, section, due_date, max_marks, status)
SELECT 1, 'Design & Analysis of Algorithms - Mini-Project Report', 'Implement and compare empirical running times of QuickSort vs MergeSort across varied input sizes up to 100,000 elements.', 7, f.id, f.id, 3, 6, 'A', '2026-05-10', 10.0, 'published'
FROM public.faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;


-- ============================================================================
-- SETUP COMPLETE! ALL 27 TABLES, STORAGE, POLICIES & SEED DATA READY.
-- ============================================================================