import datetime
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app import models
from app.config import settings
from app.email_service import (
    send_parent_attendance_email,
    generate_attendance_email_content,
    test_smtp_connection,
    send_smtp_message,
    get_effective_smtp_config
)
from app.ai_assistant import query_gemini_api

logger = logging.getLogger("erp_direct_api")

router = APIRouter(prefix="/api", tags=["Direct ERP Cloud Integration"])

class AlertDispatchPayload(BaseModel):
    student_id: Optional[int] = None
    student_name: str
    reg_no: str
    department_name: Optional[str] = "Computer Science and Engineering"
    attendance_pct: float
    recovery_classes: Optional[int] = 0
    parent_name: Optional[str] = "Parent / Guardian"
    parent_email: str
    student_email: Optional[str] = None
    alert_type: Optional[str] = "Attendance Warning Notice"
    semester: Optional[int] = 6
    attended_sessions: Optional[int] = 0
    total_sessions: Optional[int] = 0
    trigger_source: Optional[str] = "manual"  # manual or automated

class BulkDispatchPayload(BaseModel):
    students: List[AlertDispatchPayload]

class TestSmtpPayload(BaseModel):
    to_email: Optional[str] = None
    test_email: Optional[str] = None
    recipient_email: Optional[str] = None

class DirectChatPayload(BaseModel):
    message: str
    student_name: Optional[str] = "Arun Kumar"
    reg_no: Optional[str] = "21CS101"
    department_name: Optional[str] = "Computer Science and Engineering"
    attendance_pct: Optional[float] = 84.0
    risk_status: Optional[str] = "Safe"
    role: Optional[str] = "student"


def run_smtp_dispatch_background(payload_dict: dict):
    """
    Executes actual SMTP socket connection and message delivery in background thread.
    """
    try:
        db = SessionLocal()
        res = send_parent_attendance_email(
            parent_email=payload_dict["parent_email"],
            student_name=payload_dict["student_name"],
            reg_no=payload_dict["reg_no"],
            department_name=payload_dict.get("department_name") or "Computer Science and Engineering",
            attendance_pct=payload_dict["attendance_pct"],
            recovery_classes=payload_dict.get("recovery_classes") or 0,
            parent_name=payload_dict.get("parent_name") or "Parent / Guardian",
            semester=payload_dict.get("semester") or 6,
            attended_sessions=payload_dict.get("attended_sessions") or 0,
            total_sessions=payload_dict.get("total_sessions") or 0,
            student_email=payload_dict.get("student_email"),
            db=db
        )
        logger.info(f"Background SMTP result for {payload_dict['parent_email']}: {res['status']} - {res['message']}")
        db.close()
    except Exception as e:
        logger.error(f"Error in background SMTP dispatch to {payload_dict.get('parent_email')}: {e}")


@router.post("/smtp/send-attendance-alert")
def dispatch_single_attendance_alert(
    payload: AlertDispatchPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Dispatches parent and student attendance alert notice via SMTP.
    Used for both automated triggers (faculty attendance entry) and manual admin triggers.
    """
    recipients_desc = payload.parent_email
    if payload.student_email and payload.student_email != payload.parent_email:
        recipients_desc += f" & {payload.student_email}"

    logger.info(f"Enqueueing attendance alert ({payload.trigger_source}) for {payload.student_name} ({payload.reg_no}) to {recipients_desc}")

    # Generate full HTML email content immediately for instant UI preview
    content = generate_attendance_email_content(
        student_name=payload.student_name,
        reg_no=payload.reg_no,
        department_name=payload.department_name or "Computer Science and Engineering",
        attendance_pct=payload.attendance_pct,
        recovery_classes=payload.recovery_classes or 0,
        parent_name=payload.parent_name or "Parent / Guardian",
        semester=payload.semester or 6,
        attended_sessions=payload.attended_sessions or 0,
        total_sessions=payload.total_sessions or 0
    )

    # Schedule background SMTP send
    background_tasks.add_task(run_smtp_dispatch_background, payload.dict())

    # Record alert in DB if student exists
    try:
        student = None
        if payload.student_id:
            student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
        if not student and payload.reg_no:
            student = db.query(models.Student).filter(models.Student.reg_no == payload.reg_no).first()

        if student:
            alert_rec = models.AttendanceAlert(
                student_id=student.id,
                attendance_pct=payload.attendance_pct,
                parent_email=payload.parent_email,
                alert_type=payload.alert_type or f"{payload.trigger_source.capitalize()} Attendance Alert",
                sent_at=datetime.datetime.utcnow(),
                status="Sent",
                recovery_classes=payload.recovery_classes or 0,
                email_preview=content["html"]
            )
            db.add(alert_rec)
            db.commit()
    except Exception as e:
        logger.warning(f"Could not persist alert record to DB: {e}")

    return {
        "status": "Sent",
        "message": f"Attendance alert successfully dispatched via SMTP (smtp.gmail.com:587 TLS) to {recipients_desc}.",
        "preview": content["html"],
        "subject": content["subject"],
        "error": None
    }


@router.post("/smtp/dispatch-all-defaulters")
def dispatch_all_defaulters(
    payload: BulkDispatchPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Dispatches attendance alerts to all listed students below the attendance threshold.
    """
    results = []
    for st in payload.students:
        background_tasks.add_task(run_smtp_dispatch_background, st.dict())
        results.append({
            "reg_no": st.reg_no,
            "student_name": st.student_name,
            "parent_email": st.parent_email,
            "status": "Sent",
            "message": f"Enqueued for live SMTP dispatch to {st.parent_email}"
        })

    return {
        "status": "success",
        "total": len(payload.students),
        "sent_count": len(payload.students),
        "failed_count": 0,
        "results": results,
        "message": f"Bulk dispatch started: live SMTP alerts enqueued for all {len(payload.students)} defaulter students."
    }


@router.post("/smtp/test-connection")
def test_smtp_gateway(payload: Optional[TestSmtpPayload] = None, db: Session = Depends(get_db)):
    """
    Tests SMTP connection and optionally sends a test verification message.
    """
    target_email = None
    if payload:
        target_email = payload.to_email or payload.test_email or payload.recipient_email
    res = test_smtp_connection(to_email=target_email or "examplecollegeerp@gmail.com", db=db)
    return res


@router.post("/ai/chat")
def direct_ai_chat(payload: DirectChatPayload):
    """
    Answers student and academic queries using Google Gemini 2.5.
    STRICTLY configured to deliver simple, short, crisp, and direct answers.
    """
    gemini_key = (settings.GEMINI_API_KEY or "").strip()
    raw_query = payload.message.strip()

    if gemini_key:
        system_instruction = f"""
You are the AI Academic Assistant for {payload.student_name} ({payload.reg_no}) enrolled in {payload.department_name}.
Current Student Profile:
- Overall Attendance: {payload.attendance_pct}% ({payload.risk_status} Standing, Minimum required is 75%)
- Department: {payload.department_name}

CRITICAL RULES:
1. GIVE SIMPLE, SHORT, AND DIRECT ANSWERS according to the exact question asked by the student.
2. DO NOT give long multi-paragraph essays, unsolicited theoretical frameworks, or unnecessary introductions.
3. Keep your response strictly to 2 to 3 concise, clear sentences (or a short bulleted list of 3-4 items if the question asks for a list or schedule).
4. If the student asks about a concept (e.g., QuickSort, recursion, deadlock, ACID, OOP), explain it simply and directly in 2-3 sentences.
5. If the student asks about timetable, attendance, or exams, give the exact direct information without filler.
6. At the very end, include 3 short follow-up questions formatted exactly as:
SUGGESTED_INQUIRIES:
- Question 1
- Question 2
- Question 3
"""
        reply_text, suggestions, model_used = query_gemini_api(
            api_key=gemini_key,
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_instruction,
            user_query=raw_query
        )

        if reply_text:
            return {
                "reply": reply_text,
                "engine": "Google Gemini 2.5",
                "model": model_used,
                "suggested_questions": suggestions
            }

    # Fallback concise reply if Gemini is unreachable
    return {
        "reply": f"Hello {payload.student_name}. Regarding '{raw_query}': your attendance is {payload.attendance_pct}% ({payload.risk_status} Standing). Please let me know if you need specific schedule, exam, or course details.",
        "engine": "ERP Direct Assistant",
        "model": "rule-based",
        "suggested_questions": ["What is my overall attendance?", "What is my timetable today?", "When is my next exam?"]
    }
