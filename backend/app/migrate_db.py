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

    # 2. Check and add missing columns to existing tables using isolated transactions
    inspector = inspect(eng)

    def add_col_if_missing(table_name, col_name, col_def, existing_cols):
        if col_name in existing_cols:
            return
        try:
            with eng.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}"))
            logger.info(f"Added column {table_name}.{col_name}")
        except Exception as e:
            logger.warning(f"Could not add {table_name}.{col_name}: {e}")

    try:
        existing_assignment_cols = [c["name"] for c in inspector.get_columns("assignments")]
        assignment_cols = [
            ("department_id", "INTEGER NULL"),
            ("semester", "INTEGER DEFAULT 6"),
            ("section", "VARCHAR(10) DEFAULT 'A'"),
            ("due_time", "VARCHAR(20) DEFAULT '23:59'"),
            ("allowed_file_types", "VARCHAR(100) DEFAULT 'pdf,docx,zip,txt'"),
            ("max_file_size_mb", "INTEGER DEFAULT 10"),
            ("submission_format", "VARCHAR(30) DEFAULT 'both'"),
            ("allow_resubmission", "BOOLEAN DEFAULT TRUE"),
            ("allow_late", "BOOLEAN DEFAULT TRUE"),
            ("status", "VARCHAR(20) DEFAULT 'published'"),
            ("reminder_interval_minutes", "INTEGER DEFAULT 60")
        ]
        for col_name, col_def in assignment_cols:
            add_col_if_missing("assignments", col_name, col_def, existing_assignment_cols)
    except Exception as e:
        logger.warning(f"Assignment column inspection notice: {e}")

    try:
        existing_notif_cols = [c["name"] for c in inspector.get_columns("notifications")]
        notif_cols = [
            ("announcement_id", "INTEGER NULL"),
            ("link_url", "VARCHAR(255) NULL"),
            ("is_cleared", "BOOLEAN DEFAULT FALSE"),
            ("cleared_at", "TIMESTAMP NULL"),
            ("read_at", "TIMESTAMP NULL")
        ]
        for col_name, col_def in notif_cols:
            add_col_if_missing("notifications", col_name, col_def, existing_notif_cols)
    except Exception as e:
        logger.warning(f"Notifications column inspection notice: {e}")

    try:
        existing_student_cols = [c["name"] for c in inspector.get_columns("students")]
        add_col_if_missing("students", "cgpa", "FLOAT DEFAULT 0.0", existing_student_cols)
    except Exception as e:
        logger.warning(f"Students column inspection notice: {e}")

    try:
        existing_mark_cols = [c["name"] for c in inspector.get_columns("marks")]
        add_col_if_missing("marks", "grade_point", "FLOAT DEFAULT 0.0", existing_mark_cols)
    except Exception as e:
        logger.warning(f"Marks column inspection notice: {e}")

    try:
        existing_doc_cols = [c["name"] for c in inspector.get_columns("student_documents")]
        add_col_if_missing("student_documents", "summary_type", "VARCHAR(50) DEFAULT 'quick'", existing_doc_cols)
    except Exception as e:
        logger.warning(f"Student documents column inspection notice: {e}")

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

