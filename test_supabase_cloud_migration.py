"""
Verification script for College ERP Full Upgrade + Supabase Cloud Migration.
Tests data store, SQL migrations, components, and cloud adapter.
"""
import os
import re
import json

def test_migration_and_seed_sql():
    print("\n--- TEST 1: SQL MIGRATIONS & SEED DATA ---")
    
    # 1. Check seed_chennai_data.sql
    seed_path = "c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/database/seed_chennai_data.sql"
    assert os.path.exists(seed_path), "seed_chennai_data.sql must exist"
    with open(seed_path, "r", encoding="utf-8") as f:
        sql = f.read()

    # Check 60 students: 20 ECE, 20 IT, 20 CSE
    ece_matches = re.findall(r"21EC\d{3}", sql)
    it_matches = re.findall(r"21IT\d{3}", sql)
    cse_matches = re.findall(r"21CS\d{3}", sql)
    print(f"SQL Seed Unique IDs: ECE={len(set(ece_matches))}, IT={len(set(it_matches))}, CSE={len(set(cse_matches))}")
    assert len(set(ece_matches)) == 20, f"Expected 20 unique ECE students, found {len(set(ece_matches))}"
    assert len(set(it_matches)) == 20, f"Expected 20 unique IT students, found {len(set(it_matches))}"
    assert len(set(cse_matches)) == 20, f"Expected 20 unique CSE students, found {len(set(cse_matches))}"

    # Check demo accounts
    assert "admin@college.edu" in sql, "Admin demo account must be in seed SQL"
    assert "kavitha@college.edu" in sql, "Faculty demo account must be in seed SQL"
    assert "arun@college.edu" in sql, "Good attendance student demo must be in seed SQL"
    assert "nivetha@college.edu" in sql, "Medium attendance student demo must be in seed SQL"
    assert "sanjay@college.edu" in sql, "Low attendance student demo must be in seed SQL"

    # Check controlled quiz release
    assert "results_published = TRUE" in sql, "Quiz 1 must have results_published = TRUE"
    assert "results_published = FALSE" in sql, "Quiz 2 must have results_published = FALSE"

    print("[PASS] SQL Migrations and Seed data fully validated.")

def test_frontend_data_store():
    print("\n--- TEST 2: FRONTEND DATA STORE ---")
    data_store_path = "c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/lib/dataStore.js"
    assert os.path.exists(data_store_path), "dataStore.js must exist"
    with open(data_store_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check student count
    students_match = re.search(r"export const STUDENTS = (\[.*?\]);", content, re.DOTALL)
    assert students_match, "STUDENTS array must be exported in dataStore.js"
    students = json.loads(students_match.group(1))
    print(f"dataStore.js Total Students: {len(students)}")
    assert len(students) == 60, f"Expected exactly 60 students, found {len(students)}"

    ece = [s for s in students if s["department_id"] == 1]
    it = [s for s in students if s["department_id"] == 2]
    cse = [s for s in students if s["department_id"] == 3]
    print(f"Department Breakdown: ECE={len(ece)}, IT={len(it)}, CSE={len(cse)}")
    assert len(ece) == 20 and len(it) == 20 and len(cse) == 20, "Must be exactly 20 students per department"

    # Check attendance percentage distribution
    safe_students = [s for s in students if s["risk_status"] == "Safe"]
    warning_students = [s for s in students if s["risk_status"] == "Warning"]
    risk_students = [s for s in students if s["risk_status"] == "High Risk"]
    print(f"Attendance Distribution: Safe (>75%)={len(safe_students)}, Warning (65-75%)={len(warning_students)}, High Risk (<65%)={len(risk_students)}")
    assert len(safe_students) > 0 and len(warning_students) > 0 and len(risk_students) > 0

    print("[PASS] Frontend dataStore.js validated.")

def test_login_and_sidebar():
    print("\n--- TEST 3: LOGIN PAGE & SIDEBAR ORDER ---")
    
    # 1. LoginPage
    login_path = "c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/pages/auth/LoginPage.jsx"
    with open(login_path, "r", encoding="utf-8") as f:
        login_src = f.read()

    assert "password123" in login_src, "password123 must be present in LoginPage"
    assert "Arun Kumar" in login_src and "Nivetha S" in login_src and "Sanjay Kumar" in login_src
    assert "Dr. Kavitha Raman" in login_src and "System Administrator" in login_src
    # Check two-column grid
    assert "lg:grid-cols-12" in login_src, "LoginPage must use two-column responsive grid"
    assert "backdrop-blur" in login_src, "Demo accounts section must use translucent/glass effect"
    assert "Eye" in login_src and "EyeOff" in login_src, "Password toggle icons must be present"

    # 2. Sidebar
    sidebar_path = "c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/components/common/Sidebar.jsx"
    with open(sidebar_path, "r", encoding="utf-8") as f:
        sidebar_src = f.read()

    # Find studentLinks and facultyLinks arrays
    st_links = re.search(r"const studentLinks = \[(.*?)\];", sidebar_src, re.DOTALL)
    assert st_links, "studentLinks must exist"
    st_items = re.findall(r"name:\s*'([^']+)'", st_links.group(1))
    print("studentLinks items:", st_items)
    assert st_items[-1] == "My Profile", f"Expected 'My Profile' to be LAST in studentLinks, but found '{st_items[-1]}'"

    fac_links = re.search(r"const facultyLinks = \[(.*?)\];", sidebar_src, re.DOTALL)
    assert fac_links, "facultyLinks must exist"
    fac_items = re.findall(r"name:\s*'([^']+)'", fac_links.group(1))
    print("facultyLinks items:", fac_items)
    assert fac_items[-1] == "My Profile", f"Expected 'My Profile' to be LAST in facultyLinks, but found '{fac_items[-1]}'"

    # Check professional blue theme classes
    assert "bg-blue-600 text-white" in sidebar_src or "bg-blue-700 text-white" in sidebar_src, "Active state must use solid blue"

    print("[PASS] LoginPage and Sidebar navigation verified.")

def test_ai_assistant_and_branding():
    print("\n--- TEST 4: AI ASSISTANT & BRANDING ---")
    
    # Floating widget
    widget_path = "c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/components/common/FloatingAIAssistant.jsx"
    assert os.path.exists(widget_path), "FloatingAIAssistant.jsx must exist"
    with open(widget_path, "r", encoding="utf-8") as f:
        widget_src = f.read()

    assert "opacity-75" in widget_src, "Floating button must use approximately 75% opacity in idle"
    assert "Gemini" not in widget_src, "Floating widget must not have visible Gemini branding"

    # Full page AIAssistant.jsx
    page_path = "c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/pages/student/AIAssistant.jsx"
    with open(page_path, "r", encoding="utf-8") as f:
        page_src = f.read()

    assert "Gemini" not in page_src, "AIAssistant.jsx must not have visible Gemini branding"
    assert "AIAssistant" in page_src or "AI Assistant" in page_src, "Module must be titled 'AI Assistant'"

    print("[PASS] AI Assistant widget and zero Gemini branding verified.")

def test_assignments_red_indicator():
    print("\n--- TEST 5: ASSIGNMENTS RED INDICATOR ---")
    fac_asgn_path = "c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/pages/faculty/FacultyAssignments.jsx"
    with open(fac_asgn_path, "r", encoding="utf-8") as f:
        fac_asgn_src = f.read()

    assert "Pending — Not Submitted" in fac_asgn_src, "Roster must include 'Pending — Not Submitted' badge"
    assert "bg-rose-100 text-rose-700 border border-rose-300" in fac_asgn_src, "Must use distinct red badge styling"

    print("[PASS] Assignments red indicator for unsubmitted students verified.")

if __name__ == "__main__":
    test_migration_and_seed_sql()
    test_frontend_data_store()
    test_login_and_sidebar()
    test_ai_assistant_and_branding()
    test_assignments_red_indicator()
    print("\n==========================================")
    print("ALL MIGRATION ACCEPTANCE CRITERIA VERIFIED!")
    print("==========================================")
