import sys
import os
from unittest.mock import patch, MagicMock
import smtplib

sys.path.insert(0, os.path.abspath('backend'))

from app.email_service import send_smtp_message

print("Testing bounded retry with exponential backoff...")

call_count = 0

def mock_smtp(*args, **kwargs):
    global call_count
    call_count += 1
    mock_server = MagicMock()
    if call_count < 3:
        # Simulate transient network drop on attempts 1 and 2
        mock_server.login.side_effect = smtplib.SMTPServerDisconnected("Connection unexpectedly closed")
    else:
        # Succeeded on attempt 3
        mock_server.sendmail.return_value = {}
    return mock_server

with patch("smtplib.SMTP", side_effect=mock_smtp):
    res = send_smtp_message(
        to_email="test.retry@example.com",
        subject="Retry Test Verification",
        html_content="<p>Test Retry</p>",
        text_content="Test Retry",
        skip_idempotency=True
    )
    print(f"Call count: {call_count}")
    print(f"Final Status: {res.get('status')}")
    print(f"Attempts: {res.get('attempts')}")
    assert call_count == 3, f"Expected 3 calls, got {call_count}"
    assert res.get("status") == "Sent", "Expected Sent on attempt 3"
    print("=> PASS: Bounded retry recovered from temporary network drops.")
