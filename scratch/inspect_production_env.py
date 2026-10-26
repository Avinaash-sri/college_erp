import urllib.request
import urllib.error
import json
import re

print("=" * 60)
print("INDEPENDENT AUDIT: VERCEL, RENDER, SUPABASE, API ROUTING")
print("=" * 60)

# 1. Probe Vercel Frontend
vercel_url = "https://college-erp-git-main-avinaash-sris-projects.vercel.app/"
print(f"\n[1] Probing Vercel Frontend: {vercel_url}")
try:
    req = urllib.request.Request(vercel_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as res:
        print(f"  HTTP Status: {res.status}")
        html = res.read().decode("utf-8", errors="ignore")
        scripts = re.findall(r'src="([^"]+)"', html)
        print(f"  Loaded Scripts: {scripts}")
except Exception as e:
    print(f"  Vercel Frontend Error: {e}")

# 2. Probe Render Backend
render_url = "https://college-erp-backend-9fgl.onrender.com"
print(f"\n[2] Probing Render Backend Root & Health: {render_url}")
for path in ["/", "/health", "/docs", "/openapi.json"]:
    try:
        req = urllib.request.Request(render_url + path, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as res:
            data = res.read()
            print(f"  {path} -> HTTP {res.status} ({len(data)} bytes)")
            if path in ["/", "/health"]:
                print(f"     Content: {data.decode(errors='ignore')}")
    except Exception as e:
        print(f"  {path} -> Error: {e}")

# 3. Test Vercel /api rewrite proxy to Render
print(f"\n[3] Testing Vercel /api rewrite proxy:")
for api_path in ["/api/health", "/api/auth/login", "/api/smtp/test-connection"]:
    v_url = vercel_url.rstrip("/") + api_path
    try:
        req = urllib.request.Request(v_url, data=b"{}", headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as res:
            print(f"  {v_url} -> HTTP {res.status}")
    except urllib.error.HTTPError as e:
        print(f"  {v_url} -> HTTP {e.code} ({e.read().decode(errors='ignore')[:100]})")
    except Exception as e:
        print(f"  {v_url} -> Error: {e}")

# 4. Probe Direct Supabase REST API
print(f"\n[4] Probing Direct Supabase REST API:")
with open("frontend/.env", "r") as f:
    for line in f:
        if line.startswith("VITE_SUPABASE_ANON_KEY="):
            anon_key = line.strip().split("=", 1)[1]
            break
sb_url = "https://wydblgfxdxrwvxhfrjdx.supabase.co/rest/v1"
sb_headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json"
}
for table in ["students", "faculty", "users", "attendance", "marks", "assignments", "quizzes", "notifications"]:
    try:
        req = urllib.request.Request(f"{sb_url}/{table}?select=id&limit=2", headers=sb_headers)
        with urllib.request.urlopen(req, timeout=10) as res:
            records = json.loads(res.read().decode())
            print(f"  Supabase table '{table}': Accessible, HTTP {res.status}, sample records: {len(records)}")
    except urllib.error.HTTPError as e:
        print(f"  Supabase table '{table}': HTTP Error {e.code} - {e.read().decode(errors='ignore')[:100]}")
    except Exception as e:
        print(f"  Supabase table '{table}': Error {e}")
