import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional, List, Union

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
DEFAULT_SQLITE_PATH = (BACKEND_DIR / "college_erp.db").resolve()

# Find available .env files across backend and workspace root
_env_files = [
    str(BACKEND_DIR / ".env"),
    str(ROOT_DIR / ".env"),
    ".env"
]
_valid_env_files = [p for p in _env_files if os.path.exists(p)]

class Settings(BaseSettings):
    APP_NAME: str = "Cloud-Based ERP for Colleges"
    ENVIRONMENT: str = "development"  # 'development' or 'production'
    SECRET_KEY: str = "super-secret-college-erp-jwt-key-2026-production-grade"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database (Supabase PostgreSQL / MySQL / SQLite fallback in dev)
    DATABASE_URL: Optional[str] = None
    FALLBACK_SQLITE_URL: str = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"

    # Attendance thresholds
    SAFE_THRESHOLD: float = 75.0
    WARNING_THRESHOLD: float = 65.0

    # SMTP Configuration (environment-based, no hardcoded credentials)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@college-erp.edu"
    SMTP_FROM_NAME: str = "College ERP Administration"
    SMTP_USE_TLS: bool = True

    # Resend HTTPS API Gateway (works seamlessly on cloud platforms like Render where port 587 is blocked)
    RESEND_API_KEY: Optional[str] = None
    RESEND_FROM_EMAIL: str = "College Academic Office <onboarding@resend.dev>"

    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Gemini AI Integration for Student AI ERP Assistant
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"

    # Demo Data Seeding control
    SEED_DEMO_DATA: bool = False

    class Config:
        env_file = _valid_env_files or ".env"
        extra = "allow"

settings = Settings()

# If FALLBACK_SQLITE_URL in .env was a relative path (like sqlite:///./college_erp.db),
# resolve it to the canonical backend directory database file:
if settings.FALLBACK_SQLITE_URL.startswith("sqlite:///./"):
    db_filename = settings.FALLBACK_SQLITE_URL.replace("sqlite:///./", "")
    settings.FALLBACK_SQLITE_URL = f"sqlite:///{(BACKEND_DIR / db_filename).resolve().as_posix()}"
elif settings.FALLBACK_SQLITE_URL == "sqlite:///college_erp.db":
    settings.FALLBACK_SQLITE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"

