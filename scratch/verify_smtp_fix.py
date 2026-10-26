import sys
import os
import time

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath('backend'))

from app.email_service import (
    send_smtp_message,
    send_parent_attendance_email,
    test_smtp_connection,
    get_effective_smtp_config,
    _idempotency_cache
)

print("=" * 60)
print("RUNNING SMTP COMPREHENSIVE VERIFICATION SUITE")
print("=" * 60)

# Test 1: Configuration check
config = get_effective_smtp_config()
print(f"[Test 1: Config Check]")
print(f"  Host: {config.get('host')}:{config.get('port')}")
print(f"  From: {config.get('from_email')}")
print(f"  Use TLS: {config.get('use_tls')}")
print(f"  Is Configured: {config.get('is_configured')}")
assert config.get('is_configured') is True, "SMTP should be configured"
print("  => PASS: SMTP config loaded successfully.")

# Test 2: Invalid/Missing recipient validation & Blocked status
print("\n[Test 2: Invalid Recipient Handling]")
res_blocked = send_smtp_message(
    to_email="invalid-email-format",
    subject="Test Alert",
    html_content="<p>Test</p>",
    text_content="Test"
)
print(f"  Status: {res_blocked.get('status')}")
print(f"  Delivery Status: {res_blocked.get('delivery_status')}")
print(f"  Error: {res_blocked.get('error')}")
assert res_blocked.get("status") == "Blocked", "Should block invalid recipient"
assert res_blocked.get("error") == "MISSING_RECIPIENT_EMAIL"
print("  => PASS: Invalid email blocked immediately without initiating SMTP connection.")

# Test 3: Live SMTP delivery to test recipient with provider confirmation
print("\n[Test 3: Live Provider Delivery & Acceptance Confirmation]")
test_recipient = "examplecollegeerp@gmail.com"
t0 = time.time()
res_live = test_smtp_connection(to_email=test_recipient)
elapsed = time.time() - t0
print(f"  Execution time: {elapsed:.2f}s")
print(f"  Status: {res_live.get('status')}")
print(f"  Delivery Status: {res_live.get('delivery_status')}")
print(f"  Provider Code: {res_live.get('provider_code')}")
print(f"  Attempts: {res_live.get('attempts')}")
assert res_live.get("status") == "Sent", "Status should be 'Sent'"
assert res_live.get("provider_code") == "250 2.0.0 OK", "Provider code should be '250 2.0.0 OK'"
assert res_live.get("attempts") == 1, "Should succeed on attempt 1"
print("  => PASS: Provider confirmed acceptance with '250 2.0.0 OK'.")

# Test 4: Idempotency suppression check
print("\n[Test 4: Idempotency Deduplication Window]")
# Send parent attendance alert
res_alert1 = send_parent_attendance_email(
    parent_email=test_recipient,
    student_name="Test Student",
    reg_no="21CS999",
    department_name="Computer Science",
    attendance_pct=68.5,
    recovery_classes=4,
    parent_name="Parent of Test Student"
)
print(f"  First Alert Status: {res_alert1.get('status')}, Replay: {res_alert1.get('idempotent_replay')}")
assert res_alert1.get("status") == "Sent"
assert res_alert1.get("idempotent_replay") is False

# Send exact same alert again immediately
res_alert2 = send_parent_attendance_email(
    parent_email=test_recipient,
    student_name="Test Student",
    reg_no="21CS999",
    department_name="Computer Science",
    attendance_pct=68.5,
    recovery_classes=4,
    parent_name="Parent of Test Student"
)
print(f"  Second Alert Status: {res_alert2.get('status')}, Replay: {res_alert2.get('idempotent_replay')}")
assert res_alert2.get("idempotent_replay") is True, "Second rapid dispatch should be idempotent replay"
print("  => PASS: Idempotency cache suppressed duplicate SMTP connection.")

print("\n" + "=" * 60)
print("ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
print("=" * 60)
