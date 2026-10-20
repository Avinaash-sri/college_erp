"""
Explicit Database Seeder for Cloud-Based College ERP.
Usage:
    python run_seed.py

This populates initial departments, demo admin, faculty, students with realistic
attendance spreads (82% Safe, 76% Safe, 71% Warning, 68% Warning, 58% High Risk),
courses, exams, timetables, and notification records.
"""
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database

def main():
    print(f"Connecting to database: {engine.url.render_as_string(hide_password=True)}")
    print("Verifying database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        print("Explicit seed execution finished successfully.")
    except Exception as e:
        print(f"Seed encountered an error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
