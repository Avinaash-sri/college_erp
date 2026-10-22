import json
import datetime
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_role

logger = logging.getLogger("erp_quizzes")

router = APIRouter(tags=["Quiz Management"])

def get_logged_in_faculty(current_user: models.User = Depends(get_current_user)) -> models.Faculty:
    if current_user.role != "faculty" or not current_user.faculty_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty privileges required"
        )
    return current_user.faculty_profile

def get_logged_in_student(current_user: models.User = Depends(get_current_user)) -> models.Student:
    if current_user.role != "student" or not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student privileges required"
        )
    return current_user.student_profile


# ==============================================================================
# FACULTY ENDPOINTS
# ==============================================================================

@router.get("/faculty/students-by-filter")
def get_students_by_filter(
    department_id: int = Query(...),
    semester: int = Query(6),
    section: Optional[str] = Query(None),
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Fetches real eligible students from the Supabase database matching department, semester and section.
    Used by faculty to inspect roster and toggle exclusions before publishing.
    """
    query = db.query(models.Student).filter(
        models.Student.department_id == department_id,
        models.Student.semester == semester
    )
    if section and section.strip() and section.strip() != "All":
        query = query.filter(models.Student.section == section.strip())

    students = query.order_by(models.Student.reg_no.asc()).all()
    return [
        {
            "id": s.id,
            "reg_no": s.reg_no,
            "name": s.name,
            "email": s.email,
            "section": s.section,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else ""
        }
        for s in students
    ]


@router.get("/faculty/quizzes", response_model=List[schemas.QuizResponse])
def get_faculty_quizzes(
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Lists quizzes created by the authenticated faculty member or associated with their department.
    """
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.faculty_id == faculty.id
    ).order_by(models.Quiz.created_at.desc()).all()

    result = []
    for q in quizzes:
        eligible_count = db.query(models.QuizAssignment).filter(
            models.QuizAssignment.quiz_id == q.id,
            models.QuizAssignment.is_excluded == False
        ).count()

        submitted_count = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == q.id,
            models.QuizAttempt.status == "submitted"
        ).count()

        result.append(schemas.QuizResponse(
            id=q.id,
            title=q.title,
            description=q.description,
            subject_id=q.subject_id,
            subject_name=q.subject.name if q.subject else "",
            subject_code=q.subject.code if q.subject else "",
            faculty_id=q.faculty_id,
            faculty_name=faculty.name,
            department_id=q.department_id,
            department_name=q.department.name if q.department else "",
            semester=q.semester,
            section=q.section,
            duration_minutes=q.duration_minutes,
            total_marks=q.total_marks,
            deadline=q.deadline,
            start_time=q.start_time,
            status=q.status,
            results_published=q.results_published,
            allow_multiple_attempts=q.allow_multiple_attempts,
            max_attempts=q.max_attempts,
            created_at=q.created_at,
            question_count=len(q.questions),
            eligible_count=eligible_count,
            submitted_count=submitted_count
        ))

    return result


@router.post("/faculty/quizzes", response_model=schemas.QuizResponse)
def create_quiz(
    payload: schemas.QuizCreate,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Creates a new department-wise quiz with questions and populates the eligible student roster.
    Faculty can exclude specific students by ID.
    """
    # 1. Calculate total marks
    total_marks = sum(q.marks for q in payload.questions) if payload.questions else 0.0

    quiz = models.Quiz(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        subject_id=payload.subject_id,
        faculty_id=faculty.id,
        department_id=payload.department_id,
        academic_year=payload.academic_year,
        semester=payload.semester,
        section=payload.section,
        duration_minutes=payload.duration_minutes,
        total_marks=total_marks,
        start_time=payload.start_time or datetime.datetime.utcnow(),
        deadline=payload.deadline,
        status=payload.status,
        results_published=False,
        allow_multiple_attempts=payload.allow_multiple_attempts,
        max_attempts=payload.max_attempts,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(quiz)
    db.flush()

    # 2. Add questions
    for idx, q_data in enumerate(payload.questions, start=1):
        options_json = json.dumps(q_data.options) if q_data.options else None
        q = models.QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.question_text.strip(),
            question_type=q_data.question_type,
            marks=q_data.marks,
            order=q_data.order or idx,
            options=options_json,
            correct_answer=q_data.correct_answer.strip(),
            explanation=q_data.explanation.strip() if q_data.explanation else None
        )
        db.add(q)

    # 3. Determine eligible students and create assignments
    std_query = db.query(models.Student).filter(
        models.Student.department_id == payload.department_id,
        models.Student.semester == payload.semester
    )
    if payload.section and payload.section != "All":
        std_query = std_query.filter(models.Student.section == payload.section)

    eligible_students = std_query.all()
    excluded_set = set(payload.excluded_student_ids or [])

    for s in eligible_students:
        is_ex = s.id in excluded_set
        asgn = models.QuizAssignment(
            quiz_id=quiz.id,
            student_id=s.id,
            is_excluded=is_ex,
            created_at=datetime.datetime.utcnow()
        )
        db.add(asgn)

    db.commit()
    db.refresh(quiz)

    # If published, create notifications for included students
    if quiz.status == "published":
        for s in eligible_students:
            if s.id not in excluded_set:
                notif = models.Notification(
                    user_id=s.user_id,
                    title=f"New Quiz: {quiz.title}",
                    message=f"A new quiz has been published for {quiz.subject.name if quiz.subject else 'your course'}. Deadline: {quiz.deadline.strftime('%d %b %Y %H:%M')}.",
                    type="Quiz Announcement",
                    link_url="/student/quizzes",
                    is_read=False,
                    created_at=datetime.datetime.utcnow()
                )
                db.add(notif)
        db.commit()

    eligible_count = len([s for s in eligible_students if s.id not in excluded_set])

    return schemas.QuizResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        subject_id=quiz.subject_id,
        subject_name=quiz.subject.name if quiz.subject else "",
        subject_code=quiz.subject.code if quiz.subject else "",
        faculty_id=quiz.faculty_id,
        faculty_name=faculty.name,
        department_id=quiz.department_id,
        department_name=quiz.department.name if quiz.department else "",
        semester=quiz.semester,
        section=quiz.section,
        duration_minutes=quiz.duration_minutes,
        total_marks=quiz.total_marks,
        deadline=quiz.deadline,
        start_time=quiz.start_time,
        status=quiz.status,
        results_published=quiz.results_published,
        allow_multiple_attempts=quiz.allow_multiple_attempts,
        max_attempts=quiz.max_attempts,
        created_at=quiz.created_at,
        question_count=len(quiz.questions),
        eligible_count=eligible_count,
        submitted_count=0
    )


@router.get("/faculty/quizzes/{quiz_id}")
def get_faculty_quiz_detail(
    quiz_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Returns complete details of a quiz including questions with correct answers
    and full roster of students with their inclusion status.
    """
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.faculty_id == faculty.id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or unauthorized")

    questions = []
    for q in quiz.questions:
        options = json.loads(q.options) if q.options else []
        questions.append({
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "marks": q.marks,
            "order": q.order,
            "options": options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation
        })

    assignments = db.query(models.QuizAssignment).filter(
        models.QuizAssignment.quiz_id == quiz.id
    ).all()

    roster = []
    for a in assignments:
        s = a.student
        attempt = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == quiz.id,
            models.QuizAttempt.student_id == s.id
        ).order_by(models.QuizAttempt.attempt_number.desc()).first()

        roster.append({
            "student_id": s.id,
            "name": s.name,
            "reg_no": s.reg_no,
            "email": s.email,
            "section": s.section,
            "is_excluded": a.is_excluded,
            "attempt_status": attempt.status if attempt else ("Excluded" if a.is_excluded else "Not Attempted"),
            "score": attempt.score if attempt else None,
            "submitted_at": attempt.submitted_at.isoformat() if attempt and attempt.submitted_at else None
        })

    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "subject_id": quiz.subject_id,
        "subject_name": quiz.subject.name if quiz.subject else "",
        "subject_code": quiz.subject.code if quiz.subject else "",
        "department_id": quiz.department_id,
        "department_name": quiz.department.name if quiz.department else "",
        "semester": quiz.semester,
        "section": quiz.section,
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks,
        "deadline": quiz.deadline.isoformat(),
        "start_time": quiz.start_time.isoformat() if quiz.start_time else None,
        "status": quiz.status,
        "results_published": quiz.results_published,
        "allow_multiple_attempts": quiz.allow_multiple_attempts,
        "max_attempts": quiz.max_attempts,
        "questions": sorted(questions, key=lambda x: x["order"]),
        "roster": sorted(roster, key=lambda x: x["reg_no"])
    }


@router.put("/faculty/quizzes/{quiz_id}")
def update_quiz(
    quiz_id: int,
    payload: schemas.QuizUpdate,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Updates quiz parameters, questions, status or exclusions.
    """
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.faculty_id == faculty.id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or unauthorized")

    if payload.title is not None:
        quiz.title = payload.title.strip()
    if payload.description is not None:
        quiz.description = payload.description.strip()
    if payload.subject_id is not None:
        quiz.subject_id = payload.subject_id
    if payload.duration_minutes is not None:
        quiz.duration_minutes = payload.duration_minutes
    if payload.deadline is not None:
        quiz.deadline = payload.deadline
    if payload.start_time is not None:
        quiz.start_time = payload.start_time
    if payload.status is not None:
        quiz.status = payload.status
    if payload.results_published is not None:
        quiz.results_published = payload.results_published
    if payload.allow_multiple_attempts is not None:
        quiz.allow_multiple_attempts = payload.allow_multiple_attempts
    if payload.max_attempts is not None:
        quiz.max_attempts = payload.max_attempts

    # Update questions if provided
    if payload.questions is not None:
        # Clear old questions
        db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz.id).delete()
        total_marks = 0.0
        for idx, q_data in enumerate(payload.questions, start=1):
            options_json = json.dumps(q_data.options) if q_data.options else None
            q = models.QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data.question_text.strip(),
                question_type=q_data.question_type,
                marks=q_data.marks,
                order=q_data.order or idx,
                options=options_json,
                correct_answer=q_data.correct_answer.strip(),
                explanation=q_data.explanation.strip() if q_data.explanation else None
            )
            db.add(q)
            total_marks += q_data.marks
        quiz.total_marks = total_marks

    # Update exclusions if provided
    if payload.excluded_student_ids is not None:
        excluded_set = set(payload.excluded_student_ids)
        assignments = db.query(models.QuizAssignment).filter(
            models.QuizAssignment.quiz_id == quiz.id
        ).all()
        for a in assignments:
            a.is_excluded = a.student_id in excluded_set

    quiz.updated_at = datetime.datetime.utcnow()
    db.commit()

    return {"status": "success", "message": "Quiz updated successfully"}


@router.delete("/faculty/quizzes/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Deletes a quiz and all associated questions, attempts and answers.
    """
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.faculty_id == faculty.id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or unauthorized")

    db.delete(quiz)
    db.commit()
    return {"status": "success", "message": "Quiz deleted successfully"}


@router.post("/faculty/quizzes/{quiz_id}/publish-results")
def toggle_publish_results(
    quiz_id: int,
    publish: bool = Query(True),
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Publishes or unpublishes quiz results, granting students access to scores and explanations.
    """
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.faculty_id == faculty.id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or unauthorized")

    quiz.results_published = publish
    quiz.updated_at = datetime.datetime.utcnow()
    db.commit()

    if publish:
        # Notify students who attempted the quiz
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == quiz.id,
            models.QuizAttempt.status == "submitted"
        ).all()
        for att in attempts:
            notif = models.Notification(
                user_id=att.student.user_id,
                title=f"Quiz Results Released: {quiz.title}",
                message=f"Your scores and answer key for {quiz.title} are now released! Score: {att.score}/{quiz.total_marks}.",
                type="Quiz Results",
                link_url=f"/student/quizzes",
                is_read=False,
                created_at=datetime.datetime.utcnow()
            )
            db.add(notif)
        db.commit()

    action = "published" if publish else "hidden"
    return {"status": "success", "message": f"Quiz results successfully {action}."}


@router.get("/faculty/quizzes/{quiz_id}/submissions")
def get_quiz_submissions_roster(
    quiz_id: int,
    faculty: models.Faculty = Depends(get_logged_in_faculty),
    db: Session = Depends(get_db)
):
    """
    Returns complete student roster with scores, submitted time, attempt status,
    and individual question answers.
    """
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.faculty_id == faculty.id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or unauthorized")

    assignments = db.query(models.QuizAssignment).filter(
        models.QuizAssignment.quiz_id == quiz.id
    ).all()

    roster = []
    for a in assignments:
        s = a.student
        attempt = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == quiz.id,
            models.QuizAttempt.student_id == s.id
        ).order_by(models.QuizAttempt.attempt_number.desc()).first()

        answers_list = []
        if attempt:
            ans_records = db.query(models.QuizAnswer).filter(
                models.QuizAnswer.attempt_id == attempt.id
            ).all()
            for ans in ans_records:
                answers_list.append({
                    "question_id": ans.question_id,
                    "question_text": ans.question.question_text if ans.question else "",
                    "selected_answer": ans.selected_answer,
                    "correct_answer": ans.question.correct_answer if ans.question else "",
                    "is_correct": ans.is_correct,
                    "marks_awarded": ans.marks_awarded
                })

        status_val = "Excluded" if a.is_excluded else ("Not Attempted" if not attempt else attempt.status)
        roster.append({
            "student_id": s.id,
            "reg_no": s.reg_no,
            "name": s.name,
            "email": s.email,
            "section": s.section,
            "is_excluded": a.is_excluded,
            "status": status_val,
            "score": attempt.score if attempt else 0.0,
            "total_marks": quiz.total_marks,
            "started_at": attempt.started_at.isoformat() if attempt and attempt.started_at else None,
            "submitted_at": attempt.submitted_at.isoformat() if attempt and attempt.submitted_at else None,
            "answers": answers_list
        })

    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "total_marks": quiz.total_marks,
        "results_published": quiz.results_published,
        "roster": roster
    }


# ==============================================================================
# STUDENT ENDPOINTS
# ==============================================================================

@router.get("/students/me/quizzes")
def get_student_assigned_quizzes(
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Returns only quizzes assigned to the authenticated student where they are not excluded.
    Prevents unauthorized students from accessing excluded quizzes.
    """
    assignments = db.query(models.QuizAssignment).filter(
        models.QuizAssignment.student_id == student.id,
        models.QuizAssignment.is_excluded == False
    ).all()

    quiz_ids = [a.quiz_id for a in assignments]
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.id.in_(quiz_ids),
        models.Quiz.status == "published"
    ).order_by(models.Quiz.deadline.asc()).all()

    result = []
    now = datetime.datetime.utcnow()

    for q in quizzes:
        attempt = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == q.id,
            models.QuizAttempt.student_id == student.id
        ).order_by(models.QuizAttempt.attempt_number.desc()).first()

        is_expired = now > q.deadline
        attempt_status = "Not Started"
        score = None

        if attempt:
            if attempt.status == "submitted":
                attempt_status = "Submitted"
                score = attempt.score if q.results_published else None
            elif attempt.status == "in_progress":
                attempt_status = "In Progress"

        result.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "subject_id": q.subject_id,
            "subject_name": q.subject.name if q.subject else "",
            "subject_code": q.subject.code if q.subject else "",
            "faculty_name": q.faculty.name if q.faculty else "Faculty",
            "duration_minutes": q.duration_minutes,
            "total_marks": q.total_marks,
            "deadline": q.deadline.isoformat(),
            "start_time": q.start_time.isoformat() if q.start_time else None,
            "is_expired": is_expired,
            "attempt_status": attempt_status,
            "score": score,
            "results_published": q.results_published,
            "can_attempt": (attempt is None or (q.allow_multiple_attempts and attempt.attempt_number < q.max_attempts)) and not is_expired,
            "question_count": len(q.questions)
        })

    return result


@router.get("/students/me/quizzes/{quiz_id}")
def get_quiz_for_taking(
    quiz_id: int,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Fetches the quiz questions for student taking.
    CRITICAL SECURITY: Never sends correct answers or explanations to the client!
    """
    # 1. Eligibility Check
    assignment = db.query(models.QuizAssignment).filter(
        models.QuizAssignment.quiz_id == quiz_id,
        models.QuizAssignment.student_id == student.id,
        models.QuizAssignment.is_excluded == False
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this quiz or have been excluded."
        )

    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.status == "published"
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz is not available or unpublished.")

    # 2. Check previous attempts
    attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.quiz_id == quiz.id,
        models.QuizAttempt.student_id == student.id
    ).order_by(models.QuizAttempt.attempt_number.desc()).first()

    if attempt and attempt.status == "submitted" and not quiz.allow_multiple_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted this quiz and multiple attempts are not permitted."
        )

    questions = []
    for q in quiz.questions:
        options = json.loads(q.options) if q.options else []
        questions.append({
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "marks": q.marks,
            "order": q.order,
            "options": options
            # Notice: correct_answer and explanation omitted for security!
        })

    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "subject_name": quiz.subject.name if quiz.subject else "",
        "subject_code": quiz.subject.code if quiz.subject else "",
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks,
        "deadline": quiz.deadline.isoformat(),
        "questions": sorted(questions, key=lambda x: x["order"])
    }


@router.post("/students/me/quizzes/{quiz_id}/start")
def start_quiz_attempt(
    quiz_id: int,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Records the start of a quiz attempt with UTC timestamp.
    """
    assignment = db.query(models.QuizAssignment).filter(
        models.QuizAssignment.quiz_id == quiz_id,
        models.QuizAssignment.student_id == student.id,
        models.QuizAssignment.is_excluded == False
    ).first()

    if not assignment:
        raise HTTPException(status_code=403, detail="Unauthorized access to quiz.")

    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.status == "published"
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    now = datetime.datetime.utcnow()
    if now > quiz.deadline:
        raise HTTPException(status_code=400, detail="Quiz deadline has passed.")

    existing_attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.quiz_id == quiz_id,
        models.QuizAttempt.student_id == student.id
    ).order_by(models.QuizAttempt.attempt_number.desc()).first()

    if existing_attempt and existing_attempt.status == "submitted" and not quiz.allow_multiple_attempts:
        raise HTTPException(status_code=400, detail="Quiz already submitted.")

    if existing_attempt and existing_attempt.status == "in_progress":
        return {
            "status": "in_progress",
            "attempt_id": existing_attempt.id,
            "started_at": existing_attempt.started_at.isoformat()
        }

    new_attempt_number = (existing_attempt.attempt_number + 1) if existing_attempt else 1

    attempt = models.QuizAttempt(
        quiz_id=quiz.id,
        student_id=student.id,
        attempt_number=new_attempt_number,
        started_at=now,
        status="in_progress",
        score=0.0,
        total_marks=quiz.total_marks
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "status": "started",
        "attempt_id": attempt.id,
        "started_at": attempt.started_at.isoformat(),
        "duration_minutes": quiz.duration_minutes
    }


@router.post("/students/me/quizzes/{quiz_id}/submit")
def submit_quiz_answers(
    quiz_id: int,
    payload: schemas.QuizSubmitRequest,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Submits student answers, calculates score strictly on the backend,
    and stores audit answer records.
    Never trusts client-submitted scores or answers.
    """
    assignment = db.query(models.QuizAssignment).filter(
        models.QuizAssignment.quiz_id == quiz_id,
        models.QuizAssignment.student_id == student.id,
        models.QuizAssignment.is_excluded == False
    ).first()

    if not assignment:
        raise HTTPException(status_code=403, detail="Unauthorized access to quiz.")

    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.quiz_id == quiz.id,
        models.QuizAttempt.student_id == student.id,
        models.QuizAttempt.status == "in_progress"
    ).order_by(models.QuizAttempt.attempt_number.desc()).first()

    now = datetime.datetime.utcnow()

    # If no in-progress attempt, create one on the fly
    if not attempt:
        prev_attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == quiz.id,
            models.QuizAttempt.student_id == student.id
        ).count()
        if prev_attempts > 0 and not quiz.allow_multiple_attempts:
            raise HTTPException(status_code=400, detail="Quiz has already been submitted.")

        attempt = models.QuizAttempt(
            quiz_id=quiz.id,
            student_id=student.id,
            attempt_number=prev_attempts + 1,
            started_at=now,
            status="in_progress",
            total_marks=quiz.total_marks
        )
        db.add(attempt)
        db.flush()

    # Calculate score by querying actual questions from database
    questions = {q.id: q for q in quiz.questions}
    submitted_answers_map = {
        ans.get("question_id"): str(ans.get("selected_answer") or ans.get("selected_option") or "").strip()
        for ans in payload.answers
    }

    total_score = 0.0

    # Delete any previous answers for this attempt (idempotency)
    db.query(models.QuizAnswer).filter(models.QuizAnswer.attempt_id == attempt.id).delete()

    for q_id, q in questions.items():
        user_choice = submitted_answers_map.get(q_id, "")
        is_correct = (user_choice.lower() == q.correct_answer.strip().lower()) if user_choice else False
        marks_awarded = q.marks if is_correct else 0.0
        total_score += marks_awarded

        ans_record = models.QuizAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_answer=user_choice,
            is_correct=is_correct,
            marks_awarded=marks_awarded,
            evaluated_at=now
        )
        db.add(ans_record)

    attempt.score = total_score
    attempt.total_marks = quiz.total_marks
    attempt.status = "submitted"
    attempt.submitted_at = now
    db.commit()

    return {
        "status": "success",
        "message": "Quiz submitted successfully!",
        "submitted_at": now.isoformat(),
        "results_published": quiz.results_published,
        "score": total_score if quiz.results_published else None,
        "total_marks": quiz.total_marks
    }


@router.get("/students/me/quizzes/{quiz_id}/results")
def get_quiz_results(
    quiz_id: int,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Returns the student's evaluated quiz results with answers and explanations
    ONLY when permitted by faculty (results_published == True).
    """
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    if not quiz.results_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quiz results have not yet been released by the faculty member."
        )

    attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.quiz_id == quiz.id,
        models.QuizAttempt.student_id == student.id,
        models.QuizAttempt.status == "submitted"
    ).order_by(models.QuizAttempt.attempt_number.desc()).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="No submitted attempt found for this quiz.")

    answers = db.query(models.QuizAnswer).filter(
        models.QuizAnswer.attempt_id == attempt.id
    ).all()

    breakdown = []
    for ans in answers:
        q = ans.question
        options = json.loads(q.options) if q and q.options else []
        breakdown.append({
            "question_id": ans.question_id,
            "question_text": q.question_text if q else "",
            "marks": q.marks if q else 1.0,
            "options": options,
            "selected_answer": ans.selected_answer,
            "correct_answer": q.correct_answer if q else "",
            "is_correct": ans.is_correct,
            "marks_awarded": ans.marks_awarded,
            "explanation": q.explanation if q else None
        })

    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "subject_name": quiz.subject.name if quiz.subject else "",
        "score": attempt.score,
        "total_marks": quiz.total_marks,
        "percentage": round((attempt.score / quiz.total_marks * 100), 1) if quiz.total_marks > 0 else 0.0,
        "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        "breakdown": breakdown
    }
