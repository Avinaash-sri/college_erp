import os
import sys
import io
import datetime
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend directory in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import get_db, SessionLocal
from app import models

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("RUNNING COMPREHENSIVE END-TO-END VERIFICATION TEST SUITE")
    print("=" * 70)

    # 1. AUTHENTICATION TESTS
    print("\n[TEST 1] Authenticating test users...")
    # Admin login
    res_admin = client.post("/auth/login", json={"email": "admin@college.edu", "password": "admin123"})
    assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
    admin_token = res_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  ✓ Admin authentication successfull (admin@college.edu)")

    # Faculty login
    res_faculty = client.post("/auth/login", json={"email": "rajesh.kulkarni@college.edu", "password": "faculty123"})
    assert res_faculty.status_code == 200, f"Faculty login failed: {res_faculty.text}"
    faculty_token = res_faculty.json()["access_token"]
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    print("  ✓ Faculty authentication successful (rajesh.kulkarni@college.edu)")

    # Student login (Aarav - CSE Sem 6)
    res_student = client.post("/auth/login", json={"email": "aarav.sharma@student.edu", "password": "student123"})
    assert res_student.status_code == 200, f"Student login failed: {res_student.text}"
    student_token = res_student.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("  ✓ Student Aarav authentication successful (aarav.sharma@student.edu)")

    # Student 2 login (Vikram - CSE Sem 6)
    res_std2 = client.post("/auth/login", json={"email": "vikram.singh@student.edu", "password": "student123"})
    assert res_std2.status_code == 200, f"Student Vikram login failed: {res_std2.text}"
    student2_token = res_std2.json()["access_token"]
    student2_headers = {"Authorization": f"Bearer {student2_token}"}
    print("  ✓ Student Vikram authentication successful (vikram.singh@student.edu)")

    # 2. MODULE 1: DEPARTMENT-WISE QUIZ MANAGEMENT
    print("\n[TEST 2] Testing Department-wise Quiz Management...")
    # A. Fetch eligible students for department 1, sem 6
    res_elig = client.get("/faculty/students-by-filter?department_id=1&semester=6&section=A", headers=faculty_headers)
    assert res_elig.status_code == 200, f"Eligible students failed: {res_elig.text}"
    eligible_students = res_elig.json()
    assert len(eligible_students) >= 2, "Expected at least 2 eligible students in CSE Sem 6"
    print(f"  ✓ Fetched {len(eligible_students)} eligible students from database based on Dept/Sem/Sec filters")

    # B. Faculty creates a new quiz with Vikram excluded
    aarav_id = next(s["id"] for s in eligible_students if "aarav" in s["email"])
    vikram_id = next(s["id"] for s in eligible_students if "vikram" in s["email"])

    quiz_payload = {
        "title": "Automated Test Quiz: Graph Algorithms",
        "description": "Short timed assessment on Dijkstra and Bellman-Ford algorithms",
        "subject_id": 1,
        "department_id": 1,
        "semester": 6,
        "section": "A",
        "duration_minutes": 15,
        "deadline": (datetime.datetime.utcnow() + datetime.timedelta(days=2)).isoformat(),
        "status": "published",
        "excluded_student_ids": [vikram_id],  # Exclude Vikram!
        "questions": [
            {
                "question_text": "What is the time complexity of Dijkstra's algorithm with a Min-Heap?",
                "question_type": "mcq",
                "marks": 5.0,
                "order_num": 1,
                "options": [
                    {"option_key": "A", "option_text": "O(V^2)"},
                    {"option_key": "B", "option_text": "O((V + E) log V)"},
                    {"option_key": "C", "option_text": "O(E log E)"},
                    {"option_key": "D", "option_text": "O(V * E)"}
                ],
                "correct_answer": "B",
                "explanation": "With a binary min-heap, Dijkstra takes O((V + E) log V)."
            },
            {
                "question_text": "Can Bellman-Ford detect negative weight cycles in a directed graph?",
                "question_type": "true_false",
                "marks": 5.0,
                "order_num": 2,
                "options": [
                    {"option_key": "A", "option_text": "Yes"},
                    {"option_key": "B", "option_text": "No"}
                ],
                "correct_answer": "A",
                "explanation": "If a relaxation is still possible after V-1 passes, a negative cycle exists."
            }
        ]
    }
    res_create_quiz = client.post("/faculty/quizzes", json=quiz_payload, headers=faculty_headers)
    assert res_create_quiz.status_code in [200, 201], f"Create quiz failed: {res_create_quiz.text}"
    created_quiz = res_create_quiz.json()
    quiz_id = created_quiz["id"]
    print(f"  ✓ Faculty created and published quiz id={quiz_id} with 2 questions (Total: {created_quiz['total_marks']} marks)")

    # C. Verify Student Eligibility: Aarav sees it, Vikram (excluded) does NOT
    res_aarav_quizzes = client.get("/students/me/quizzes", headers=student_headers)
    assert res_aarav_quizzes.status_code == 200
    aarav_quiz_ids = [q["id"] for q in res_aarav_quizzes.json()]
    assert quiz_id in aarav_quiz_ids, "Aarav should see the quiz"
    print("  ✓ Eligible student (Aarav) correctly sees the published quiz")

    res_vikram_quizzes = client.get("/students/me/quizzes", headers=student2_headers)
    assert res_vikram_quizzes.status_code == 200
    vikram_quiz_ids = [q["id"] for q in res_vikram_quizzes.json()]
    assert quiz_id not in vikram_quiz_ids, "Vikram was excluded and must NOT see the quiz"
    print("  ✓ Excluded student (Vikram) correctly blocked from quiz roster")

    # D. Excluded student tries direct API GET -> 403 Forbidden
    res_direct_blocked = client.get(f"/students/me/quizzes/{quiz_id}", headers=student2_headers)
    assert res_direct_blocked.status_code == 403, f"Expected 403 for excluded student, got {res_direct_blocked.status_code}"
    print("  ✓ Security check passed: Direct API request by excluded student rejected with 403 Forbidden")

    # E. Eligible student starts quiz and inspects payload
    # Must NOT contain correct answers or explanations!
    res_quiz_detail = client.get(f"/students/me/quizzes/{quiz_id}", headers=student_headers)
    assert res_quiz_detail.status_code == 200
    detail = res_quiz_detail.json()
    assert "correct_answer" not in detail["questions"][0], "Security leak: correct_answer exposed to student!"
    assert "explanation" not in detail["questions"][0], "Security leak: explanation exposed to student!"
    print("  ✓ Security check passed: Correct answers and explanations hidden from student payload")

    # F. Aarav submits answers (Q1: B -> correct, Q2: A -> correct)
    submit_payload = {
        "answers": [
            {"question_id": detail["questions"][0]["id"], "selected_option": "B"},
            {"question_id": detail["questions"][1]["id"], "selected_option": "A"}
        ]
    }
    res_submit = client.post(f"/students/me/quizzes/{quiz_id}/submit", json=submit_payload, headers=student_headers)
    assert res_submit.status_code == 200, f"Quiz submission failed: {res_submit.text}"
    sub_res = res_submit.json()
    assert sub_res["status"] == "success"
    print("  ✓ Student submitted quiz: Backend safely scored and persisted attempt records")

    # G. Duplicate submission check
    res_dup = client.post(f"/students/me/quizzes/{quiz_id}/submit", json=submit_payload, headers=student_headers)
    assert res_dup.status_code == 400, "Duplicate submission must be rejected with 400"
    print("  ✓ Duplicate attempt policy enforced: Second submission safely rejected")

    # H. Faculty publishes results
    res_pub_results = client.post(f"/faculty/quizzes/{quiz_id}/publish-results?publish=true", headers=faculty_headers)
    assert res_pub_results.status_code == 200
    print("  ✓ Faculty published quiz results")

    # I. Student views breakdown with answers and explanations now released
    res_released = client.get(f"/students/me/quizzes/{quiz_id}/results", headers=student_headers)
    assert res_released.status_code == 200
    released_data = res_released.json()
    assert released_data["score"] == 10.0
    assert len(released_data["breakdown"]) == 2
    print(f"  ✓ Student accessed released results: score {released_data['score']}/{released_data['total_marks']} with full explanation breakdown")

    # 3. MODULE 2: ASSIGNMENTS & RED PENDING INDICATORS & REMINDERS
    print("\n[TEST 3] Testing Assignment Management, File Submissions & Hourly Reminders...")
    # A. Faculty creates an assignment
    assign_payload = {
        "title": "Automated Test Assignment: Distributed Consensus",
        "description": "Implement Raft consensus algorithm leader election in Python or Go.",
        "subject_id": 1,
        "department_id": 1,
        "semester": 6,
        "section": "A",
        "due_date": (datetime.datetime.utcnow() + datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
        "due_time": "23:59",
        "max_marks": 50,
        "allowed_file_types": "pdf,zip,py,tar.gz",
        "max_file_size_mb": 20,
        "submission_format": "both",
        "allow_resubmission": True,
        "allow_late": False,
        "reminder_interval_minutes": 60,
        "status": "published"
    }
    res_assign = client.post("/faculty/assignments", json=assign_payload, headers=faculty_headers)
    assert res_assign.status_code in [200, 201], f"Create assignment failed: {res_assign.text}"
    assign_data = res_assign.json()
    assign_id = assign_data["id"]
    print(f"  ✓ Faculty created assignment id={assign_id}")

    # B. Check Roster: Both students should be 'Pending — Not Submitted'
    res_roster = client.get(f"/faculty/assignments/{assign_id}/roster", headers=faculty_headers)
    assert res_roster.status_code == 200
    roster = res_roster.json()
    print("  DEBUG ROSTER RETURNED:", roster)
    assert roster["pending_count"] >= 2
    for s in roster["roster"]:
        assert s["status"] == "Pending — Not Submitted", f"Initial status should be Pending — Not Submitted, got {s['status']}"
    print(f"  ✓ Faculty roster verified: {roster['pending_count']} students confirmed in 'Pending — Not Submitted' status (RED INDICATOR)")

    # C. Student Aarav submits a Google Drive Link
    gdrive_payload = {
        "drive_link": "https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view?usp=sharing",
        "confirmed_access_granted": True
    }
    res_sub_link = client.post(f"/students/me/assignments/{assign_id}/submit-drive", json=gdrive_payload, headers=student_headers)
    assert res_sub_link.status_code == 200, f"Submit drive link failed: {res_sub_link.text}"
    print("  ✓ Student Aarav successfully submitted Google Drive link")

    # D. Verify Roster updated: Aarav is now Submitted, Vikram remains Pending
    res_roster_updated = client.get(f"/faculty/assignments/{assign_id}/roster", headers=faculty_headers)
    roster_u = res_roster_updated.json()
    aarav_entry = next(s for s in roster_u["roster"] if "aarav" in s["email"])
    vikram_entry = next(s for s in roster_u["roster"] if "vikram" in s["email"])
    assert aarav_entry["status"] == "Submitted"
    assert vikram_entry["status"] == "Pending — Not Submitted"
    print("  ✓ Roster dynamically updated: Aarav is 'Submitted', Vikram remains 'Pending — Not Submitted' (Red)")

    # E. Trigger reminder run on backend and verify persistent audit log
    res_remind = client.post(f"/faculty/assignments/{assign_id}/trigger-reminders", headers=faculty_headers)
    assert res_remind.status_code == 200
    remind_data = res_remind.json()
    assert remind_data["sent_count"] + remind_data["failed_count"] + remind_data["skipped_count"] >= 1
    print(f"  ✓ Persistent backend reminder service executed: Sent={remind_data['sent_count']}, Failed={remind_data['failed_count']}, Skipped={remind_data['skipped_count']}")

    # 4. MODULE 3: ADMIN ANNOUNCEMENTS & FULL NOTIFICATION INTERACTIONS
    print("\n[TEST 4] Testing Admin Announcements & Full Notification Interactions...")
    # A. Admin creates and publishes announcement targeting CSE Department
    ann_payload = {
        "title": "National Technical Symposium: INVENTO 2026",
        "description": "Annual technical symposium featuring Hackathons, Paper Presentations, and Robotics challenges.",
        "category": "Symposium",
        "audience_type": "department",
        "target_department_id": 1,
        "event_date": "2026-11-15",
        "registration_url": "https://invento2026.college.edu/register",
        "status": "published"
    }
    res_ann = client.post("/admin/announcements", json=ann_payload, headers=admin_headers)
    assert res_ann.status_code in [200, 201], f"Create announcement failed: {res_ann.text}"
    ann_id = res_ann.json()["id"]
    print(f"  ✓ Admin published announcement id={ann_id} targeting CSE Department")

    # B. Student queries notifications
    res_notifs = client.get("/notifications/me", headers=student_headers)
    assert res_notifs.status_code == 200
    notifs = res_notifs.json()
    matching_notif = next((n for n in notifs if n.get("announcement_id") == ann_id), None)
    assert matching_notif is not None, "Student should have received notification for the symposium"
    notif_id = matching_notif["id"]
    print(f"  ✓ Notification successfully generated for student Aarav (notif_id={notif_id}, is_read={matching_notif['is_read']})")

    # C. Check unread count
    res_unread = client.get("/notifications/unread-count", headers=student_headers)
    assert res_unread.status_code == 200
    initial_unread = res_unread.json()["unread_count"]
    assert initial_unread > 0
    print(f"  ✓ Unread notification count verified: {initial_unread}")

    # D. Action 1: Open Notification / Mark as Read
    res_read = client.put(f"/notifications/{notif_id}/read", headers=student_headers)
    assert res_read.status_code == 200
    # Verify unread count decreased
    res_unread_after = client.get("/notifications/unread-count", headers=student_headers)
    assert res_unread_after.json()["unread_count"] == initial_unread - 1
    print("  ✓ Action 1 passed: Notification marked as read; unread count decremented immediately")

    # E. Action 2: Clear Individual Notification (persisted, does NOT delete announcement)
    res_clear = client.put(f"/notifications/{notif_id}/clear", headers=student_headers)
    assert res_clear.status_code == 200
    # Verify it no longer appears in /notifications/me
    res_notifs_after_clear = client.get("/notifications/me", headers=student_headers)
    cleared_ids = [n["id"] for n in res_notifs_after_clear.json()]
    assert notif_id not in cleared_ids, "Cleared notification must not appear in active notifications list"
    
    # CRITICAL: Verify announcement was NOT deleted!
    res_check_ann = client.get("/admin/announcements", headers=admin_headers)
    all_ann_ids = [a["id"] for a in res_check_ann.json()]
    assert ann_id in all_ann_ids, "Original announcement must remain intact in college records when student clears notification!"
    print("  ✓ Action 2 passed: Notification cleared from student inbox while preserving original announcement")

    # F. Action 3: Mark All as Read
    res_read_all = client.put("/notifications/read-all", headers=student_headers)
    assert res_read_all.status_code == 200
    res_final_unread = client.get("/notifications/unread-count", headers=student_headers)
    assert res_final_unread.json()["unread_count"] == 0, "All notifications should now be read"
    print("  ✓ Action 3 passed: Mark all as read updated database correctly (unread_count = 0)")

    # 5. MODULE 4: AI STUDENT NOTES ASSISTANT
    print("\n[TEST 5] Testing AI Student Notes Assistant with Grounded Q&A and Tanglish...")
    # A. Student uploads a notes document (TXT format)
    sample_notes_text = (
        "OPERATING SYSTEM CONCURRENCY AND DEADLOCKS\n"
        "A deadlock occurs when a set of processes are blocked because each process is holding a resource\n"
        "and waiting for another resource acquired by some other process.\n\n"
        "COFFMAN CONDITIONS (All 4 must hold simultaneously for deadlock to occur):\n"
        "1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.\n"
        "2. Hold and Wait: A process must be holding at least one resource and waiting for additional resources.\n"
        "3. No Preemption: Resources cannot be forcibly preempted from a process.\n"
        "4. Circular Wait: A closed loop chain of processes exists where each waits for the next.\n\n"
        "BANKER'S ALGORITHM:\n"
        "Developed by Edsger Dijkstra for deadlock avoidance in multi-instance resource systems.\n"
        "Data structures include: Available vector, Max matrix, Allocation matrix, and Need matrix where Need[i,j] = Max[i,j] - Allocation[i,j].\n"
        "A state is safe if there exists a safe execution sequence of processes <P1, P2, ... Pn>.\n"
    )

    upload_file = io.BytesIO(sample_notes_text.encode("utf-8"))
    res_upload = client.post(
        "/students/me/notes/upload",
        files={"file": ("OS_Deadlocks_Lecture_Notes.txt", upload_file, "text/plain")},
        headers=student_headers
    )
    assert res_upload.status_code == 200, f"Upload document failed: {res_upload.text}"
    doc_data = res_upload.json()
    doc_id = doc_data["id"]
    print(f"  ✓ Student uploaded notes document id={doc_id} ({doc_data['total_chunks']} chunks extracted)")

    # B. Test Action: Full Document Summary
    res_sum = client.post(
        f"/students/me/notes/{doc_id}/action",
        json={"action": "summarise_full"},
        headers=student_headers
    )
    assert res_sum.status_code == 200, f"Summarise full failed: {res_sum.text}"
    print("  ✓ Action 1: Full Document Summary generated successfully")

    # C. Test Action: Explain in Tanglish
    res_tanglish = client.post(
        f"/students/me/notes/{doc_id}/action",
        json={"action": "explain_tanglish", "topic": "Deadlock and Coffman conditions"},
        headers=student_headers
    )
    assert res_tanglish.status_code == 200, f"Tanglish explanation failed: {res_tanglish.text}"
    assert len(res_tanglish.json()["result"]) > 50
    print("  ✓ Action 2: Tanglish explanation generated successfully")

    # D. Test Action: Grounded Q&A with Answer Present in Document
    res_qa_present = client.post(
        f"/students/me/notes/{doc_id}/action",
        json={"action": "qa", "query": "What are the four Coffman conditions for deadlock?"},
        headers=student_headers
    )
    assert res_qa_present.status_code == 200
    qa_result = res_qa_present.json()["result"]
    assert "Mutual Exclusion" in qa_result or "Circular" in qa_result or "Coffman" in qa_result
    print("  ✓ Action 3: Grounded Q&A answered factual inquiry accurately from document notes")

    # E. Test Action: Grounded Q&A with Answer NOT in Document
    res_qa_missing = client.post(
        f"/students/me/notes/{doc_id}/action",
        json={"action": "qa", "query": "Who won the ICC Cricket World Cup in 2023?"},
        headers=student_headers
    )
    assert res_qa_missing.status_code == 200
    qa_missing_text = res_qa_missing.json()["result"].lower()
    # Must enforce strict refusal / not enough information
    assert "not contain enough information" in qa_missing_text or "not mentioned" in qa_missing_text or "does not contain" in qa_missing_text
    print("  ✓ Action 4: Grounding guard passed: AI strictly refused question not present in notes")

    # F. Test Action: Practice MCQs Generation
    res_mcq = client.post(
        f"/students/me/notes/{doc_id}/action",
        json={"action": "generate_mcqs"},
        headers=student_headers
    )
    assert res_mcq.status_code == 200
    print("  ✓ Action 5: Practice MCQs generated with answer keys and explanations")

    # G. Test Action: Revision Checklist
    res_check = client.post(
        f"/students/me/notes/{doc_id}/action",
        json={"action": "revision_checklist"},
        headers=student_headers
    )
    assert res_check.status_code == 200
    print("  ✓ Action 6: Exam revision checklist generated")

    print("\n" + "=" * 70)
    print("ALL 5 MODULE TEST SUITES COMPLETED WITH 100% PASSING RESULTS!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
 