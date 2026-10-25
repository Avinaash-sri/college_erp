import urllib.request
import json

BASE_BACKEND = 'http://127.0.0.1:8000'
BASE_FRONTEND = 'http://localhost:5173'

def get_json(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post_json(url, data, token=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def run_tests():
    print("=== 1. SERVERS STATUS ===")
    with urllib.request.urlopen(BASE_FRONTEND) as f_res:
        print(f"Frontend Server: HTTP {f_res.status} OK")
    with urllib.request.urlopen(f"{BASE_BACKEND}/health") as b_res:
        print(f"Backend Health: HTTP {b_res.status} OK")

    print("\n=== 2. STUDENT WORKFLOW ===")
    # Login as Sanjay Kumar (58% High Risk)
    login_res = post_json(f"{BASE_BACKEND}/auth/login", {
        "email": "sanjay@college.edu",
        "password": "student123"
    })
    token = login_res["access_token"]
    print(f"Student Login: SUCCESS (Role: {login_res['role']}, Name: {login_res['name']})")

    # Dashboard & Attendance
    dash = get_json(f"{BASE_BACKEND}/students/me/dashboard", token)
    att_pct = dash["attendance"]["overall_percentage"]
    risk = dash["attendance"]["risk_status"]
    rec = dash["attendance"]["recovery_classes"]
    print(f"Student Dashboard: Reg No={dash['student']['reg_no']}, Att={att_pct}%, Risk={risk}")
    print(f"Attendance Recovery Action: Attend {rec} more consecutive classes to reach 75%")
    assert att_pct < 75.0, "Sanjay should be under 75%"
    assert rec > 0, "Recovery classes must be > 0"

    # AI ERP Assistant Test
    q1 = post_json(f"{BASE_BACKEND}/chat", {"message": "What is my attendance?"}, token)
    print("AI Assistant (Attendance):", q1["intent"], "-> Reply length:", len(q1["reply"]))

    q2 = post_json(f"{BASE_BACKEND}/chat", {"message": "How many classes should I attend to reach 75%?"}, token)
    print("AI Assistant (Recovery):", q2["intent"], "-> Reply length:", len(q2["reply"]))

    q3 = post_json(f"{BASE_BACKEND}/chat", {"message": "When is my next exam?"}, token)
    print("AI Assistant (Exams):", q3["intent"], "-> Reply length:", len(q3["reply"]))

    q4 = post_json(f"{BASE_BACKEND}/chat", {"message": "Do I have any pending fees?"}, token)
    print("AI Assistant (Fees):", q4["intent"], "-> Reply length:", len(q4["reply"]))

    print("\n=== 3. FACULTY WORKFLOW ===")
    fac_login = post_json(f"{BASE_BACKEND}/auth/login", {
        "email": "rajesh.kulkarni@college.edu",
        "password": "faculty123"
    })
    fac_token = fac_login["access_token"]
    print(f"Faculty Login: SUCCESS ({fac_login['name']})")

    fac_dash = get_json(f"{BASE_BACKEND}/faculty/dashboard", fac_token)
    print(f"Faculty Dashboard: Handled Courses={fac_dash['subjects_handled']}, At Risk Count={fac_dash['students_at_risk_count']}")

    # Batch Attendance Marking
    att_payload = {
        "subject_id": 1,
        "date": "2026-09-17",
        "session_name": "Lab Session 10",
        "records": [
            {"student_id": 1, "status": "Present"},
            {"student_id": 5, "status": "Absent"}
        ]
    }
    att_res = post_json(f"{BASE_BACKEND}/faculty/attendance", att_payload, fac_token)
    print(f"Attendance Marking: {att_res['status']} ({att_res['message']})")

    print("\n=== 4. ADMIN WORKFLOW & ATTENDANCE ALERT CENTER ===")
    adm_login = post_json(f"{BASE_BACKEND}/auth/login", {
        "email": "admin@college.edu",
        "password": "admin123"
    })
    adm_token = adm_login["access_token"]
    print(f"Admin Login: SUCCESS")

    adm_stats = get_json(f"{BASE_BACKEND}/admin/dashboard-stats", adm_token)
    print(f"Admin Stats: Total Students={adm_stats['total_students']}, Below 75%={adm_stats['students_below_75']}")

    # Attendance Alert Center
    alert_center = get_json(f"{BASE_BACKEND}/admin/attendance-alerts", adm_token)
    below_75 = alert_center["below_75_students"]
    print(f"Attendance Alert Center: {len(below_75)} students below 75% detected")
    for s in below_75:
        print(f"  - {s['name']} ({s['reg_no']}): {s['attendance_pct']}% | Parent: {s['parent_email']} | Recovery: {s['recovery_classes']} classes")

    # Trigger Safe Test Alert
    test_alert = post_json(f"{BASE_BACKEND}/admin/attendance-alerts/test", {"student_id": 5}, adm_token)
    print(f"Test Alert Trigger: {test_alert['status']} (Email Delivery Status: {test_alert['email_status']})")
    assert len(test_alert["email_preview"]) > 100, "Rendered HTML email must be generated"
    print("Rendered Email Preview: Successfully Generated and Verified!")

    print("\n=======================================================")
    print("[SUCCESS] ALL FULL-STACK WORKFLOWS & AUTOMATED TESTS: PASSED")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
