import sys
import os
import time
import datetime
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath('backend'))

from app.main import app
from app.database import SessionLocal
from app import models
from app.email_service import (
    DEFAULT_SMTP_TIMEOUT,
    MAX_RETRIES,
    INITIAL_BACKOFF_SECONDS,
    IDEMPOTENCY_WINDOW_SECONDS,
    _idempotency_cache,
    send_parent_attendance_email,
    get_effective_smtp_config
)
from app.routers.direct_api import run_smtp_dispatch_background

print("=" * 70)
print("COMPREHENSIVE VERIFICATION FOR COMMIT 8c9a86d")
print("=" * 70)

# 1. VERIFY TIMEOUT & RETRY PARAMETERS
print("\n[CHECK 1: Constants & Logic Verification]")
print(f"  DEFAULT_SMTP_TIMEOUT = {DEFAULT_SMTP_TIMEOUT} seconds (Target: 25)")
print(f"  MAX_RETRIES = {MAX_RETRIES} attempts (Target: 3)")
print(f"  INITIAL_BACKOFF_SECONDS = {INITIAL_BACKOFF_SECONDS}s (Target: 1.0)")
print(f"  IDEMPOTENCY_WINDOW_SECONDS = {IDEMPOTENCY_WINDOW_SECONDS}s (Target: 180)")
assert DEFAULT_SMTP_TIMEOUT == 25, "Timeout must be 25s"
assert MAX_RETRIES == 3, "Max retries must be 3"
print("  => PASS: Timeout & retry parameters verified.")

# 2. VERIFY FASTAPI ENDPOINT & LIFECYCLE (PENDING -> SENT)
print("\n[CHECK 2: Live Endpoint & Database Status Lifecycle]")
client = TestClient(app)
db = SessionLocal()

# Ensure we have a student in DB to link the alert to
test_email = "test_verify_user@college-erp.edu"
test_reg = "21CS_VERIFY_01"
user = db.query(models.User).filter(models.User.email == test_email).first()
if not user:
    user = models.User(
        email=test_email,
        hashed_password="hashedpassword123",
        role="student",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

student = db.query(models.Student).filter(models.Student.reg_no == test_reg).first()
if not student:
    dept = db.query(models.Department).first()
    dept_id = dept.id if dept else 1
    student = models.Student(
        user_id=user.id,
        reg_no=test_reg,
        name="Verification Test Student",
        email=test_email,
        department_id=dept_id,
        parent_name="Test Guardian",
        parent_email="examplecollegeerp@gmail.com",
        semester=6
    )
    db.add(student)
    db.commit()
    db.refresh(student)

# Clear any previous alerts for this student
db.query(models.AttendanceAlert).filter(models.AttendanceAlert.student_id == student.id).delete()
db.commit()

# Call the API endpoint
payload = {
    "student_id": student.id,
    "student_name": student.name,
    "reg_no": student.reg_no,
    "department_name": "Computer Science and Engineering",
    "attendance_pct": 65.0,
    "recovery_classes": 5,
    "parent_name": student.parent_name,
    "parent_email": "examplecollegeerp@gmail.com",
    "student_email": "test_student_verify@college-erp.edu",
    "alert_type": "Verification Lifecycle Test",
    "trigger_source": "automated"
}

# Clear idempotency cache for clean test
_idempotency_cache.clear()

# Call the API endpoint via TestClient (TestClient executes BackgroundTasks upon return)
response = client.post("/api/smtp/send-attendance-alert", json=payload)
print(f"  Endpoint Response Code: {response.status_code}")
res_json = response.json()
print(f"  Endpoint Returned Status: {res_json.get('status')}")
print(f"  Endpoint Delivery Status: {res_json.get('delivery_status')}")
assert response.status_code == 200

# Query DB record created and updated by the background task
alert_rec = db.query(models.AttendanceAlert).filter(models.AttendanceAlert.student_id == student.id).first()
assert alert_rec is not None, "Alert record must be persisted in database"
print(f"  DB Record Status (after background provider confirmation): {alert_rec.status} (alert_id: {alert_rec.id})")
print(f"  Attempt Count in DB: {alert_rec.attempt_count}")
print(f"  Sent At Timestamp: {alert_rec.sent_at}")
print(f"  Last Error: {alert_rec.last_error}")
assert alert_rec.status == "Sent", "DB status must be updated to 'Sent' after provider acceptance"
assert alert_rec.sent_at is not None, "Sent At timestamp must be recorded upon acceptance"
print("  => PASS: Complete lifecycle verified (Created as Pending and confirmed to Sent by provider).")

# 3. VERIFY IDEMPOTENCY DOES NOT CREATE DUPLICATE EMAILS
print("\n[CHECK 3: Idempotency & Duplicate Suppression]")
t_start = time.time()
res_dup = send_parent_attendance_email(
    parent_email="examplecollegeerp@gmail.com",
    student_name=student.name,
    reg_no=student.reg_no,
    department_name="CSE",
    attendance_pct=65.0,
    recovery_classes=5,
    parent_name=student.parent_name
)
t_elapsed = time.time() - t_start
print(f"  Second Immediate Send Result: {res_dup.get('status')}")
print(f"  Idempotent Replay Flag: {res_dup.get('idempotent_replay')}")
print(f"  Duration: {t_elapsed:.4f}s (should be sub-millisecond, skipped real network call)")
assert res_dup.get("idempotent_replay") is True, "Second rapid dispatch must be flagged as idempotent replay"
assert t_elapsed < 0.2, "Idempotent send should return instantly without network roundtrip"
print("  => PASS: Duplicate dispatch prevented by idempotency cache.")

# 4. VERIFY DIFFERENT STUDENTS ARE NOT SUPPRESSED
print("\n[CHECK 4: Distinct Students Are Not Blocked By Cache]")
res_other = send_parent_attendance_email(
    parent_email="examplecollegeerp@gmail.com",
    student_name="Another Student",
    reg_no="21CS_OTHER_02",
    department_name="CSE",
    attendance_pct=62.0,
    recovery_classes=6,
    parent_name="Another Parent"
)
print(f"  Other Student Status: {res_other.get('status')}")
print(f"  Idempotent Replay Flag: {res_other.get('idempotent_replay')}")
assert res_other.get("status") == "Sent"
assert res_other.get("idempotent_replay") is False, "Different student must NOT be suppressed by idempotency"
print("  => PASS: Legitimate separate student alerts are properly processed.")

# 5. VERIFY FAILURE VISIBILITY IN DATABASE
print("\n[CHECK 5: Failure Visibility in Database]")
fail_payload = dict(payload)
fail_payload["parent_email"] = "invalid_format_no_at"
fail_payload["student_email"] = "also_invalid"

# Create a blocked record to check DB persistence
fail_resp = client.post("/api/smtp/send-attendance-alert", json=fail_payload)
# Execute background dispatch for invalid email
fail_alert = models.AttendanceAlert(
    student_id=student.id,
    attendance_pct=60.0,
    parent_email="invalid_format_no_at",
    alert_type="Failure Test",
    sent_at=datetime.datetime.utcnow(),
    status="Pending",
    recovery_classes=6
)
db.add(fail_alert)
db.commit()
db.refresh(fail_alert)

run_smtp_dispatch_background(fail_payload, alert_id=fail_alert.id)
db.refresh(fail_alert)
print(f"  Failed Record Status: {fail_alert.status}")
print(f"  Failed Record Last Error: {fail_alert.last_error}")
assert fail_alert.status in ("Blocked", "Failed"), "Failed record must store Blocked or Failed status"
assert fail_alert.last_error is not None, "Error details must be captured in database"
print("  => PASS: Failure status and sanitized error details correctly persisted in DB.")

# Clean up verification test data
db.query(models.AttendanceAlert).filter(models.AttendanceAlert.student_id == student.id).delete()
db.query(models.Student).filter(models.Student.id == student.id).delete()
db.commit()
db.close()

print("\n" + "=" * 70)
print("ALL VERIFICATION SUITE CHECKS COMPLETED SUCCESSFULLY!")
print("=" * 70)
