import logging
from sqlalchemy import text, inspect
from app.database import engine, Base
from app import models

logger = logging.getLogger("erp_migrate")

def apply_database_migrations(engine_instance=None):
    """
    Idempotently creates all tables and safely adds any missing columns
    to existing tables in SQLite or PostgreSQL.
    """
    eng = engine_instance or engine
    logger.info("Applying database migrations and verifying schema...")

    # 1. Create all missing tables first
    Base.metadata.create_all(bind=eng)

    # 2. Check and add missing columns to existing tables
    inspector = inspect(eng)
    with eng.connect() as conn:
        # Check assignments columns
        existing_assignment_cols = [c["name"] for c in inspector.get_columns("assignments")]
        assignment_cols = [
            ("department_id", "INTEGER NULL"),
            ("semester", "INTEGER DEFAULT 6"),
            ("section", "VARCHAR(10) DEFAULT 'A'"),
            ("due_time", "VARCHAR(20) DEFAULT '23:59'"),
            ("allowed_file_types", "VARCHAR(100) DEFAULT 'pdf,docx,zip,txt'"),
            ("max_file_size_mb", "INTEGER DEFAULT 10"),
            ("submission_format", "VARCHAR(30) DEFAULT 'both'"),
            ("allow_resubmission", "BOOLEAN DEFAULT 1"),
            ("allow_late", "BOOLEAN DEFAULT 1"),
            ("status", "VARCHAR(20) DEFAULT 'published'"),
            ("reminder_interval_minutes", "INTEGER DEFAULT 60")
        ]
        for col_name, col_def in assignment_cols:
            if col_name not in existing_assignment_cols:
                try:
                    conn.execute(text(f"ALTER TABLE assignments ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                    logger.info(f"Added column assignments.{col_name}")
                except Exception as e:
                    logger.warning(f"Could not add assignments.{col_name}: {e}")

        # Check notifications columns
        existing_notif_cols = [c["name"] for c in inspector.get_columns("notifications")]
        notif_cols = [
            ("announcement_id", "INTEGER NULL"),
            ("link_url", "VARCHAR(255) NULL"),
            ("is_cleared", "BOOLEAN DEFAULT 0"),
            ("cleared_at", "DATETIME NULL"),
            ("read_at", "DATETIME NULL")
        ]
        for col_name, col_def in notif_cols:
            if col_name not in existing_notif_cols:
                try:
                    conn.execute(text(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                    logger.info(f"Added column notifications.{col_name}")
                except Exception as e:
                    logger.warning(f"Could not add notifications.{col_name}: {e}")

        # Check students columns (cgpa)
        existing_student_cols = [c["name"] for c in inspector.get_columns("students")]
        if "cgpa" not in existing_student_cols:
            try:
                conn.execute(text("ALTER TABLE students ADD COLUMN cgpa FLOAT DEFAULT 0.0"))
                conn.commit()
                logger.info("Added column students.cgpa")
            except Exception as e:
                logger.warning(f"Could not add students.cgpa: {e}")

        # Check marks columns (grade_point)
        existing_mark_cols = [c["name"] for c in inspector.get_columns("marks")]
        if "grade_point" not in existing_mark_cols:
            try:
                conn.execute(text("ALTER TABLE marks ADD COLUMN grade_point FLOAT DEFAULT 0.0"))
                conn.commit()
                logger.info("Added column marks.grade_point")
            except Exception as e:
                logger.warning(f"Could not add marks.grade_point: {e}")

    # 3. Calculate and store initial CGPA for all students in DB
    try:
        from app.database import SessionLocal
        from app.cgpa_calculator import calculate_all_students_cgpa
        session = SessionLocal()
        try:
            calculate_all_students_cgpa(session)
            logger.info("Academic CGPA calculation completed for all students in database.")
        finally:
            session.close()
    except Exception as e:
        logger.warning(f"Initial CGPA calculation skipped: {e}")

    logger.info("Database migrations applied successfully.")

if __name__ == "__main__":
    apply_database_migrations()

