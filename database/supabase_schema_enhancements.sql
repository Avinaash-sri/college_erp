-- ============================================================================
-- CLOUD-BASED COLLEGE ERP - SUPABASE POSTGRESQL PRODUCTION ENHANCEMENTS
-- ============================================================================
-- Modules:
--   1. Department-Wise Quiz Management
--   2. Assignment Management, Storage Submissions & Persistent Reminders
--   3. Admin Announcements & Fully Functional Notifications
--   4. AI Student Notes Assistant & Grounded Document Q&A
-- ============================================================================

-- 1. UPDATE EXISTING ASSIGNMENTS TABLE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='department_id') THEN
        ALTER TABLE assignments ADD COLUMN department_id INT REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='semester') THEN
        ALTER TABLE assignments ADD COLUMN semester INT DEFAULT 6;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='section') THEN
        ALTER TABLE assignments ADD COLUMN section VARCHAR(10) DEFAULT 'A';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='due_time') THEN
        ALTER TABLE assignments ADD COLUMN due_time VARCHAR(20) DEFAULT '23:59';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='allowed_file_types') THEN
        ALTER TABLE assignments ADD COLUMN allowed_file_types VARCHAR(100) DEFAULT 'pdf,docx,zip,txt';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='max_file_size_mb') THEN
        ALTER TABLE assignments ADD COLUMN max_file_size_mb INT DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='submission_format') THEN
        ALTER TABLE assignments ADD COLUMN submission_format VARCHAR(30) DEFAULT 'both';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='allow_resubmission') THEN
        ALTER TABLE assignments ADD COLUMN allow_resubmission BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='allow_late') THEN
        ALTER TABLE assignments ADD COLUMN allow_late BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='status') THEN
        ALTER TABLE assignments ADD COLUMN status VARCHAR(20) DEFAULT 'published';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='reminder_interval_minutes') THEN
        ALTER TABLE assignments ADD COLUMN reminder_interval_minutes INT DEFAULT 60;
    END IF;
END $$;

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General Announcement',
    poster_url VARCHAR(500) NULL,
    event_date DATE NULL,
    registration_url VARCHAR(500) NULL,
    audience_type VARCHAR(50) DEFAULT 'all',
    target_department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    target_semester INT NULL,
    target_section VARCHAR(10) NULL,
    status VARCHAR(20) DEFAULT 'published',
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_cat ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_dept ON announcements(target_department_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);

-- 3. UPDATE EXISTING NOTIFICATIONS TABLE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='announcement_id') THEN
        ALTER TABLE notifications ADD COLUMN announcement_id INT REFERENCES announcements(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='link_url') THEN
        ALTER TABLE notifications ADD COLUMN link_url VARCHAR(255) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='is_cleared') THEN
        ALTER TABLE notifications ADD COLUMN is_cleared BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='cleared_at') THEN
        ALTER TABLE notifications ADD COLUMN cleared_at TIMESTAMPTZ NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_cleared ON notifications(is_cleared);
CREATE INDEX IF NOT EXISTS idx_notifications_announcement ON notifications(announcement_id);

-- 4. ASSIGNMENT ELIGIBILITY & ROSTER TABLE
CREATE TABLE IF NOT EXISTS assignment_eligibility (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_excluded BOOLEAN DEFAULT FALSE,
    last_reminder_sent_at TIMESTAMPTZ NULL,
    next_reminder_at TIMESTAMPTZ NULL,
    reminder_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_assignment_student_eligibility UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_asgn_elig_student ON assignment_eligibility(student_id);
CREATE INDEX IF NOT EXISTS idx_asgn_elig_rem ON assignment_eligibility(next_reminder_at, is_excluded);

-- 5. ASSIGNMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submission_type VARCHAR(20) DEFAULT 'file',
    file_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    file_size INT NULL,
    drive_link VARCHAR(500) NULL,
    status VARCHAR(30) DEFAULT 'Submitted',
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    marks_obtained DOUBLE PRECISION NULL,
    faculty_feedback TEXT NULL,
    graded_by INT REFERENCES faculty(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ NULL,
    version INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_asgn_sub_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_asgn_sub_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_asgn_sub_status ON assignment_submissions(status);

-- 6. ASSIGNMENT REMINDER LOGS TABLE
CREATE TABLE IF NOT EXISTS assignment_reminder_logs (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    recipient_email VARCHAR(120) NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Sent',
    attempt_count INT DEFAULT 1,
    error_message TEXT NULL,
    next_scheduled_time TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_asgn_rem_log_asgn ON assignment_reminder_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_asgn_rem_log_student ON assignment_reminder_logs(student_id);

-- 7. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) DEFAULT '2025-2026',
    semester INT DEFAULT 6,
    section VARCHAR(10) DEFAULT 'A',
    duration_minutes INT DEFAULT 30,
    total_marks DOUBLE PRECISION DEFAULT 0.0,
    start_time TIMESTAMPTZ NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    results_published BOOLEAN DEFAULT FALSE,
    allow_multiple_attempts BOOLEAN DEFAULT FALSE,
    max_attempts INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_subject ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_dept_sem ON quizzes(department_id, semester, section);
CREATE INDEX IF NOT EXISTS idx_quiz_faculty ON quizzes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_quiz_deadline ON quizzes(deadline);

-- 8. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'mcq',
    marks DOUBLE PRECISION DEFAULT 1.0,
    "order" INT DEFAULT 1,
    options TEXT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_q_quiz ON quiz_questions(quiz_id);

-- 9. QUIZ ASSIGNMENTS / ELIGIBILITY TABLE
CREATE TABLE IF NOT EXISTS quiz_assignments (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_excluded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quiz_student_assignment UNIQUE (quiz_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_asgn_student ON quiz_assignments(student_id);

-- 10. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ NULL,
    status VARCHAR(20) DEFAULT 'in_progress',
    score DOUBLE PRECISION DEFAULT 0.0,
    total_marks DOUBLE PRECISION DEFAULT 0.0,
    feedback TEXT NULL,
    CONSTRAINT uq_quiz_student_attempt UNIQUE (quiz_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_student ON quiz_attempts(student_id);

-- 11. QUIZ ANSWERS TABLE
CREATE TABLE IF NOT EXISTS quiz_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_answer TEXT NULL,
    is_correct BOOLEAN NULL,
    marks_awarded DOUBLE PRECISION DEFAULT 0.0,
    evaluated_at TIMESTAMPTZ NULL,
    evaluator_feedback TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_ans_attempt ON quiz_answers(attempt_id);

-- 12. STUDENT DOCUMENTS TABLE (Notes Assistant)
CREATE TABLE IF NOT EXISTS student_documents (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_std_doc_student ON student_documents(student_id);

-- 13. DOCUMENT CHUNKS TABLE (Semantic Search & RAG Grounding)
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES student_documents(id) ON DELETE CASCADE,
    chunk_index INT DEFAULT 0,
    chunk_text TEXT NOT NULL,
    page_number INT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc ON document_chunks(document_id);

-- 14. STUDENT AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS student_ai_conversations (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_id INT REFERENCES student_documents(id) ON DELETE CASCADE,
    title VARCHAR(150) DEFAULT 'Notes Q&A',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL REFERENCES student_ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    action_type VARCHAR(50) NULL,
    sources TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_msgs_conv ON student_ai_messages(conversation_id);

-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_ai_messages ENABLE ROW LEVEL SECURITY;

-- Backend Service Role Bypass
DROP POLICY IF EXISTS "Full access for service role" ON announcements;
CREATE POLICY "Full access for service role" ON announcements TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON notifications;
CREATE POLICY "Full access for service role" ON notifications TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON assignment_eligibility;
CREATE POLICY "Full access for service role" ON assignment_eligibility TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON assignment_submissions;
CREATE POLICY "Full access for service role" ON assignment_submissions TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON quizzes;
CREATE POLICY "Full access for service role" ON quizzes TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON quiz_questions;
CREATE POLICY "Full access for service role" ON quiz_questions TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON quiz_assignments;
CREATE POLICY "Full access for service role" ON quiz_assignments TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON quiz_attempts;
CREATE POLICY "Full access for service role" ON quiz_attempts TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON quiz_answers;
CREATE POLICY "Full access for service role" ON quiz_answers TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON student_documents;
CREATE POLICY "Full access for service role" ON student_documents TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON document_chunks;
CREATE POLICY "Full access for service role" ON document_chunks TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON student_ai_conversations;
CREATE POLICY "Full access for service role" ON student_ai_conversations TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for service role" ON student_ai_messages;
CREATE POLICY "Full access for service role" ON student_ai_messages TO service_role USING (true) WITH CHECK (true);

SELECT 'College ERP Production Enhancements Schema Initialized Successfully!' AS status;
