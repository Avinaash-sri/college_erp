import os
import sys
import httpx

# Load Supabase URL and key from backend/.env or root .env
SUPABASE_URL = "https://wydblgfxdxrwvxhfrjdx.supabase.co"
SUPABASE_ANON_KEY = None

with open(".env", "r", encoding="utf-8") as f:
    for line in f:
        if line.startswith("VITE_SUPABASE_ANON_KEY="):
            SUPABASE_ANON_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
        elif line.startswith("VITE_SUPABASE_URL="):
            SUPABASE_URL = line.split("=", 1)[1].strip().strip('"').strip("'")

if not SUPABASE_ANON_KEY:
    with open("frontend/.env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("VITE_SUPABASE_ANON_KEY="):
                SUPABASE_ANON_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

print("Testing Email Edit Workflow against Supabase...")

# 1. Fetch an existing student (Arun Kumar, 21CS101)
res = httpx.get(f"{SUPABASE_URL}/rest/v1/students?reg_no=eq.21CS101&select=*", headers=headers)
assert res.status_code == 200, f"Failed to fetch student: {res.text}"
students = res.json()
assert len(students) > 0, "Student 21CS101 not found"
st = students[0]
original_parent_email = st.get("parent_email")
print(f"Original parent email for {st['name']}: {original_parent_email}")

# 2. Update the email to a test address
new_test_parent_email = "avinaashsri2006@gmail.com"
update_res = httpx.patch(
    f"{SUPABASE_URL}/rest/v1/students?id=eq.{st['id']}",
    headers=headers,
    json={"parent_email": new_test_parent_email}
)
assert update_res.status_code == 200, f"Failed to update parent email: {update_res.text}"
print(f"Updated parent email in Supabase: {update_res.json()[0]['parent_email']}")

# 3. Verify persistence by re-fetching
verify_res = httpx.get(f"{SUPABASE_URL}/rest/v1/students?id=eq.{st['id']}&select=*", headers=headers)
assert verify_res.status_code == 200
reloaded = verify_res.json()[0]
assert reloaded["parent_email"] == new_test_parent_email
print(f"Re-fetch verified: parent_email is {reloaded['parent_email']}")

# 4. Trigger alert to verify it reaches the updated email
sys.path.append(os.path.abspath("backend"))
from app.email_service import send_parent_attendance_email
email_res = send_parent_attendance_email(
    parent_email=reloaded["parent_email"],
    student_name=reloaded["name"],
    reg_no=reloaded["reg_no"],
    department_name="Computer Science and Engineering",
    attendance_pct=60.0,
    recovery_classes=5,
    parent_name=reloaded.get("parent_name") or "Parent"
)
print(f"Email delivery to updated address result: {email_res['status']} - {email_res['delivery_status']}")
assert email_res["status"] == "Sent"

# 5. Restore original email
restore_res = httpx.patch(
    f"{SUPABASE_URL}/rest/v1/students?id=eq.{st['id']}",
    headers=headers,
    json={"parent_email": original_parent_email}
)
assert restore_res.status_code == 200
print("Restored original parent email successfully.")
print("\n[PASS] Email editing and persistence workflow fully verified!")
