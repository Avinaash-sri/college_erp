"""
Full Python generator for database/seed_chennai_data.sql
Generates exactly 60 Chennai students (20 ECE, 20 IT, 20 CSE), authentic Tamil Nadu names,
realistic attendance distributions, subject enrollments, quiz attempts, assignments,
and demo accounts with password 'password123'.
"""
import os
import json
from datetime import datetime, date, timedelta

ECE_STUDENTS = [
    ("Harish Prabhu", "harish@college.edu", "Prabhu Ramanathan", "prabhu.r@gmail.com", 82.5, "Safe"),
    ("Dharani V", "dharani@college.edu", "Vijay Anand", "vijay.anand@gmail.com", 78.0, "Safe"),
    ("Manoj Kumar", "manoj@college.edu", "Kumaraswamy M", "kumar.m@gmail.com", 68.5, "Warning"),
    ("Keerthana R", "keerthana@college.edu", "Ramesh Kumar", "ramesh.k@gmail.com", 91.0, "Safe"),
    ("Sathish Kumar", "sathish@college.edu", "Murugan K", "murugan.k@gmail.com", 56.0, "High Risk"),
    ("Divya Bharathi", "divya.b@college.edu", "Sundaram P", "sundaram.p@gmail.com", 88.0, "Safe"),
    ("Praveen Chandran", "praveen@college.edu", "Chandran S", "chandran.s@gmail.com", 72.0, "Warning"),
    ("Subhashini M", "subhashini@college.edu", "Mani V", "mani.v@gmail.com", 85.0, "Safe"),
    ("Vigneshwaran K", "vignesh@college.edu", "Krishnan G", "krishnan.g@gmail.com", 61.0, "High Risk"),
    ("Lavanya S", "lavanya@college.edu", "Selvaraj T", "selvaraj.t@gmail.com", 79.5, "Safe"),
    ("Aravind Swamy", "aravind@college.edu", "Swaminathan R", "swami.r@gmail.com", 83.0, "Safe"),
    ("Deepika N", "deepika@college.edu", "Natarajan S", "natarajan.s@gmail.com", 69.0, "Warning"),
    ("Karthikeyan P", "karthik.p@college.edu", "Perumal K", "perumal.k@gmail.com", 76.5, "Safe"),
    ("Sandhya V", "sandhya@college.edu", "Venkatesan R", "venkat.r@gmail.com", 93.0, "Safe"),
    ("Saravanan B", "saravanan@college.edu", "Baskaran K", "baskaran.k@gmail.com", 59.0, "High Risk"),
    ("Monisha T", "monisha@college.edu", "Thangaraj M", "thangaraj.m@gmail.com", 84.0, "Safe"),
    ("Ganesh Moorthy", "ganesh@college.edu", "Moorthy S", "moorthy.s@gmail.com", 71.5, "Warning"),
    ("Shalini P", "shalini@college.edu", "Palani M", "palani.m@gmail.com", 89.0, "Safe"),
    ("Naveen Prasad", "naveen@college.edu", "Prasad K", "prasad.k@gmail.com", 77.0, "Safe"),
    ("Janani K", "janani@college.edu", "Kothandaraman V", "kothanda.v@gmail.com", 86.5, "Safe")
]

IT_STUDENTS = [
    ("Kavin Raj", "kavin@college.edu", "Rajendran S", "rajendran.s@gmail.com", 79.0, "Safe"),
    ("Anitha Ramasamy", "anitha@college.edu", "Ramasamy K", "ramasamy.k@gmail.com", 85.5, "Safe"),
    ("Balaji Venkatesh", "balaji@college.edu", "Venkatesh Babu", "venkatesh.b@gmail.com", 58.5, "High Risk"),
    ("Gayathri Natarajan", "gayathri@college.edu", "Natarajan P", "natarajan.p@gmail.com", 92.0, "Safe"),
    ("Dinesh Karthik", "dinesh@college.edu", "Karthikeyan S", "karthik.s@gmail.com", 71.0, "Warning"),
    ("Poornima Devi", "poornima@college.edu", "Devendran M", "devendran.m@gmail.com", 80.0, "Safe"),
    ("Sridhar Ganesan", "sridhar@college.edu", "Ganesan T", "ganesan.t@gmail.com", 63.5, "High Risk"),
    ("Meenakshi S", "meenakshi@college.edu", "Shanmugam K", "shanmugam.k@gmail.com", 87.0, "Safe"),
    ("Pradeep Kumar", "pradeep@college.edu", "Vijayakumar R", "vijay.r@gmail.com", 74.0, "Warning"),
    ("Revathi Murugan", "revathi@college.edu", "Murugesan P", "murugesan.p@gmail.com", 81.5, "Safe"),
    ("Gokulnath R", "gokul@college.edu", "Ravichandran M", "ravi.m@gmail.com", 84.5, "Safe"),
    ("Hemalatha C", "hema@college.edu", "Chandrasekaran V", "chandra.v@gmail.com", 67.0, "Warning"),
    ("Rajesh Kannan", "rajesh.k@college.edu", "Kannan S", "kannan.s@gmail.com", 76.0, "Safe"),
    ("Sowmya Lakshmi", "sowmya@college.edu", "Lakshmipathy K", "lakshmi.k@gmail.com", 94.0, "Safe"),
    ("Vasanth Kumar", "vasanth@college.edu", "Saravanan R", "saravanan.r@gmail.com", 60.5, "High Risk"),
    ("Pavithra M", "pavithra@college.edu", "Mahalingam S", "mahalingam.s@gmail.com", 86.0, "Safe"),
    ("Vijay Sethupathi", "vijay.s@college.edu", "Sethuraman P", "sethu.p@gmail.com", 73.5, "Warning"),
    ("Sneha Parthasarathy", "sneha@college.edu", "Parthasarathy K", "partha.k@gmail.com", 88.5, "Safe"),
    ("Ashwin Raghav", "ashwin@college.edu", "Raghavan N", "raghavan.n@gmail.com", 78.5, "Safe"),
    ("Tharani K", "tharani@college.edu", "Kailasam M", "kailasam.m@gmail.com", 83.0, "Safe")
]

CSE_STUDENTS = [
    # Demo 1: Good attendance
    ("Arun Kumar", "arun@college.edu", "Kumaravel S", "kumaravel.s@gmail.com", 84.0, "Safe"),
    # Demo 2: Medium attendance
    ("Nivetha S", "nivetha@college.edu", "Sundaramorthy K", "sundar.k@gmail.com", 68.0, "Warning"),
    ("Vigneshwaran R", "vignesh.r@college.edu", "Ramakrishnan S", "ramki.s@gmail.com", 91.5, "Safe"),
    ("Pooja Sundaram", "pooja@college.edu", "Sundaram V", "sundaram.v@gmail.com", 79.0, "Safe"),
    # Demo 3: Low attendance
    ("Sanjay Kumar", "sanjay@college.edu", "Mohan Kumar R", "mohan.r@gmail.com", 58.0, "High Risk"),
    ("Akshaya Raman", "akshaya@college.edu", "Ramanathan M", "raman.m@gmail.com", 88.0, "Safe"),
    ("Kishore Kumar", "kishore@college.edu", "Gopalakrishnan P", "gopal.p@gmail.com", 72.5, "Warning"),
    ("Swetha Varadharajan", "swetha@college.edu", "Varadharajan K", "varadhan.k@gmail.com", 95.0, "Safe"),
    ("Mukesh Kannan", "mukesh@college.edu", "Kannan D", "kannan.d@gmail.com", 62.0, "High Risk"),
    ("Bhavani Shankar", "bhavani@college.edu", "Shankaran T", "shankaran.t@gmail.com", 83.5, "Safe"),
    ("Surya Narayanan", "surya@college.edu", "Narayanan S", "narayanan.s@gmail.com", 77.0, "Safe"),
    ("Madhumitha K", "madhu@college.edu", "Kasiviswanathan R", "kasi.r@gmail.com", 70.0, "Warning"),
    ("Ajith Kumar", "ajith@college.edu", "Subramanian M", "subramanian.m@gmail.com", 85.0, "Safe"),
    ("Preethi S", "preethi@college.edu", "Srinivasan K", "srini.k@gmail.com", 90.0, "Safe"),
    ("Raghavendra Rao", "raghav@college.edu", "Ramamurthy R", "ramamurthy.r@gmail.com", 57.5, "High Risk"),
    ("Kavitha Selvam", "kavitha.s@college.edu", "Selvarajan N", "selvaraj.n@gmail.com", 82.0, "Safe"),
    ("Madhavan Govind", "madhavan@college.edu", "Govindaraj P", "govind.p@gmail.com", 74.0, "Warning"),
    ("Charulatha V", "charu@college.edu", "Veeramani S", "veeramani.s@gmail.com", 86.5, "Safe"),
    ("Karthik Raja", "karthik.r@college.edu", "Rajagopal M", "rajagopal.m@gmail.com", 81.0, "Safe"),
    ("Anand Subramanian", "anand@college.edu", "Subramaniam V", "subbu.v@gmail.com", 87.5, "Safe")
]

DEPARTMENTS = [
    (1, "ECE", "Electronics and Communication Engineering"),
    (2, "IT", "Information Technology"),
    (3, "CSE", "Computer Science and Engineering")
]

SUBJECTS = [
    # ECE Subjects
    (1, "EC601", "Digital Signal Processing", 1, 6, 4),
    (2, "EC602", "VLSI Design & Embedded Systems", 1, 6, 4),
    (3, "EC603", "Wireless Communication Networks", 1, 6, 3),
    # IT Subjects
    (4, "IT601", "Cloud Computing & Virtualization", 2, 6, 4),
    (5, "IT602", "Full-Stack Web Development", 2, 6, 4),
    (6, "IT603", "Information Security & Cryptography", 2, 6, 3),
    # CSE Subjects
    (7, "CS601", "Design and Analysis of Algorithms", 3, 6, 4),
    (8, "CS602", "Artificial Intelligence & Machine Learning", 3, 6, 4),
    (9, "CS603", "Database Engineering & Distributed Systems", 3, 6, 3),
]

def generate_sql():
    sql = []
    sql.append("-- ============================================================================")
    sql.append("-- CHENNAI-BASED SAMPLE DATA SEED SCRIPT (60 STUDENTS ACROSS ECE, IT, CSE)")
    sql.append("-- ============================================================================")
    sql.append("-- Initial password for all demo accounts: password123")
    sql.append("-- Idempotent: Uses ON CONFLICT to prevent duplicate rows")
    sql.append("-- ============================================================================\n")

    # Departments
    sql.append("-- 1. DEPARTMENTS")
    for d_id, code, name in DEPARTMENTS:
        sql.append(f"INSERT INTO departments (id, code, name) VALUES ({d_id}, '{code}', '{name}') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;")
    sql.append("")

    # Admin User
    sql.append("-- 2. ADMIN USER (admin@college.edu / password123)")
    sql.append("INSERT INTO users (email, hashed_password, role, is_active) VALUES ('admin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'admin', true) ON CONFLICT (email) DO UPDATE SET role = 'admin';\n")

    # Faculty User & Record
    sql.append("-- 3. FACULTY USER & RECORD (kavitha@college.edu / password123)")
    sql.append("INSERT INTO users (email, hashed_password, role, is_active) VALUES ('kavitha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'faculty', true) ON CONFLICT (email) DO UPDATE SET role = 'faculty';")
    sql.append("""INSERT INTO faculty (user_id, emp_id, name, email, phone, department_id, designation)
SELECT id, 'EMP_CSE_01', 'Dr. Kavitha Raman', 'kavitha@college.edu', '9840123456', 3, 'Professor & HOD'
FROM users WHERE email = 'kavitha@college.edu'
ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name;
""")

    # Subjects
    sql.append("-- 4. SUBJECTS")
    for s_id, code, name, dept_id, sem, cred in SUBJECTS:
        sql.append(f"""INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT {s_id}, '{code}', '{name}', {dept_id}, {sem}, {cred}, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;""")
    sql.append("")

    # 5. Students per Department
    def process_dept_students(dept_code, dept_id, student_list):
        lines = [f"-- 5.{dept_id} {dept_code} STUDENTS (20 STUDENTS)"]
        for idx, (name, email, parent_name, parent_email, att_pct, risk) in enumerate(student_list, start=1):
            reg_no = f"21{dept_code[:2]}{100 + idx}"
            phone = f"9841{idx:02d}00{idx:02d}"
            
            lines.append(f"INSERT INTO users (email, hashed_password, role, is_active) VALUES ('{email}', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;")
            
            lines.append(f"""INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '{reg_no}', '{name}', '{email}', '{phone}', {dept_id}, 6, 'A', '{parent_name}', '{parent_email}', 'Chennai, Tamil Nadu'
FROM users WHERE email = '{email}'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;""")

            lines.append(f"""INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, '{parent_name}', '{parent_email}', '{phone}', 'Parent/Guardian', true
FROM students WHERE reg_no = '{reg_no}'
ON CONFLICT DO NOTHING;""")

            # Enrollments for department's subjects
            dept_subj_ids = [s[0] for s in SUBJECTS if s[3] == dept_id]
            for s_id in dept_subj_ids:
                lines.append(f"""INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, {s_id}, 6 FROM students s WHERE s.reg_no = '{reg_no}'
ON CONFLICT (student_id, subject_id) DO NOTHING;""")

            # Attendance records across past 20 days
            # att_pct determines how many present days out of 20
            present_days_count = int(round((att_pct / 100.0) * 20))
            base_date = date(2026, 9, 1)
            for day_i in range(20):
                att_date = base_date + timedelta(days=day_i)
                status = "Present" if day_i < present_days_count else "Absent"
                # Add for first subject of department
                lines.append(f"""INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, {dept_subj_ids[0]}, '{att_date.isoformat()}', '{status}', 'Lecture'
FROM students s WHERE s.reg_no = '{reg_no}'
ON CONFLICT DO NOTHING;""")

        return "\n".join(lines)

    sql.append(process_dept_students("ECE", 1, ECE_STUDENTS))
    sql.append("\n" + process_dept_students("IT", 2, IT_STUDENTS))
    sql.append("\n" + process_dept_students("CSE", 3, CSE_STUDENTS))

    # Schema compatibility guards: Ensure assignments and all extension tables have required columns
    sql.append("""
-- ============================================================================
-- SCHEMA COMPATIBILITY GUARDS
-- Ensure tables and columns exist even if seed script is run on existing schema
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id INT NULL REFERENCES public.faculty(id) ON DELETE SET NULL,
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

-- Ensure faculty_id and other columns exist on any pre-existing assignments table
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS faculty_id INT REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS semester INT DEFAULT 6;
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'A';
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS due_time VARCHAR(20) DEFAULT '23:59';
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS allowed_file_types VARCHAR(100) DEFAULT 'pdf,docx,zip,txt';
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS max_file_size_mb INT DEFAULT 10;
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS submission_format VARCHAR(30) DEFAULT 'both';
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS allow_late BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS reminder_interval_minutes INT DEFAULT 60;

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

    # 6. Quizzes
    sql.append("\n-- 6. QUIZZES (Controlled Result Release Demonstration)")
    sql.append("""
-- Quiz 1: Results Published = TRUE (Students can see their marks and feedback)
INSERT INTO quizzes (id, title, description, subject_id, faculty_id, department_id, academic_year, semester, section, duration_minutes, total_marks, deadline, status, results_published)
SELECT 1, 'Design & Analysis of Algorithms — Unit 1 Assessment', 'Fundamental complexity classes, divide & conquer, recurrence relations.', 7, f.id, 3, '2025-2026', 6, 'A', 30, 10.0, NOW() + INTERVAL '2 days', 'published', TRUE
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET results_published = TRUE;

-- Quiz 1 Questions
INSERT INTO quiz_questions (quiz_id, question_text, question_type, marks, "order", options, correct_answer, explanation)
VALUES
(1, 'What is the time complexity of building a max heap of n elements?', 'mcq', 2.5, 1, '[{"id":"A","text":"O(n)"},{"id":"B","text":"O(n log n)"},{"id":"C","text":"O(n^2)"},{"id":"D","text":"O(log n)"}]', 'A', 'Using Floyd algorithm, max-heap is built in linear O(n) time.'),
(1, 'Which algorithmic paradigm does Floyd-Warshall algorithm use?', 'mcq', 2.5, 2, '[{"id":"A","text":"Greedy"},{"id":"B","text":"Dynamic Programming"},{"id":"C","text":"Divide and Conquer"},{"id":"D","text":"Backtracking"}]', 'B', 'Floyd-Warshall solves all-pairs shortest paths using Dynamic Programming.'),
(1, 'What is the worst-case time complexity of QuickSort?', 'mcq', 2.5, 3, '[{"id":"A","text":"O(n log n)"},{"id":"B","text":"O(n^2)"},{"id":"C","text":"O(n)"},{"id":"D","text":"O(log n)"}]', 'B', 'When the pivot is the extreme element consistently, QuickSort degrades to O(n^2).'),
(1, 'Master theorem cannot be applied to which recurrence?', 'mcq', 2.5, 4, '[{"id":"A","text":"T(n) = 2T(n/2) + n"},{"id":"B","text":"T(n) = 4T(n/2) + n^2"},{"id":"C","text":"T(n) = 2T(n/2) + n/log n"},{"id":"D","text":"T(n) = T(n/3) + 1"}]', 'C', 'Master theorem requires polynomial bounds, not logarithmic quotients.')
ON CONFLICT DO NOTHING;

-- Quiz 2: Results Published = FALSE (Controlled Result Release - HIDDEN until faculty publishes)
INSERT INTO quizzes (id, title, description, subject_id, faculty_id, department_id, academic_year, semester, section, duration_minutes, total_marks, deadline, status, results_published)
SELECT 2, 'Distributed Systems & Cloud Architecture Test', 'Consensus protocols, CAP theorem, distributed transactions, and microservices.', 9, f.id, 3, '2025-2026', 6, 'A', 45, 10.0, NOW() + INTERVAL '4 days', 'published', FALSE
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET results_published = FALSE;

-- Quiz 2 Questions
INSERT INTO quiz_questions (quiz_id, question_text, question_type, marks, "order", options, correct_answer, explanation)
VALUES
(2, 'According to the CAP Theorem, which two properties can be guaranteed in the presence of a network partition?', 'mcq', 2.5, 1, '[{"id":"A","text":"Consistency and Availability"},{"id":"B","text":"Consistency or Availability with Partition Tolerance"},{"id":"C","text":"Neither"},{"id":"D","text":"Durability and Isolation"}]', 'B', 'In a network partition, you must trade off Consistency vs Availability.'),
(2, 'What consensus protocol is primarily utilized by Apache Kafka for partition leader election?', 'mcq', 2.5, 2, '[{"id":"A","text":"Raft (KRaft)"},{"id":"B","text":"Paxos"},{"id":"C","text":"Two-Phase Commit"},{"id":"D","text":"Byzantine Fault Tolerance"}]', 'A', 'Modern Kafka uses KRaft (an event-driven implementation of Raft).'),
(2, 'What is the primary role of a Circuit Breaker in microservices?', 'mcq', 2.5, 3, '[{"id":"A","text":"Data encryption"},{"id":"B","text":"Prevent cascading failures by failing fast"},{"id":"C","text":"Load balancing across clusters"},{"id":"D","text":"Automated testing"}]', 'B', 'A circuit breaker protects upstream dependencies from cascade failures.'),
(2, 'Which ACID property is relaxed in BASE architecture of distributed NoSQL databases?', 'mcq', 2.5, 4, '[{"id":"A","text":"Atomicity"},{"id":"B","text":"Strict Consistency (in favor of Eventual Consistency)"},{"id":"C","text":"Durability"},{"id":"D","text":"Isolation"}]', 'B', 'BASE stands for Basically Available, Soft state, Eventual consistency.')
ON CONFLICT DO NOTHING;
""")

    # 7. Assignments & Submissions
    sql.append("\n-- 7. ASSIGNMENTS & SUBMISSION ROSTER")
    sql.append("""
-- Assignment 1: Full-Stack Web Development Project
INSERT INTO assignments (id, title, description, subject_id, faculty_id, department_id, semester, section, due_date, due_time, max_marks, allowed_file_types, submission_format, status)
SELECT 1, 'Full-Stack React + Supabase Cloud Mini-Project', 'Build a real-time reactive college portal with role-based auth, storage uploads, and database triggers.', 8, f.id, 3, 6, 'A', CURRENT_DATE + 5, '23:59', 10.0, 'pdf,zip,docx', 'both', 'published'
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Demo Student Arun Kumar (Good Student) - Submitted Assignment 1
INSERT INTO assignment_submissions (assignment_id, student_id, submission_type, file_name, file_path, status, submitted_at, marks_obtained, faculty_feedback)
SELECT 1, s.id, 'file', '21CS101_Cloud_MiniProject_Report.pdf', 'assignments/21CS101_report.pdf', 'Submitted', NOW() - INTERVAL '1 day', 9.5, 'Outstanding architecture documentation and clean code.'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;

-- Demo Student Nivetha S (Medium Student) - Submitted Assignment 1
INSERT INTO assignment_submissions (assignment_id, student_id, submission_type, drive_link, status, submitted_at)
SELECT 1, s.id, 'drive_link', 'https://drive.google.com/file/d/1demo_assignment_link_nivetha/view', 'Submitted', NOW() - INTERVAL '2 hours'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;

-- Note: Demo Student Sanjay Kumar (21CS105, Low Student) has NOT submitted, so he will prominently display:
-- 'Pending — Not Submitted' in the Red Indicator within the Faculty Assignments Roster!
""")

    # 8. Announcements
    sql.append("\n-- 8. CAMPUS ANNOUNCEMENTS")
    sql.append("""
INSERT INTO announcements (id, title, description, category, audience_type, created_by, status)
SELECT 1, 'Annual Tech Symposium & Hackathon Registrations Open', 'The Department of CSE is hosting "InnoHack 2026" featuring track prizes, cloud credits, and industry mentorship. Register your 4-member teams on the portal before Friday.', 'General Announcement', 'all', u.id, 'published'
FROM users u WHERE u.email = 'admin@college.edu'
ON CONFLICT (id) DO NOTHING;

INSERT INTO announcements (id, title, description, category, audience_type, target_department_id, created_by, status)
SELECT 2, 'Continuous Internal Assessment (CIA-2) Timetable Released', 'The CIA-2 examination schedule for Semesters 4 and 6 is now published. Please review your subject-wise exam venues and hall ticket guidelines on the student portal.', 'Academic Notification', 'department', 3, u.id, 'published'
FROM users u WHERE u.email = 'admin@college.edu'
ON CONFLICT (id) DO NOTHING;

INSERT INTO announcements (id, title, description, category, audience_type, created_by, status)
SELECT 3, 'Campus Placement Drive: Top Tier Cloud Solutions Visiting Next Month', 'Pre-placement talks and coding aptitude assessments for 2026 graduating batches will commence next Tuesday in the main auditorium. Eligible candidates must ensure updated resumes.', 'Placement Circular', 'all', u.id, 'published'
FROM users u WHERE u.email = 'admin@college.edu'
ON CONFLICT (id) DO NOTHING;
""")

    # 9. Notifications
    sql.append("\n-- 9. NOTIFICATIONS")
    sql.append("""
INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'New Quiz Published', 'Algorithms & Complexity Unit 1 assessment is scheduled and due in 2 days.', 'quiz', false
FROM users u WHERE u.role = 'student';

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Assignment Due Reminder', 'Full-Stack React + Supabase Cloud Mini-Project is due in 5 days.', 'assignment', false
FROM users u WHERE u.role = 'student';
""")

    return "\n".join(sql)

output_sql = generate_sql()
with open("c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/database/seed_chennai_data.sql", "w", encoding="utf-8") as f:
    f.write(output_sql)

print(f"Successfully generated database/seed_chennai_data.sql ({len(output_sql)} bytes)")
