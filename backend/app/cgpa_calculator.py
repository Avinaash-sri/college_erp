import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger("erp_cgpa")

# Standard 10-point academic grading scale (UGC / Anna University)
GRADE_POINT_MAP: Dict[str, float] = {
    "O": 10.0,
    "A+": 9.0,
    "A": 8.0,
    "B+": 7.0,
    "B": 6.0,
    "C": 5.0,
    "F": 0.0,
    "U": 0.0,
    "AB": 0.0,
}

def get_grade_point_from_grade(grade: str, total_marks: float = 0.0) -> float:
    """
    Returns the grade point on a 10.0 scale based on letter grade,
    with a fallback based on total numerical marks.
    """
    if grade:
        cleaned = grade.strip().upper()
        if cleaned in GRADE_POINT_MAP:
            return GRADE_POINT_MAP[cleaned]

    # Fallback to total score percentage if grade not mapped
    if total_marks >= 90.0:
        return 10.0
    elif total_marks >= 80.0:
        return 9.0
    elif total_marks >= 70.0:
        return 8.0
    elif total_marks >= 60.0:
        return 7.0
    elif total_marks >= 50.0:
        return 6.0
    elif total_marks >= 40.0:
        return 5.0
    return 0.0

def calculate_student_cgpa(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Calculates CGPA using the exact academic formula:
    CGPA = sum(grade_points * credits) / sum(credits)
    and stores the resulting CGPA directly in the student database record.
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return {
            "student_id": student_id,
            "cgpa": 0.0,
            "total_credits": 0.0,
            "total_weighted_points": 0.0,
            "formula": "sum(grade_points * credits) / sum(credits)",
            "breakdown": []
        }

    marks = db.query(models.Mark).filter(models.Mark.student_id == student_id).all()
    if not marks:
        student.cgpa = 0.0
        db.commit()
        return {
            "student_id": student.id,
            "reg_no": student.reg_no,
            "name": student.name,
            "cgpa": 0.0,
            "total_credits": 0.0,
            "total_weighted_points": 0.0,
            "formula": "sum(grade_points * credits) / sum(credits)",
            "breakdown": []
        }

    total_weighted_points = 0.0
    total_credits = 0.0
    breakdown = []

    for m in marks:
        sub = db.query(models.Subject).filter(models.Subject.id == m.subject_id).first()
        credits = float(sub.credits) if (sub and sub.credits) else 3.0

        # Determine grade point
        gp = m.grade_point if (m.grade_point is not None and m.grade_point > 0.0) else get_grade_point_from_grade(m.grade, m.total)

        # Update mark record in db if not set
        if m.grade_point != gp:
            m.grade_point = gp

        weighted = round(gp * credits, 2)
        total_weighted_points += weighted
        total_credits += credits

        breakdown.append({
            "subject_id": m.subject_id,
            "subject_code": sub.code if sub else f"SUB{m.subject_id}",
            "subject_name": sub.name if sub else f"Subject {m.subject_id}",
            "credits": credits,
            "grade": m.grade,
            "grade_point": gp,
            "weighted_points": weighted,
            "marks_obtained": m.total
        })

    cgpa = round(total_weighted_points / total_credits, 2) if total_credits > 0 else 0.0
    
    # Store calculated CGPA into the database
    student.cgpa = cgpa
    db.commit()
    db.refresh(student)

    logger.info(f"Student {student.reg_no} ({student.name}) CGPA calculated and stored in DB: {cgpa} (Credits: {total_credits}, Weighted: {total_weighted_points})")

    return {
        "student_id": student.id,
        "reg_no": student.reg_no,
        "name": student.name,
        "cgpa": cgpa,
        "total_credits": total_credits,
        "total_weighted_points": round(total_weighted_points, 2),
        "formula": "sum(grade_points * credits) / sum(credits)",
        "breakdown": breakdown
    }

def calculate_all_students_cgpa(db: Session) -> List[Dict[str, Any]]:
    """
    Batch recalculates and stores CGPA for all students in the database.
    """
    students = db.query(models.Student).all()
    results = []
    for s in students:
        res = calculate_student_cgpa(s.id, db)
        results.append(res)
    return results
