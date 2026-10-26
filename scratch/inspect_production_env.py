import urllib.request
import json
import os
import re

SUPABASE_URL = "https://wydblgfxdxrwvxhfrjdx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGJsZ2Z4ZHhyd3Z4aGZyamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NzQ0MDEsImV4cCI6MjEwODA1MDQwMX0.Ufe56W6mJacoT3uwaDqLAhsSyQ8oO5QXTGG0NNeg5lw"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

print("=" * 60)
print("INSPECTING PRODUCTION SUPABASE STATE")
print("=" * 60)

# 1. Fetch system_settings
try:
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/system_settings?select=*", headers=headers)
    with urllib.request.urlopen(req) as resp:
        settings_data = json.loads(resp.read().decode())
        print(f"\n[1. Supabase system_settings Table] (Total rows: {len(settings_data)})")
        for s in settings_data:
            key = s.get("key", "")
            val = s.get("value", "")
            if any(k in key.upper() for k in ["PASS", "SECRET", "KEY", "TOKEN"]):
                val = "****"
            print(f"  {key}: {val}")
except Exception as e:
    print(f"Error fetching system_settings: {e}")

# 2. Fetch latest attendance_alerts from Supabase
try:
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/attendance_alerts?select=*&order=sent_at.desc&limit=10", headers=headers)
    with urllib.request.urlopen(req) as resp:
        alerts_data = json.loads(resp.read().decode())
        print(f"\n[2. Supabase attendance_alerts Table - Latest 10 records]")
        for a in alerts_data:
            email = a.get("parent_email", "N/A")
            # Mask recipient for privacy
            masked_email = email
            if "@" in email:
                p = email.split("@")
                masked_email = f"{p[0][:2]}***@{p[1]}"
            print(f"  ID: {a.get('id')} | Student ID: {a.get('student_id')} | Pct: {a.get('attendance_pct')}% | Recipient: {masked_email} | Status: {a.get('status')} | Sent At: {a.get('sent_at')} | Last Error: {a.get('last_error')}")
except Exception as e:
    print(f"Error fetching attendance_alerts: {e}")

# 3. Check Vercel build configuration & environment variables in repo
print("\n[3. Frontend Configuration Inspection]")
frontend_env_path = os.path.join("frontend", ".env")
if os.path.exists(frontend_env_path):
    with open(frontend_env_path, "r", encoding="utf-8") as f:
        env_lines = f.readlines()
    print("  frontend/.env contents:")
    for line in env_lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("#"):
            continue
        key, _, val = line_clean.partition("=")
        if any(k in key.upper() for k in ["KEY", "SECRET", "PASS"]):
            val = "****"
        print(f"    {key}={val}")

# 4. Check compiled bundle in frontend/dist
dist_asset_path = os.path.join("frontend", "dist", "assets")
if os.path.exists(dist_asset_path):
    for fn in os.listdir(dist_asset_path):
        if fn.endswith(".js"):
            fp = os.path.join(dist_asset_path, fn)
            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            m = re.search(r'ma="(https?://[^"]+)"', content)
            if m:
                print(f"  Compiled API URL inside {fn}: {m.group(1)}")
