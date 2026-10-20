from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.ai_assistant import process_student_query

router = APIRouter(prefix="/chat", tags=["AI ERP Assistant"])

def get_logged_in_student(current_user: models.User = Depends(get_current_user)) -> models.Student:
    if current_user.role != "student" or not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The AI ERP Assistant is currently available for students"
        )
    return current_user.student_profile

@router.post("", response_model=schemas.ChatResponse)
def chat_with_assistant(
    payload: schemas.ChatRequest,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    result = process_student_query(db, student, payload.message)
    return result
