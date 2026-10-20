import sys
from pathlib import Path
import uvicorn

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    print("[SERVER] Starting Cloud-Based ERP FastAPI Backend on http://127.0.0.1:8000...")
    print("[DOCS] API Documentation: http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, app_dir=str(backend_dir))

