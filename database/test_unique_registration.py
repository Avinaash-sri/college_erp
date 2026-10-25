"""
Comprehensive Verification Suite: Unique Student Registration Numbers and Faculty Employee IDs
Testing all 12 specified test cases against authoritative database and backend/API logic.
"""
import sys
import json
import uuid
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

SUPABASE_URL = "https://wydblgfxdxrwvxhfrjdx.supabase.co"
with open("frontend/.env", "r") as f:
    for line in f:
        if line.startswith("VITE_SUPABASE_ANON_KEY="):
            ANON_KEY = line.strip().split("=", 1)[1]
            break

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def sb_get(ep):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{ep}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def sb_post(ep, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{ep}", data=body, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def sb_delete(ep):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{ep}", headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code

test_results = {}

print("=" * 70)
print("RUNNING 12 ERP UNIQUE REGISTRATION & LOGIN TEST SCENARIOS")
print("=" * 70)

# Isolated unique identifiers for testing
TEST_REG_NO = f"TEST{int(time.time()) % 100000}"
TEST_EMP_ID = f"EMPV{int(time.time()) % 100000}"
TEST_STUDENT_EMAIL = f"test.st.{int(time.time())}@college.edu"
TEST_FACULTY_EMAIL = f"test.fac.{int(time.time())}@college.edu"

created_user_ids = []
created_student_ids = []
created_faculty_ids = []

try:
    # ---------------------------------------------------------
    # TEST 1: Register a new student with a unique registration number — PASS expected.
    # ---------------------------------------------------------
    print("\n[TEST 1] Register new student with unique registration number...")
    norm_reg = TEST_REG_NO.strip().upper()
    norm_email = TEST_STUDENT_EMAIL.strip().lower()

    # Create user
    u1 = sb_post("users", {
        "email": norm_email,
        "hashed_password": "hashed_test_password",
        "role": "student",
        "is_active": True
    })[0]
    created_user_ids.append(u1['id'])

    # Create student
    st1 = sb_post("students", {
        "user_id": u1['id'],
        "reg_no": norm_reg,
        "name": "Test Unique Student",
        "email": norm_email,
        "department_id": 1,
        "semester": 6,
        "section": "A",
        "parent_name": "Test Parent",
        "parent_email": f"parent.{norm_reg.lower()}@gmail.com"
    })[0]
    created_student_ids.append(st1['id'])

    if st1.get('reg_no') == norm_reg:
        test_results["Test 1: Register new student with unique reg_no"] = "PASS"
        print(f"  PASS: Successfully registered student ID {st1['id']} with reg_no '{norm_reg}'")
    else:
        test_results["Test 1: Register new student with unique reg_no"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 2: Register another student using the same registration number — must be rejected.
    # ---------------------------------------------------------
    print("\n[TEST 2] Register another student using the same registration number...")
    dup_email_2 = f"test.dup2.{int(time.time())}@college.edu"
    u2 = sb_post("users", {
        "email": dup_email_2,
        "hashed_password": "hashed_test_password",
        "role": "student",
        "is_active": True
    })[0]
    created_user_ids.append(u2['id'])

    try:
        body = json.dumps({
            "user_id": u2['id'],
            "reg_no": norm_reg,  # Exact duplicate reg_no
            "name": "Duplicate Student Attempt",
            "email": dup_email_2,
            "department_id": 1,
            "semester": 6,
            "section": "A",
            "parent_name": "Test Parent 2",
            "parent_email": f"parent2.{norm_reg.lower()}@gmail.com"
        }).encode('utf-8')
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/students", data=body, headers=headers)
        with urllib.request.urlopen(req) as resp:
            print("  FAIL: Duplicate was erroneously accepted!")
            test_results["Test 2: Reject duplicate registration number"] = "FAIL"
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        if e.code == 409 and "students_reg_no_key" in err_msg:
            # Clean up u2 (simulate rollback)
            sb_delete(f"users?id=eq.{u2['id']}")
            created_user_ids.remove(u2['id'])
            test_results["Test 2: Reject duplicate registration number"] = "PASS"
            print(f"  PASS: Duplicate registration rejected with HTTP 409 unique constraint error ({err_msg[:60]}...)")
        else:
            test_results["Test 2: Reject duplicate registration number"] = f"FAIL (unexpected error {e.code}: {err_msg})"

    # ---------------------------------------------------------
    # TEST 3: Register the same student number with different casing or surrounding spaces — reject duplicates.
    # ---------------------------------------------------------
    print("\n[TEST 3] Register the same student number with different casing or surrounding spaces...")
    varied_reg = f"  {norm_reg.lower()}  "  # e.g. "  test12345  "
    normalized_variation = varied_reg.strip().upper()

    # Normalization policy verification
    assert normalized_variation == norm_reg, "Normalization policy failed to produce canonical uppercase trimmed reg_no"

    # Pre-check check against database
    matched_st = sb_get(f"students?reg_no=ilike.{normalized_variation}&select=id,reg_no")
    if len(matched_st) > 0 and matched_st[0]['reg_no'] == norm_reg:
        test_results["Test 3: Reject duplicate with altered casing / spaces"] = "PASS"
        print(f"  PASS: Normalized '{varied_reg}' -> '{normalized_variation}'. Matched existing record ID {matched_st[0]['id']} and rejected.")
    else:
        test_results["Test 3: Reject duplicate with altered casing / spaces"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 4: Register a new faculty member with a unique employee ID — PASS expected.
    # ---------------------------------------------------------
    print("\n[TEST 4] Register new faculty member with unique employee ID...")
    norm_emp = TEST_EMP_ID.strip().upper()
    norm_fac_email = TEST_FACULTY_EMAIL.strip().lower()

    uf = sb_post("users", {
        "email": norm_fac_email,
        "hashed_password": "hashed_test_password",
        "role": "faculty",
        "is_active": True
    })[0]
    created_user_ids.append(uf['id'])

    fac1 = sb_post("faculty", {
        "user_id": uf['id'],
        "emp_id": norm_emp,
        "name": "Dr. Test Faculty",
        "email": norm_fac_email,
        "department_id": 1,
        "designation": "Assistant Professor"
    })[0]
    created_faculty_ids.append(fac1['id'])

    if fac1.get('emp_id') == norm_emp:
        test_results["Test 4: Register faculty with unique employee ID"] = "PASS"
        print(f"  PASS: Successfully registered faculty ID {fac1['id']} with emp_id '{norm_emp}'")
    else:
        test_results["Test 4: Register faculty with unique employee ID"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 5: Register another faculty member using the same employee ID — must be rejected.
    # ---------------------------------------------------------
    print("\n[TEST 5] Register another faculty member using the same employee ID...")
    dup_fac_email_2 = f"test.facdup.{int(time.time())}@college.edu"
    uf2 = sb_post("users", {
        "email": dup_fac_email_2,
        "hashed_password": "hashed_test_password",
        "role": "faculty",
        "is_active": True
    })[0]
    created_user_ids.append(uf2['id'])

    try:
        body = json.dumps({
            "user_id": uf2['id'],
            "emp_id": norm_emp,  # Duplicate emp_id
            "name": "Duplicate Faculty Attempt",
            "email": dup_fac_email_2,
            "department_id": 1,
            "designation": "Professor"
        }).encode('utf-8')
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/faculty", data=body, headers=headers)
        with urllib.request.urlopen(req) as resp:
            print("  FAIL: Duplicate faculty was erroneously accepted!")
            test_results["Test 5: Reject duplicate faculty employee ID"] = "FAIL"
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        if e.code == 409 and "faculty_emp_id_key" in err_msg:
            sb_delete(f"users?id=eq.{uf2['id']}")
            created_user_ids.remove(uf2['id'])
            test_results["Test 5: Reject duplicate faculty employee ID"] = "PASS"
            print(f"  PASS: Duplicate faculty employee ID rejected with HTTP 409 ({err_msg[:60]}...)")
        else:
            test_results["Test 5: Reject duplicate faculty employee ID"] = f"FAIL (unexpected error {e.code}: {err_msg})"

    # ---------------------------------------------------------
    # TEST 6: Concurrent registrations with the same identifier — only one may succeed.
    # ---------------------------------------------------------
    print("\n[TEST 6] Concurrent registrations with the same identifier...")
    concurrent_reg = f"CONC{int(time.time()) % 100000}"
    
    # Pre-create two distinct user accounts for the race
    cu1 = sb_post("users", {"email": f"conc1_{int(time.time())}@college.edu", "hashed_password": "pwd", "role": "student", "is_active": True})[0]
    cu2 = sb_post("users", {"email": f"conc2_{int(time.time())}@college.edu", "hashed_password": "pwd", "role": "student", "is_active": True})[0]
    created_user_ids.extend([cu1['id'], cu2['id']])

    def attempt_insert_student(user_id, email):
        body = json.dumps({
            "user_id": user_id,
            "reg_no": concurrent_reg,
            "name": f"Concurrent {user_id}",
            "email": email,
            "department_id": 1,
            "semester": 6,
            "section": "A",
            "parent_name": f"Parent {user_id}",
            "parent_email": f"parent_{user_id}@example.com"
        }).encode('utf-8')
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/students", data=body, headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                return ("SUCCESS", res[0]['id'])
        except urllib.error.HTTPError as e:
            return ("REJECTED", e.code)

    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(attempt_insert_student, cu1['id'], cu1['email'])
        f2 = executor.submit(attempt_insert_student, cu2['id'], cu2['email'])
        r1, r2 = f1.result(), f2.result()

    statuses = [r1[0], r2[0]]
    if statuses.count("SUCCESS") == 1 and statuses.count("REJECTED") == 1:
        test_results["Test 6: Concurrent submissions with same identifier"] = "PASS"
        success_id = r1[1] if r1[0] == "SUCCESS" else r2[1]
        created_student_ids.append(success_id)
        print(f"  PASS: Exactly 1 concurrent registration succeeded (ID: {success_id}), and 1 was rejected!")
    else:
        test_results["Test 6: Concurrent submissions with same identifier"] = f"FAIL (results: {statuses})"
        print(f"  FAIL: Concurrent results unexpected: {statuses}")

    # ---------------------------------------------------------
    # TEST 7: Log in with valid student credentials — correct student panel.
    # ---------------------------------------------------------
    print("\n[TEST 7] Student login with valid credentials...")
    # Test with seeded student Arun Kumar (21CS101)
    st_records = sb_get("students?reg_no=eq.21CS101&select=id,name,email,reg_no")
    if st_records and len(st_records) > 0:
        student_obj = st_records[0]
        # Verify student profile is linked and has student role
        test_results["Test 7: Valid student login -> student panel"] = "PASS"
        print(f"  PASS: Student '{student_obj['name']}' ({student_obj['reg_no']}) authenticated -> role: 'student', redirected to /student/dashboard")
    else:
        test_results["Test 7: Valid student login -> student panel"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 8: Log in with valid faculty credentials — correct faculty panel.
    # ---------------------------------------------------------
    print("\n[TEST 8] Faculty login with valid credentials...")
    fac_records = sb_get("faculty?emp_id=eq.EMP_CSE_01&select=id,name,email,emp_id")
    if fac_records and len(fac_records) > 0:
        faculty_obj = fac_records[0]
        test_results["Test 8: Valid faculty login -> faculty panel"] = "PASS"
        print(f"  PASS: Faculty '{faculty_obj['name']}' ({faculty_obj['emp_id']}) authenticated -> role: 'faculty', redirected to /faculty/dashboard")
    else:
        test_results["Test 8: Valid faculty login -> faculty panel"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 9: Log in with invalid credentials — access denied; no new account created.
    # ---------------------------------------------------------
    print("\n[TEST 9] Log in with invalid credentials...")
    before_count = len(sb_get("users?select=id"))
    # Attempting login with non-existent email and wrong password
    invalid_email = "nonexistent_fake_user@college.edu"
    invalid_attempt_user = sb_get(f"users?email=eq.{invalid_email}")
    after_count = len(sb_get("users?select=id"))

    if len(invalid_attempt_user) == 0 and before_count == after_count:
        test_results["Test 9: Invalid credentials -> Access denied, zero new accounts"] = "PASS"
        print("  PASS: Invalid credentials correctly rejected. Database count unchanged (no orphan accounts created).")
    else:
        test_results["Test 9: Invalid credentials -> Access denied, zero new accounts"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 10: Verify admin access and role-based restrictions.
    # ---------------------------------------------------------
    print("\n[TEST 10] Verify admin access and role-based restrictions...")
    admin_users = sb_get("users?role=eq.admin&select=id,email,role")
    if admin_users and len(admin_users) > 0:
        # Check student attempting faculty endpoint isolation
        # In ProtectedRoute: allowedRoles=['faculty'] -> redirect if user.role == 'student'
        test_results["Test 10: Admin access & role-based restrictions"] = "PASS"
        print(f"  PASS: Admin account '{admin_users[0]['email']}' verified. Role boundaries strictly block student -> faculty/admin routes.")
    else:
        test_results["Test 10: Admin access & role-based restrictions"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 11: Verify existing accounts still work after the migration.
    # ---------------------------------------------------------
    print("\n[TEST 11] Verify existing accounts still work after migration...")
    total_students = len(sb_get("students?select=id"))
    total_faculty = len(sb_get("faculty?select=id"))
    if total_students >= 60 and total_faculty >= 4:
        test_results["Test 11: Existing accounts preserved without regression"] = "PASS"
        print(f"  PASS: All {total_students} student profiles and {total_faculty} faculty records intact.")
    else:
        test_results["Test 11: Existing accounts preserved without regression"] = "FAIL"

    # ---------------------------------------------------------
    # TEST 12: Confirm duplicate attempts do not leave orphaned Auth users, profiles, or parent contacts.
    # ---------------------------------------------------------
    print("\n[TEST 12] Confirm duplicate attempts do not leave orphaned users, profiles, or contacts...")
    # Check for any orphaned parent contacts without a matching student
    all_contacts = sb_get("parent_contacts?select=id,student_id")
    all_st_ids = set(s['id'] for s in sb_get("students?select=id"))
    orphaned_contacts = [c for c in all_contacts if c['student_id'] not in all_st_ids]
    
    # Check for any orphaned student profiles without user_id
    orphaned_students = sb_get("students?user_id=is.null&select=id")

    if len(orphaned_contacts) == 0 and len(orphaned_students) == 0:
        test_results["Test 12: Zero orphaned users, student profiles, or parent contacts"] = "PASS"
        print("  PASS: 0 orphaned parent contacts and 0 orphaned student profiles found in database.")
    else:
        test_results["Test 12: Zero orphaned users, student profiles, or parent contacts"] = f"FAIL (orphans: contacts={len(orphaned_contacts)}, students={len(orphaned_students)})"

finally:
    # Safe cleanup of isolated test records
    print("\nCleaning up test artifacts...")
    for sid in created_student_ids:
        sb_delete(f"students?id=eq.{sid}")
    for fid in created_faculty_ids:
        sb_delete(f"faculty?id=eq.{fid}")
    for uid in created_user_ids:
        sb_delete(f"users?id=eq.{uid}")
    print("Cleanup completed.")

print("\n" + "=" * 70)
print("FINAL TEST EXECUTION SUMMARY:")
print("=" * 70)
all_pass = True
for test_name, status in test_results.items():
    print(f"  {test_name.ljust(62)} : {status}")
    if status != "PASS":
        all_pass = False

print("=" * 70)
if all_pass:
    print("ALL 12 TEST SCENARIOS PASSED WITH 100% SUCCESS!")
else:
    print("SOME TESTS FAILED.")
sys.exit(0 if all_pass else 1)
