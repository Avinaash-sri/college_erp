-- ============================================================================
-- CHENNAI-BASED SAMPLE DATA SEED SCRIPT (60 STUDENTS ACROSS ECE, IT, CSE)
-- ============================================================================
-- Initial password for all demo accounts: password123
-- Idempotent: Uses ON CONFLICT to prevent duplicate rows
-- ============================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (id, code, name) VALUES (1, 'ECE', 'Electronics and Communication Engineering') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO departments (id, code, name) VALUES (2, 'IT', 'Information Technology') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO departments (id, code, name) VALUES (3, 'CSE', 'Computer Science and Engineering') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 2. ADMIN USER (admin@college.edu / password123)
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('admin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'admin', true) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- 3. FACULTY USER & RECORD (kavitha@college.edu / password123)
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('kavitha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'faculty', true) ON CONFLICT (email) DO UPDATE SET role = 'faculty';
INSERT INTO faculty (user_id, emp_id, name, email, phone, department_id, designation)
SELECT id, 'EMP_CSE_01', 'Dr. Kavitha Raman', 'kavitha@college.edu', '9840123456', 3, 'Professor & HOD'
FROM users WHERE email = 'kavitha@college.edu'
ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name;

-- 4. SUBJECTS
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 1, 'EC601', 'Digital Signal Processing', 1, 6, 4, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 2, 'EC602', 'VLSI Design & Embedded Systems', 1, 6, 4, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 3, 'EC603', 'Wireless Communication Networks', 1, 6, 3, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 4, 'IT601', 'Cloud Computing & Virtualization', 2, 6, 4, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 5, 'IT602', 'Full-Stack Web Development', 2, 6, 4, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 6, 'IT603', 'Information Security & Cryptography', 2, 6, 3, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 7, 'CS601', 'Design and Analysis of Algorithms', 3, 6, 4, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 8, 'CS602', 'Artificial Intelligence & Machine Learning', 3, 6, 4, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO subjects (id, code, name, department_id, semester, credits, faculty_id)
SELECT 9, 'CS603', 'Database Engineering & Distributed Systems', 3, 6, 3, f.id
FROM faculty f WHERE f.emp_id = 'EMP_CSE_01'
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 5.1 ECE STUDENTS (20 STUDENTS)
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('harish@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC101', 'Harish Prabhu', 'harish@college.edu', '9841010001', 1, 6, 'A', 'Prabhu Ramanathan', 'prabhu.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'harish@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Prabhu Ramanathan', 'prabhu.r@gmail.com', '9841010001', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC101'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('dharani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC102', 'Dharani V', 'dharani@college.edu', '9841020002', 1, 6, 'A', 'Vijay Anand', 'vijay.anand@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'dharani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Vijay Anand', 'vijay.anand@gmail.com', '9841020002', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC102'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('manoj@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC103', 'Manoj Kumar', 'manoj@college.edu', '9841030003', 1, 6, 'A', 'Kumaraswamy M', 'kumar.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'manoj@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Kumaraswamy M', 'kumar.m@gmail.com', '9841030003', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC103'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('keerthana@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC104', 'Keerthana R', 'keerthana@college.edu', '9841040004', 1, 6, 'A', 'Ramesh Kumar', 'ramesh.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'keerthana@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Ramesh Kumar', 'ramesh.k@gmail.com', '9841040004', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC104'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('sathish@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC105', 'Sathish Kumar', 'sathish@college.edu', '9841050005', 1, 6, 'A', 'Murugan K', 'murugan.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'sathish@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Murugan K', 'murugan.k@gmail.com', '9841050005', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC105'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('divya.b@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC106', 'Divya Bharathi', 'divya.b@college.edu', '9841060006', 1, 6, 'A', 'Sundaram P', 'sundaram.p@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'divya.b@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Sundaram P', 'sundaram.p@gmail.com', '9841060006', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC106'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('praveen@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC107', 'Praveen Chandran', 'praveen@college.edu', '9841070007', 1, 6, 'A', 'Chandran S', 'chandran.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'praveen@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Chandran S', 'chandran.s@gmail.com', '9841070007', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC107'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('subhashini@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC108', 'Subhashini M', 'subhashini@college.edu', '9841080008', 1, 6, 'A', 'Mani V', 'mani.v@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'subhashini@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Mani V', 'mani.v@gmail.com', '9841080008', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC108'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('vignesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC109', 'Vigneshwaran K', 'vignesh@college.edu', '9841090009', 1, 6, 'A', 'Krishnan G', 'krishnan.g@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'vignesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Krishnan G', 'krishnan.g@gmail.com', '9841090009', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC109'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('lavanya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC110', 'Lavanya S', 'lavanya@college.edu', '9841100010', 1, 6, 'A', 'Selvaraj T', 'selvaraj.t@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'lavanya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Selvaraj T', 'selvaraj.t@gmail.com', '9841100010', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC110'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('aravind@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC111', 'Aravind Swamy', 'aravind@college.edu', '9841110011', 1, 6, 'A', 'Swaminathan R', 'swami.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'aravind@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Swaminathan R', 'swami.r@gmail.com', '9841110011', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC111'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('deepika@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC112', 'Deepika N', 'deepika@college.edu', '9841120012', 1, 6, 'A', 'Natarajan S', 'natarajan.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'deepika@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Natarajan S', 'natarajan.s@gmail.com', '9841120012', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC112'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('karthik.p@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC113', 'Karthikeyan P', 'karthik.p@college.edu', '9841130013', 1, 6, 'A', 'Perumal K', 'perumal.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'karthik.p@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Perumal K', 'perumal.k@gmail.com', '9841130013', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC113'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('sandhya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC114', 'Sandhya V', 'sandhya@college.edu', '9841140014', 1, 6, 'A', 'Venkatesan R', 'venkat.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'sandhya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Venkatesan R', 'venkat.r@gmail.com', '9841140014', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC114'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('saravanan@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC115', 'Saravanan B', 'saravanan@college.edu', '9841150015', 1, 6, 'A', 'Baskaran K', 'baskaran.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'saravanan@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Baskaran K', 'baskaran.k@gmail.com', '9841150015', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC115'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('monisha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC116', 'Monisha T', 'monisha@college.edu', '9841160016', 1, 6, 'A', 'Thangaraj M', 'thangaraj.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'monisha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Thangaraj M', 'thangaraj.m@gmail.com', '9841160016', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC116'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('ganesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC117', 'Ganesh Moorthy', 'ganesh@college.edu', '9841170017', 1, 6, 'A', 'Moorthy S', 'moorthy.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'ganesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Moorthy S', 'moorthy.s@gmail.com', '9841170017', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC117'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('shalini@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC118', 'Shalini P', 'shalini@college.edu', '9841180018', 1, 6, 'A', 'Palani M', 'palani.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'shalini@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Palani M', 'palani.m@gmail.com', '9841180018', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC118'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('naveen@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC119', 'Naveen Prasad', 'naveen@college.edu', '9841190019', 1, 6, 'A', 'Prasad K', 'prasad.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'naveen@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Prasad K', 'prasad.k@gmail.com', '9841190019', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC119'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('janani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21EC120', 'Janani K', 'janani@college.edu', '9841200020', 1, 6, 'A', 'Kothandaraman V', 'kothanda.v@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'janani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Kothandaraman V', 'kothanda.v@gmail.com', '9841200020', 'Parent/Guardian', true
FROM students WHERE reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 1, 6 FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 2, 6 FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 3, 6 FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 1, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21EC120'
ON CONFLICT DO NOTHING;

-- 5.2 IT STUDENTS (20 STUDENTS)
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('kavin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT101', 'Kavin Raj', 'kavin@college.edu', '9841010001', 2, 6, 'A', 'Rajendran S', 'rajendran.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'kavin@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Rajendran S', 'rajendran.s@gmail.com', '9841010001', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT101'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('anitha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT102', 'Anitha Ramasamy', 'anitha@college.edu', '9841020002', 2, 6, 'A', 'Ramasamy K', 'ramasamy.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'anitha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Ramasamy K', 'ramasamy.k@gmail.com', '9841020002', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT102'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('balaji@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT103', 'Balaji Venkatesh', 'balaji@college.edu', '9841030003', 2, 6, 'A', 'Venkatesh Babu', 'venkatesh.b@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'balaji@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Venkatesh Babu', 'venkatesh.b@gmail.com', '9841030003', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT103'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('gayathri@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT104', 'Gayathri Natarajan', 'gayathri@college.edu', '9841040004', 2, 6, 'A', 'Natarajan P', 'natarajan.p@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'gayathri@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Natarajan P', 'natarajan.p@gmail.com', '9841040004', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT104'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('dinesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT105', 'Dinesh Karthik', 'dinesh@college.edu', '9841050005', 2, 6, 'A', 'Karthikeyan S', 'karthik.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'dinesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Karthikeyan S', 'karthik.s@gmail.com', '9841050005', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT105'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('poornima@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT106', 'Poornima Devi', 'poornima@college.edu', '9841060006', 2, 6, 'A', 'Devendran M', 'devendran.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'poornima@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Devendran M', 'devendran.m@gmail.com', '9841060006', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT106'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('sridhar@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT107', 'Sridhar Ganesan', 'sridhar@college.edu', '9841070007', 2, 6, 'A', 'Ganesan T', 'ganesan.t@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'sridhar@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Ganesan T', 'ganesan.t@gmail.com', '9841070007', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT107'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('meenakshi@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT108', 'Meenakshi S', 'meenakshi@college.edu', '9841080008', 2, 6, 'A', 'Shanmugam K', 'shanmugam.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'meenakshi@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Shanmugam K', 'shanmugam.k@gmail.com', '9841080008', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT108'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('pradeep@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT109', 'Pradeep Kumar', 'pradeep@college.edu', '9841090009', 2, 6, 'A', 'Vijayakumar R', 'vijay.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'pradeep@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Vijayakumar R', 'vijay.r@gmail.com', '9841090009', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT109'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('revathi@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT110', 'Revathi Murugan', 'revathi@college.edu', '9841100010', 2, 6, 'A', 'Murugesan P', 'murugesan.p@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'revathi@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Murugesan P', 'murugesan.p@gmail.com', '9841100010', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT110'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('gokul@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT111', 'Gokulnath R', 'gokul@college.edu', '9841110011', 2, 6, 'A', 'Ravichandran M', 'ravi.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'gokul@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Ravichandran M', 'ravi.m@gmail.com', '9841110011', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT111'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('hema@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT112', 'Hemalatha C', 'hema@college.edu', '9841120012', 2, 6, 'A', 'Chandrasekaran V', 'chandra.v@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'hema@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Chandrasekaran V', 'chandra.v@gmail.com', '9841120012', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT112'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('rajesh.k@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT113', 'Rajesh Kannan', 'rajesh.k@college.edu', '9841130013', 2, 6, 'A', 'Kannan S', 'kannan.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'rajesh.k@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Kannan S', 'kannan.s@gmail.com', '9841130013', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT113'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('sowmya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT114', 'Sowmya Lakshmi', 'sowmya@college.edu', '9841140014', 2, 6, 'A', 'Lakshmipathy K', 'lakshmi.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'sowmya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Lakshmipathy K', 'lakshmi.k@gmail.com', '9841140014', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT114'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('vasanth@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT115', 'Vasanth Kumar', 'vasanth@college.edu', '9841150015', 2, 6, 'A', 'Saravanan R', 'saravanan.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'vasanth@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Saravanan R', 'saravanan.r@gmail.com', '9841150015', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT115'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('pavithra@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT116', 'Pavithra M', 'pavithra@college.edu', '9841160016', 2, 6, 'A', 'Mahalingam S', 'mahalingam.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'pavithra@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Mahalingam S', 'mahalingam.s@gmail.com', '9841160016', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT116'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('vijay.s@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT117', 'Vijay Sethupathi', 'vijay.s@college.edu', '9841170017', 2, 6, 'A', 'Sethuraman P', 'sethu.p@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'vijay.s@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Sethuraman P', 'sethu.p@gmail.com', '9841170017', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT117'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('sneha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT118', 'Sneha Parthasarathy', 'sneha@college.edu', '9841180018', 2, 6, 'A', 'Parthasarathy K', 'partha.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'sneha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Parthasarathy K', 'partha.k@gmail.com', '9841180018', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT118'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('ashwin@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT119', 'Ashwin Raghav', 'ashwin@college.edu', '9841190019', 2, 6, 'A', 'Raghavan N', 'raghavan.n@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'ashwin@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Raghavan N', 'raghavan.n@gmail.com', '9841190019', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT119'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('tharani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21IT120', 'Tharani K', 'tharani@college.edu', '9841200020', 2, 6, 'A', 'Kailasam M', 'kailasam.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'tharani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Kailasam M', 'kailasam.m@gmail.com', '9841200020', 'Parent/Guardian', true
FROM students WHERE reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 4, 6 FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 5, 6 FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 6, 6 FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 4, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21IT120'
ON CONFLICT DO NOTHING;

-- 5.3 CSE STUDENTS (20 STUDENTS)
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('arun@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS101', 'Arun Kumar', 'arun@college.edu', '9841010001', 3, 6, 'A', 'Kumaravel S', 'kumaravel.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'arun@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Kumaravel S', 'kumaravel.s@gmail.com', '9841010001', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS101'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('nivetha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS102', 'Nivetha S', 'nivetha@college.edu', '9841020002', 3, 6, 'A', 'Sundaramorthy K', 'sundar.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'nivetha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Sundaramorthy K', 'sundar.k@gmail.com', '9841020002', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS102'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('vignesh.r@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS103', 'Vigneshwaran R', 'vignesh.r@college.edu', '9841030003', 3, 6, 'A', 'Ramakrishnan S', 'ramki.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'vignesh.r@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Ramakrishnan S', 'ramki.s@gmail.com', '9841030003', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS103'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('pooja@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS104', 'Pooja Sundaram', 'pooja@college.edu', '9841040004', 3, 6, 'A', 'Sundaram V', 'sundaram.v@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'pooja@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Sundaram V', 'sundaram.v@gmail.com', '9841040004', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS104'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('sanjay@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS105', 'Sanjay Kumar', 'sanjay@college.edu', '9841050005', 3, 6, 'A', 'Mohan Kumar R', 'mohan.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'sanjay@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Mohan Kumar R', 'mohan.r@gmail.com', '9841050005', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS105'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('akshaya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS106', 'Akshaya Raman', 'akshaya@college.edu', '9841060006', 3, 6, 'A', 'Ramanathan M', 'raman.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'akshaya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Ramanathan M', 'raman.m@gmail.com', '9841060006', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS106'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('kishore@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS107', 'Kishore Kumar', 'kishore@college.edu', '9841070007', 3, 6, 'A', 'Gopalakrishnan P', 'gopal.p@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'kishore@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Gopalakrishnan P', 'gopal.p@gmail.com', '9841070007', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS107'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('swetha@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS108', 'Swetha Varadharajan', 'swetha@college.edu', '9841080008', 3, 6, 'A', 'Varadharajan K', 'varadhan.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'swetha@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Varadharajan K', 'varadhan.k@gmail.com', '9841080008', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS108'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('mukesh@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS109', 'Mukesh Kannan', 'mukesh@college.edu', '9841090009', 3, 6, 'A', 'Kannan D', 'kannan.d@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'mukesh@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Kannan D', 'kannan.d@gmail.com', '9841090009', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS109'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('bhavani@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS110', 'Bhavani Shankar', 'bhavani@college.edu', '9841100010', 3, 6, 'A', 'Shankaran T', 'shankaran.t@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'bhavani@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Shankaran T', 'shankaran.t@gmail.com', '9841100010', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS110'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('surya@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS111', 'Surya Narayanan', 'surya@college.edu', '9841110011', 3, 6, 'A', 'Narayanan S', 'narayanan.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'surya@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Narayanan S', 'narayanan.s@gmail.com', '9841110011', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS111'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('madhu@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS112', 'Madhumitha K', 'madhu@college.edu', '9841120012', 3, 6, 'A', 'Kasiviswanathan R', 'kasi.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'madhu@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Kasiviswanathan R', 'kasi.r@gmail.com', '9841120012', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS112'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('ajith@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS113', 'Ajith Kumar', 'ajith@college.edu', '9841130013', 3, 6, 'A', 'Subramanian M', 'subramanian.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'ajith@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Subramanian M', 'subramanian.m@gmail.com', '9841130013', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS113'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('preethi@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS114', 'Preethi S', 'preethi@college.edu', '9841140014', 3, 6, 'A', 'Srinivasan K', 'srini.k@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'preethi@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Srinivasan K', 'srini.k@gmail.com', '9841140014', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS114'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('raghav@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS115', 'Raghavendra Rao', 'raghav@college.edu', '9841150015', 3, 6, 'A', 'Ramamurthy R', 'ramamurthy.r@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'raghav@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Ramamurthy R', 'ramamurthy.r@gmail.com', '9841150015', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS115'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('kavitha.s@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS116', 'Kavitha Selvam', 'kavitha.s@college.edu', '9841160016', 3, 6, 'A', 'Selvarajan N', 'selvaraj.n@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'kavitha.s@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Selvarajan N', 'selvaraj.n@gmail.com', '9841160016', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS116'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('madhavan@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS117', 'Madhavan Govind', 'madhavan@college.edu', '9841170017', 3, 6, 'A', 'Govindaraj P', 'govind.p@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'madhavan@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Govindaraj P', 'govind.p@gmail.com', '9841170017', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS117'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('charu@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS118', 'Charulatha V', 'charu@college.edu', '9841180018', 3, 6, 'A', 'Veeramani S', 'veeramani.s@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'charu@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Veeramani S', 'veeramani.s@gmail.com', '9841180018', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS118'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('karthik.r@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS119', 'Karthik Raja', 'karthik.r@college.edu', '9841190019', 3, 6, 'A', 'Rajagopal M', 'rajagopal.m@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'karthik.r@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Rajagopal M', 'rajagopal.m@gmail.com', '9841190019', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS119'
ON CONFLICT DO NOTHING;
INSERT INTO users (email, hashed_password, role, is_active) VALUES ('anand@college.edu', '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe', 'student', true) ON CONFLICT (email) DO UPDATE SET is_active = true;
INSERT INTO students (user_id, reg_no, name, email, phone, department_id, semester, section, parent_name, parent_email, address)
SELECT id, '21CS120', 'Anand Subramanian', 'anand@college.edu', '9841200020', 3, 6, 'A', 'Subramaniam V', 'subbu.v@gmail.com', 'Chennai, Tamil Nadu'
FROM users WHERE email = 'anand@college.edu'
ON CONFLICT (reg_no) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
INSERT INTO parent_contacts (student_id, name, email, phone, relationship_type, is_primary)
SELECT id, 'Subramaniam V', 'subbu.v@gmail.com', '9841200020', 'Parent/Guardian', true
FROM students WHERE reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 7, 6 FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 8, 6 FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO enrollments (student_id, subject_id, semester)
SELECT s.id, 9, 6 FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-01', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-02', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-03', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-04', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-05', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-06', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-07', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-08', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-09', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-10', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-11', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-12', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-13', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-14', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-15', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-16', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-17', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-18', 'Present', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-19', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status, session_name)
SELECT s.id, 7, '2026-09-20', 'Absent', 'Lecture'
FROM students s WHERE s.reg_no = '21CS120'
ON CONFLICT DO NOTHING;

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


-- 6. QUIZZES (Controlled Result Release Demonstration)

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


-- 7. ASSIGNMENTS & SUBMISSION ROSTER

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


-- 8. CAMPUS ANNOUNCEMENTS

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


-- 9. NOTIFICATIONS

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'New Quiz Published', 'Algorithms & Complexity Unit 1 assessment is scheduled and due in 2 days.', 'quiz', false
FROM users u WHERE u.role = 'student';

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Assignment Due Reminder', 'Full-Stack React + Supabase Cloud Mini-Project is due in 5 days.', 'assignment', false
FROM users u WHERE u.role = 'student';
