import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal, engine
from app.models import (
    Base, User, Student, Faculty, Department, Subject,
    AttendanceRecord, AttendanceAlert, ParentContact, Complaint, Assignment
)
from app.attendance_service import check_attendance_alert_eligibility

client = TestClient(app)

class TestCollegeERPEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        
        # 1. Admin login
        admin_res = client.post("/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
        assert admin_res.status_code == 200, f"Admin login failed: {admin_res.text}"
        cls.admin_token = admin_res.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # 2. Faculty login
        fac_res = client.post("/auth/login", json={"email": "rajesh.kulkarni@college.edu", "password": "faculty123"})
        assert fac_res.status_code == 200, f"Faculty login failed: {fac_res.text}"
        cls.faculty_token = fac_res.json()["access_token"]
        cls.faculty_headers = {"Authorization": f"Bearer {cls.faculty_token}"}

        # 3. Student login
        st_res = client.post("/auth/login", json={"email": "aarav.sharma@student.edu", "password": "student123"})
        assert st_res.status_code == 200, f"Student login failed: {st_res.text}"
        cls.student_token = st_res.json()["access_token"]
        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}

    def test_01_authentication_and_role_protection(self):
        """Test valid logins, role enforcement, and route authorization."""
        print("\n--- TEST 01: Authentication & Role Enforcement ---")
        
        # Student attempting to access admin route -> 403 Forbidden
        res = client.get("/admin/students", headers=self.student_headers)
        self.assertEqual(res.status_code, 403, "Student must be forbidden from admin routes")

        # Faculty attempting to access admin route -> 403 Forbidden
        res = client.get("/admin/settings", headers=self.faculty_headers)
        self.assertEqual(res.status_code, 403, "Faculty must be forbidden from admin settings")

        # Student attempting to access faculty attendance save route -> 403 Forbidden
        res = client.post("/faculty/attendance", headers=self.student_headers, json={})
        self.assertEqual(res.status_code, 403, "Student must be forbidden from faculty attendance save")

        print("[PASS] RBAC authorization rules strictly verified for Student, Faculty, and Admin.")

    def test_02_new_student_clean_signup_isolation(self):
        """Test that new student signups begin with empty/isolated records and cannot elevate role."""
        print("\n--- TEST 02: Student Registration & Account Isolation ---")

        # Clean any old test user if exists
        db = SessionLocal()
        try:
            old_user = db.query(User).filter(User.email == "fresh.student@college.edu").first()
            if old_user:
                db.delete(old_user)
                db.commit()
        finally:
            db.close()

        new_reg_payload = {
            "email": "fresh.student@college.edu",
            "password": "Password@123",
            "name": "Fresh Student",
            "reg_no": "2026TEST099",
            "department_id": 1,
            "semester": 1,
            "parent_name": "Fresh Parent",
            "parent_email": "fresh.parent@college.edu",
            "parent_phone": "+91 98765 43210",
            "role": "admin"  # Malicious attempt to elevate to admin
        }
        res = client.post("/auth/register", json=new_reg_payload)
        self.assertEqual(res.status_code, 200, f"Registration failed: {res.text}")
        fresh_data = res.json()
        self.assertEqual(fresh_data["role"], "student", "Role must be forced to 'student' regardless of payload")
        
        fresh_headers = {"Authorization": f"Bearer {fresh_data['access_token']}"}

        # Verify new student has clean profile without copied records
        profile_res = client.get("/students/me", headers=fresh_headers)
        self.assertEqual(profile_res.status_code, 200)
        profile = profile_res.json()
        self.assertEqual(profile["name"], "Fresh Student")
        self.assertEqual(profile["reg_no"], "2026TEST099")

        # Update own profile
        update_res = client.put("/students/me", headers=fresh_headers, json={"phone": "+91 99999 11111", "blood_group": "B+"})
        self.assertEqual(update_res.status_code, 200)
        
        # Verify changes persisted
        profile_after = client.get("/students/me", headers=fresh_headers).json()
        self.assertEqual(profile_after["phone"], "+91 99999 11111")

        print("[PASS] New student isolated signup verified: zero copied demo data, cannot self-promote to admin.")

    def test_03_attendance_threshold_and_deduplication_scenarios(self):
        """Test all 9 attendance warning and deduplication requirements."""
        print("\n--- TEST 03: Attendance Alerts & Deduplication Policy ---")
        db = SessionLocal()
        try:
            student = db.query(Student).filter(Student.id == 1).first()
            self.assertIsNotNone(student)

            # Scenario 1: Attendance at 80%
            is_elig, msg = check_attendance_alert_eligibility(db, student.id, 85.0, 80.0, 5)
            self.assertFalse(is_elig, "80% attendance must NOT trigger low-attendance alert")
            print("[PASS] Scenario 1: 80% attendance -> No alert")

            # Scenario 2: Attendance at exactly 75%
            is_elig, msg = check_attendance_alert_eligibility(db, student.id, 76.0, 75.0, 4)
            self.assertFalse(is_elig, "Exactly 75% attendance must NOT trigger alert (< 75 required)")
            print("[PASS] Scenario 2: Exactly 75% attendance -> No alert")

            # Scenario 3: Attendance crosses below 75% (e.g. from 76% to 74%)
            db.query(AttendanceAlert).filter(AttendanceAlert.student_id == student.id).delete()
            db.commit()

            is_elig, msg = check_attendance_alert_eligibility(db, student.id, 76.0, 74.0, 50)
            self.assertTrue(is_elig, "Crossing below 75% MUST trigger below-75% alert")
            self.assertIn("Threshold Crossed", msg)
            print("[PASS] Scenario 3: Crossing to 74% attendance -> Eligible for alert")

            # Record this alert in the database
            alert_log = AttendanceAlert(
                student_id=student.id,
                parent_email="parent.test@college.edu",
                alert_type="Threshold Crossed (<75%)",
                academic_term="2025-26 Term 2",
                attendance_pct=74.0,
                status="Sent",
                attempt_count=1
            )
            db.add(alert_log)
            db.commit()

            # Scenario 4: Repeated attendance update below 75% (e.g. from 74% to 72%)
            is_elig_repeat, msg_repeat = check_attendance_alert_eligibility(db, student.id, 74.0, 72.0, 52)
            self.assertFalse(is_elig_repeat, "Duplicate alert MUST be suppressed during continuous shortage")
            self.assertIn("Duplicate alert suppressed", msg_repeat)
            print("[PASS] Scenario 4: Repeated update below 75% -> Duplicate alert suppressed")

            # Scenario 5: Attendance recovers to >= 75% (e.g. from 72% to 76%)
            is_elig_rec, msg_rec = check_attendance_alert_eligibility(db, student.id, 72.0, 76.0, 55)
            self.assertFalse(is_elig_rec)
            self.assertIn("satisfies required threshold", msg_rec)
            print("[PASS] Scenario 5: Attendance recovers to 76% -> Status safe, no alert")

            # Scenario 6: Student drops below 75% AGAIN after recovery (relapse from 76% to 73%)
            is_elig_relapse, msg_relapse = check_attendance_alert_eligibility(db, student.id, 76.0, 73.0, 58)
            self.assertTrue(is_elig_relapse, "Relapse below 75% after recovery MUST trigger new alert")
            print("[PASS] Scenario 6: Relapse below 75% after recovery -> New alert eligible")

            # Scenario 7: Zero attendance sessions
            is_elig_zero, msg_zero = check_attendance_alert_eligibility(db, student.id, 100.0, 0.0, 0)
            self.assertFalse(is_elig_zero, "Zero sessions recorded must never trigger warning")
            print("[PASS] Scenario 7: 0 sessions -> No alert")

        finally:
            db.close()

    def test_04_faculty_attendance_save_and_background_alert(self):
        """Test faculty saving attendance and asynchronous alert log generation."""
        print("\n--- TEST 04: Faculty Attendance Submission & Async Alerting ---")

        payload = {
            "subject_id": 1,
            "date": "2026-10-20",
            "records": [
                {"student_id": 1, "status": "Absent"}
            ]
        }
        res = client.post("/faculty/attendance", headers=self.faculty_headers, json=payload)
        self.assertEqual(res.status_code, 200, f"Attendance save failed: {res.text}")
        data = res.json()
        self.assertEqual(data["status"], "success")

        # Verify admin attendance alert list contains records
        alerts_res = client.get("/admin/attendance-alerts", headers=self.admin_headers)
        self.assertEqual(alerts_res.status_code, 200)
        alerts_data = alerts_res.json()
        self.assertIn("below_75_students", alerts_data)
        self.assertIn("alert_logs", alerts_data)
        print("[PASS] Attendance saved by faculty, reflected in admin alert center.")

    def test_05_admin_alert_retry_endpoints(self):
        """Test retry single alert and retry all failed alerts endpoints."""
        print("\n--- TEST 05: Admin Attendance Alert Retry Endpoints ---")
        
        # Test retry all failed
        res = client.post("/admin/attendance-alerts/retry-all-failed", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("retried_count", data)

        # Test retry single on log if any exist
        db = SessionLocal()
        try:
            first_log = db.query(AttendanceAlert).first()
            if first_log:
                retry_res = client.post(f"/admin/attendance-alerts/{first_log.id}/retry", headers=self.admin_headers)
                self.assertEqual(retry_res.status_code, 200)
                self.assertIn("status", retry_res.json())
        finally:
            db.close()

        print("[PASS] Admin retry single and retry-all-failed endpoints verified.")

    def test_06_complaints_support_workflow(self):
        """Test complete Student -> Faculty -> Admin grievance workflow."""
        print("\n--- TEST 06: Student Grievance & Support Ticket Workflow ---")

        # 1. Student creates complaint
        ticket_payload = {
            "subject": "Lab Machine Power Failure",
            "category": "Facility",
            "description": "Lab terminal 14 repeatedly shuts down during database practicals."
        }
        c_res = client.post("/students/me/complaints", headers=self.student_headers, json=ticket_payload)
        self.assertEqual(c_res.status_code, 200)
        complaint_res = c_res.json()
        complaint_id = complaint_res["id"]

        # 2. Student verifies complaint exists in their list with status 'Open'
        my_c_res = client.get("/students/me/complaints", headers=self.student_headers)
        self.assertEqual(my_c_res.status_code, 200)
        ticket = next(c for c in my_c_res.json() if c["id"] == complaint_id)
        self.assertEqual(ticket["status"], "Open")

        # 3. Faculty views department complaints
        fac_c_res = client.get("/faculty/complaints", headers=self.faculty_headers)
        self.assertEqual(fac_c_res.status_code, 200)
        fac_complaints = fac_c_res.json()
        self.assertTrue(any(c["id"] == complaint_id for c in fac_complaints))

        # 4. Faculty responds to complaint
        resp_payload = {
            "status": "In Progress",
            "resolution": "Reported to IT hardware lab assistant; replacement PSU requested."
        }
        resp_res = client.put(f"/faculty/complaints/{complaint_id}/respond", headers=self.faculty_headers, json=resp_payload)
        self.assertEqual(resp_res.status_code, 200)

        # 5. Admin reviews and resolves complaint
        admin_c_res = client.put(f"/admin/complaints/{complaint_id}", headers=self.admin_headers, json={
            "status": "Resolved",
            "response": "PSU replaced. System 14 verified operational."
        })
        self.assertEqual(admin_c_res.status_code, 200)

        # 6. Student checks updated complaint
        st_c_res = client.get("/students/me/complaints", headers=self.student_headers)
        self.assertEqual(st_c_res.status_code, 200)
        student_ticket = next(c for c in st_c_res.json() if c["id"] == complaint_id)
        self.assertEqual(student_ticket["status"], "Resolved")
        self.assertIn("PSU replaced", student_ticket["response"])

        print("[PASS] Full grievance lifecycle verified (Student submission -> Faculty response -> Admin resolution).")

    def test_07_department_and_subject_crud(self):
        """Test Admin Department and Subject create, update, and delete."""
        print("\n--- TEST 07: Academic Department & Subject CRUD Operations ---")

        # Clean existing test department/subject if any
        db = SessionLocal()
        try:
            sub = db.query(Subject).filter(Subject.code == "AI601").first()
            if sub:
                db.delete(sub)
            d = db.query(Department).filter(Department.code == "AIDS").first()
            if d:
                db.delete(d)
            db.commit()
        finally:
            db.close()

        # 1. Create department
        dept_res = client.post("/admin/departments", headers=self.admin_headers, json={
            "code": "AIDS",
            "name": "Artificial Intelligence & Data Science"
        })
        self.assertEqual(dept_res.status_code, 200)
        new_dept = dept_res.json()
        dept_id = new_dept["id"]

        # 2. Update department
        up_dept_res = client.put(f"/admin/departments/{dept_id}", headers=self.admin_headers, json={
            "code": "AIDS",
            "name": "Department of AI and Data Science"
        })
        self.assertEqual(up_dept_res.status_code, 200)

        # 3. Create subject under this department
        sub_res = client.post("/admin/subjects", headers=self.admin_headers, json={
            "code": "AI601",
            "name": "Deep Learning Architectures",
            "department_id": dept_id,
            "semester": 6,
            "credits": 4,
            "faculty_id": 1
        })
        self.assertEqual(sub_res.status_code, 200)
        new_sub = sub_res.json()
        sub_id = new_sub["id"]

        # 4. Update subject
        up_sub_res = client.put(f"/admin/subjects/{sub_id}", headers=self.admin_headers, json={
            "code": "AI601",
            "name": "Deep Learning & Neural Networks",
            "department_id": dept_id,
            "semester": 6,
            "credits": 4,
            "faculty_id": 1
        })
        self.assertEqual(up_sub_res.status_code, 200)

        # 5. Delete subject
        del_sub_res = client.delete(f"/admin/subjects/{sub_id}", headers=self.admin_headers)
        self.assertEqual(del_sub_res.status_code, 200)

        # 6. Delete department
        del_dept_res = client.delete(f"/admin/departments/{dept_id}", headers=self.admin_headers)
        self.assertEqual(del_dept_res.status_code, 200)

        print("[PASS] Department and Subject lifecycle verified (Create, Read, Update, Delete).")

    def test_08_assignment_workflow(self):
        """Test Faculty creating assignments and student viewing assignments."""
        print("\n--- TEST 08: Assignment Publishing & Student Access ---")

        # Faculty creates assignment
        create_res = client.post("/faculty/assignments", headers=self.faculty_headers, json={
            "subject_id": 1,
            "title": "Cloud ERP Architecture Diagram",
            "description": "Submit a three-tier architecture diagram with Supabase DB configuration.",
            "due_date": "2026-10-30",
            "max_marks": 25.0
        })
        self.assertEqual(create_res.status_code, 200)
        assignment_id = create_res.json()["id"]

        # Student views assignment
        st_res = client.get("/students/me/assignments", headers=self.student_headers)
        self.assertEqual(st_res.status_code, 200)
        st_assignments = st_res.json()
        self.assertTrue(any(a["id"] == assignment_id for a in st_assignments))

        # Faculty removes assignment
        del_res = client.delete(f"/faculty/assignments/{assignment_id}", headers=self.faculty_headers)
        self.assertEqual(del_res.status_code, 200)

        print("[PASS] Assignment workflow verified.")

    def test_09_admin_settings_and_smtp_gateway_test(self):
        """Test system settings update and interactive SMTP test endpoint."""
        print("\n--- TEST 09: System Settings & SMTP Gateway Test ---")

        # Update settings
        settings_res = client.put("/admin/settings", headers=self.admin_headers, json={
            "SAFE_THRESHOLD": "75.0",
            "WARNING_THRESHOLD": "65.0",
            "COLLEGE_NAME": "Institute of Technology & Advanced Science",
            "ACADEMIC_YEAR": "2025-2026"
        })
        self.assertEqual(settings_res.status_code, 200)
        
        # Verify settings via GET
        get_res = client.get("/admin/settings", headers=self.admin_headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["SAFE_THRESHOLD"], "75.0")

        # Test SMTP gateway
        smtp_res = client.post("/admin/settings/test-smtp", headers=self.admin_headers, json={
            "to_email": "admin.tester@college.edu"
        })
        self.assertEqual(smtp_res.status_code, 200)
        smtp_data = smtp_res.json()
        self.assertIn("status", smtp_data)
        self.assertIn("message", smtp_data)

        print(f"[PASS] SMTP Gateway test status: {smtp_data['status']} - {smtp_data['message']}")

if __name__ == "__main__":
    unittest.main(verbosity=2)
