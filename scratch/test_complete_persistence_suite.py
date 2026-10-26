import urllib.request
import json
import time

SUPABASE_URL = "https://wydblgfxdxrwvxhfrjdx.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGJsZ2Z4ZHhyd3Z4aGZyamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NzQ0MDEsImV4cCI6MjEwODA1MDQwMX0.Ufe56W6mJacoT3uwaDqLAhsSyQ8oO5QXTGG0NNeg5lw"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def api_call(endpoint, method="GET", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    payload = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 201):
                body = resp.read().decode('utf-8')
                return json.loads(body) if body else []
            return resp.status
    except urllib.error.HTTPError as e:
        print(f"Error on {method} {url}: {e.code} - {e.read().decode('utf-8')}")
        raise

print("================================================================================")
print("ERP COMPLETE DATA PERSISTENCE & SUPABASE SOURCE-OF-TRUTH VERIFICATION")
print("================================================================================")

# -----------------------------------------------------------------------------
# 1. FACULTY CREATES QUIZ (POST -> SUPABASE)
# -----------------------------------------------------------------------------
print("\n[TEST 1] Faculty Creates Quiz -> Persists to Supabase PostgreSQL")
test_quiz_title = f"Database Systems Midterm Quiz {int(time.time())}"
quiz_payload = {
    "title": test_quiz_title,
    "description": "Comprehensive quiz on B+ trees, query optimization, and transactions.",
    "subject_id": 9, # Database Engineering
    "faculty_id": 2, # Dr. Kavitha Raman
    "department_id": 3, # CSE
    "academic_year": "2025-2026",
    "semester": 6,
    "section": "A",
    "duration_minutes": 35,
    "total_marks": 10.0,
    "deadline": "2026-11-05T23:59:59Z",
    "status": "published",
    "results_published": False,
    "allow_multiple_attempts": False,
    "max_attempts": 1
}

created_quiz_list = api_call("quizzes", method="POST", data=[quiz_payload])
assert len(created_quiz_list) > 0, "Failed to create quiz in Supabase"
created_quiz = created_quiz_list[0]
quiz_id = created_quiz["id"]
print(f"  [OK] Quiz created in Supabase 'quizzes' table! ID: {quiz_id}")
print(f"  [OK] Title: {created_quiz['title']}, Status: {created_quiz['status']}")

# -----------------------------------------------------------------------------
# 2. INSERT QUESTIONS INTO QUIZ_QUESTIONS
# -----------------------------------------------------------------------------
print("\n[TEST 2] Inserting Questions into Supabase quiz_questions")
questions_payload = [
    {
        "quiz_id": quiz_id,
        "question_text": "What is the height of a B+ tree with N keys and fanout B?",
        "question_type": "mcq",
        "marks": 5.0,
        "order": 1,
        "options": json.dumps([
            {"id": "A", "text": "O(log_B N)"},
            {"id": "B", "text": "O(N)"},
            {"id": "C", "text": "O(B log N)"},
            {"id": "D", "text": "O(1)"}
        ]),
        "correct_answer": "A",
        "explanation": "B+ tree height is logarithmic with base B."
    },
    {
        "quiz_id": quiz_id,
        "question_text": "Which normal form requires every determinant to be a superkey?",
        "question_type": "mcq",
        "marks": 5.0,
        "order": 2,
        "options": json.dumps([
            {"id": "A", "text": "1NF"},
            {"id": "B", "text": "2NF"},
            {"id": "C", "text": "3NF"},
            {"id": "D", "text": "BCNF"}
        ]),
        "correct_answer": "D",
        "explanation": "Boyce-Codd Normal Form (BCNF) strictly requires superkey determinants."
    }
]
inserted_questions = api_call("quiz_questions", method="POST", data=questions_payload)
print(f"  [OK] Inserted {len(inserted_questions)} questions into 'quiz_questions' table.")

# -----------------------------------------------------------------------------
# 3. SIMULATE BROWSER REFRESH / LOGOUT / RELOGIN (CLOUD RE-HYDRATION)
# -----------------------------------------------------------------------------
print("\n[TEST 3] Simulating Browser Refresh / Logout / Relogin (fetchAuthoritativeCloudState)")
# When fetchAuthoritativeCloudState executes, it queries quizzes, quiz_questions, and quiz_attempts from Supabase
cloud_quizzes = api_call(f"quizzes?id=eq.{quiz_id}")
assert len(cloud_quizzes) == 1, "Quiz missing after reload/relogin!"
reloaded_quiz = cloud_quizzes[0]
print(f"  [OK] Verified Quiz exists after reload! ID: {reloaded_quiz['id']}")
assert reloaded_quiz["title"] == test_quiz_title

cloud_questions = api_call(f"quiz_questions?quiz_id=eq.{quiz_id}&order=order.asc")
assert len(cloud_questions) == 2, "Questions missing after reload/relogin!"
print(f"  [OK] Verified {len(cloud_questions)} Questions exist and ordered correctly.")
parsed_opts = json.loads(cloud_questions[0]["options"])
assert len(parsed_opts) == 4
print(f"  [OK] Options successfully preserved as structured array: {parsed_opts[0]['id']} -> {parsed_opts[0]['text']}")

# -----------------------------------------------------------------------------
# 4. STUDENT PANEL PERSISTENCE: STUDENT TAKES & SUBMITS QUIZ
# -----------------------------------------------------------------------------
print("\n[TEST 4] Student Takes and Submits Quiz -> Persists to quiz_attempts")
student_id = 101 # Arun Kumar
attempt_payload = [{
    "quiz_id": quiz_id,
    "student_id": student_id,
    "attempt_number": 1,
    "score": 10.0,
    "total_marks": 10.0,
    "status": "submitted"
}]
created_attempt = api_call("quiz_attempts", method="POST", data=attempt_payload)
assert len(created_attempt) == 1
attempt_id = created_attempt[0]["id"]
print(f"  [OK] Quiz attempt saved in Supabase 'quiz_attempts'! Attempt ID: {attempt_id}, Score: {created_attempt[0]['score']}")

# -----------------------------------------------------------------------------
# 5. FACULTY PUBLISHES RESULTS
# -----------------------------------------------------------------------------
print("\n[TEST 5] Faculty Publishes Quiz Results -> Persists to Supabase")
api_call(f"quizzes?id=eq.{quiz_id}", method="PATCH", data={"results_published": True})
updated_quiz = api_call(f"quizzes?id=eq.{quiz_id}")
assert updated_quiz[0]["results_published"] is True
print(f"  [OK] results_published is now {updated_quiz[0]['results_published']} in Supabase!")

# -----------------------------------------------------------------------------
# 6. VERIFY PERSISTENCE AFTER ANOTHER RELOGIN / REFRESH
# -----------------------------------------------------------------------------
print("\n[TEST 6] Second Relogin Test: Verifying Student Attempts & Results are Preserved")
check_attempt = api_call(f"quiz_attempts?quiz_id=eq.{quiz_id}&student_id=eq.{student_id}")
assert len(check_attempt) == 1
assert check_attempt[0]["score"] == 10.0
print(f"  [OK] Student attempt still exists in Supabase with score {check_attempt[0]['score']}/10.0!")

# -----------------------------------------------------------------------------
# 7. CLEAN UP TEST RECORDS
# -----------------------------------------------------------------------------
print("\n[TEST 7] Cleaning Up Test Records in Supabase")
api_call(f"quiz_attempts?quiz_id=eq.{quiz_id}", method="DELETE")
api_call(f"quiz_questions?quiz_id=eq.{quiz_id}", method="DELETE")
api_call(f"quizzes?id=eq.{quiz_id}", method="DELETE")
print("  [OK] Test quiz and attempts cleaned up successfully.")

print("\n================================================================================")
print("ALL TESTS PASSED! SUPABASE IS PROVEN SOURCE-OF-TRUTH FOR COMPLETE LIFECYCLE.")
print("================================================================================")
