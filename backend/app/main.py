import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.seed_data import seed_database
from app.migrate_db import apply_database_migrations
from app.assignment_scheduler import start_assignment_scheduler, stop_assignment_scheduler
from app.attendance_scheduler import start_attendance_scheduler, stop_attendance_scheduler
from app.routers import auth, students, faculty, admin, chat, quizzes, assignments, announcements, notes_ai, direct_api

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("erp_main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize and upgrade tables
    logger.info("Verifying and applying database schema migrations...")
    try:
        apply_database_migrations(engine)
        logger.info("Database schema migrations verified successfully.")
    except Exception as e:
        logger.error(f"Error applying database migrations: {e}")
        if settings.ENVIRONMENT.lower() == "production":
            raise

    # Start persistent assignment reminder background scheduler
    try:
        start_assignment_scheduler()
    except Exception as e:
        logger.error(f"Failed to start assignment reminder scheduler: {e}")

    # Start automated attendance alert scheduler (fires daily at 11 PM)
    try:
        start_attendance_scheduler()
        logger.info("Attendance auto-alert scheduler started (fires daily at 23:00).")
    except Exception as e:
        logger.error(f"Failed to start attendance alert scheduler: {e}")

    # Only seed demo data if explicitly requested via SEED_DEMO_DATA=True in development
    if settings.SEED_DEMO_DATA or (settings.ENVIRONMENT.lower() == "development" and not settings.DATABASE_URL):
        logger.info("Development mode detected: Verifying initial demo seed data...")
        db = SessionLocal()
        try:
            seed_database(db)
            from app.seed_enhancements import seed_enhancement_data
            seed_enhancement_data(db)
        except Exception as e:
            logger.warning(f"Demo seeding skipped or already present: {e}")
        finally:
            db.close()
    else:
        logger.info("Production mode / Existing database: Auto demo data seeding is skipped.")

    logger.info("Application startup complete.")
    yield
    # Shutdown
    logger.info("Application shutting down...")
    try:
        stop_assignment_scheduler()
    except Exception:
        pass
    try:
        stop_attendance_scheduler()
    except Exception:
        pass

app = FastAPI(
    title=settings.APP_NAME,
    description="Full-Stack Cloud-Based ERP for Colleges with Supabase PostgreSQL, Intelligent Attendance & Parent Alerts",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(faculty.router)
app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(quizzes.router)
app.include_router(assignments.router)
app.include_router(announcements.router)
app.include_router(notes_ai.router)
app.include_router(direct_api.router)

@app.get("/")
def root():
    db_type = "PostgreSQL (Supabase)" if "postgresql" in str(engine.url) else ("MySQL" if "mysql" in str(engine.url) else "SQLite")
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database_type": db_type,
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_type = "PostgreSQL (Supabase)" if "postgresql" in str(engine.url) else ("MySQL" if "mysql" in str(engine.url) else "SQLite")
        return {
            "status": "healthy",
            "database": "connected",
            "database_type": db_type,
            "environment": settings.ENVIRONMENT
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": f"error: {str(e)}",
            "environment": settings.ENVIRONMENT
        }
