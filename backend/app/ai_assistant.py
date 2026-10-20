import datetime
import json
import logging
import re
from typing import Dict, Any, List, Tuple, Optional
import httpx
from sqlalchemy.orm import Session
from app import models
from app.config import settings
from app.attendance_service import get_student_full_attendance

logger = logging.getLogger("erp_gemini_assistant")

DEFAULT_SUGGESTIONS = [
    "What is my overall attendance?",
    "Which subjects am I below 75%?",
    "How many classes should I attend to reach 75%?",
    "What is my timetable today?",
    "When is my next exam?",
    "Do I have any pending fees?",
    "What campus placements are available?"
]

def build_student_erp_context(db: Session, student: models.Student) -> str:
    """
    Assembles comprehensive live ERP context for the authenticated student
    to ground Google Gemini with verified institutional records.
    """
    # 1. Profile
    dept_name = student.department.name if student.department else "Engineering & Science"
    
    # 2. Attendance
    att_data = get_student_full_attendance(db, student)
    overall_pct = att_data["overall_percentage"]
    total_attended = att_data["total_attended"]
    total_conducted = att_data["total_conducted"]
    risk_status = att_data["risk_status"]
    recovery_classes = att_data["recovery_classes"]

    subjects_lines = []
    for s in att_data["subjects"]:
        recovery_note = f" (Needs {s['recovery_classes']} consecutive classes to reach 75%)" if s['recovery_classes'] > 0 else ""
        subjects_lines.append(
            f"- {s['subject_name']} ({s['subject_code']}): {s['percentage']}% ({s['attended_classes']}/{s['total_classes']} attended) | Status: {s['status']} | Faculty: {s['faculty_name']}{recovery_note}"
        )
    subjects_text = "\n".join(subjects_lines) if subjects_lines else "No enrolled subjects recorded."

    # 3. Timetable Today
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_idx = datetime.date.today().weekday()
    current_day = days[today_idx] if today_idx < 5 else "Monday"

    timetable_entries = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.department_id == student.department_id,
        models.TimetableEntry.semester == student.semester,
        models.TimetableEntry.day_of_week == current_day
    ).order_by(models.TimetableEntry.start_time).all()

    tt_lines = []
    for t in timetable_entries:
        fac_name = t.faculty.name if t.faculty else "Faculty"
        tt_lines.append(f"- {t.start_time} - {t.end_time}: {t.subject.name} ({t.subject.code}) in Room {t.room} by {fac_name}")
    timetable_text = "\n".join(tt_lines) if tt_lines else f"No classes scheduled for {current_day}."

    # 4. Upcoming Exams
    today = datetime.date.today()
    exams = db.query(models.Exam).filter(
        models.Exam.department_id == student.department_id,
        models.Exam.semester == student.semester,
        models.Exam.date >= today
    ).order_by(models.Exam.date).all()

    exam_lines = []
    for e in exams:
        exam_lines.append(f"- {e.name} - {e.subject.name} ({e.subject.code}): Date {e.date.strftime('%d %b %Y')} ({e.start_time} - {e.end_time}) at {e.venue}")
    exams_text = "\n".join(exam_lines) if exam_lines else "No upcoming exams currently scheduled."

    # 5. Fees
    fees = db.query(models.FeeRecord).filter(models.FeeRecord.student_id == student.id).all()
    if fees:
        total_fee = sum(f.total_amount for f in fees)
        paid_fee = sum(f.paid_amount for f in fees)
        pending_fee = total_fee - paid_fee
        fee_lines = [f"- {f.title}: Total ₹{f.total_amount:,.0f}, Paid ₹{f.paid_amount:,.0f}, Due ₹{f.total_amount - f.paid_amount:,.0f}, Status: {f.status}, Due Date: {f.due_date.strftime('%d %b %Y')}" for f in fees]
        fees_text = f"Total Fees: ₹{total_fee:,.0f} | Paid: ₹{paid_fee:,.0f} | Pending Balance: ₹{pending_fee:,.0f}\n" + "\n".join(fee_lines)
    else:
        fees_text = "No fee records recorded."

    # 6. Active Placements
    placements = db.query(models.Placement).order_by(models.Placement.deadline.asc()).limit(4).all()
    place_lines = [f"- {p.company} ({p.role}): Package {p.package_lpa} LPA | Eligibility: {p.eligibility} | Deadline: {p.deadline.strftime('%d %b %Y')}" for p in placements]
    placements_text = "\n".join(place_lines) if place_lines else "No active placement drives."

    # 7. Recent Announcements
    notifs = db.query(models.Notification).filter(
        (models.Notification.user_id == student.user_id) | (models.Notification.user_id == None)
    ).order_by(models.Notification.created_at.desc()).limit(3).all()
    notif_lines = [f"- [{n.type}] {n.title}: {n.message}" for n in notifs]
    notifs_text = "\n".join(notif_lines) if notif_lines else "No recent notifications."

    context = f"""
=== AUTHENTICATED STUDENT LIVE ERP CONTEXT ===
- Name: {student.name}
- Register Number: {student.reg_no}
- Department: {dept_name} (Semester {student.semester}, Section {student.section})
- Parent: {student.parent_name} ({student.parent_email})
- Student Email: {student.email}

=== LIVE ATTENDANCE METRICS ===
- Overall Attendance: {overall_pct}% ({total_attended} attended out of {total_conducted} conducted classes)
- Risk Classification: {risk_status} (Mandatory university minimum is {settings.SAFE_THRESHOLD}%)
- Consecutive Recovery Classes Needed for 75%: {recovery_classes} classes
- Parent Alert Status: {"Parent warning triggered because attendance is strictly below 75%" if overall_pct < 75.0 and total_conducted > 0 else "Safe standing maintained"}

=== SUBJECT-WISE ATTENDANCE BREAKDOWN ===
{subjects_text}

=== TIMETABLE FOR TODAY ({current_day}) ===
{timetable_text}

=== UPCOMING EXAMS ===
{exams_text}

=== TUITION & ACADEMIC FEES ===
{fees_text}

=== ACTIVE CAMPUS PLACEMENTS ===
{placements_text}

=== RECENT COLLEGE NOTIFICATIONS ===
{notifs_text}
==============================================
"""
    return context.strip()

def query_gemini_api(
    api_key: str,
    model_name: str,
    system_instruction: str,
    user_query: str
) -> Tuple[Optional[str], List[str], Optional[str]]:
    """
    Dispatches query to Google Generative Language API (Gemini 2.5 / 3.5 / Flash-Lite).
    Supports automatic graceful fallback across supported Gemini models if a specific model returns 404.
    Returns (assistant_reply_text, list_of_suggested_followups, active_model_used).
    """
    clean_key = api_key.strip().strip('"').strip("'")
    clean_requested = model_name.strip() if model_name else "gemini-2.5-flash-lite"
    
    # Priority list of models to try
    candidate_models: List[str] = [clean_requested]
    for m in [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash"
    ]:
        if m not in candidate_models:
            candidate_models.append(m)

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_query}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
            "topP": 0.95
        }
    }

    headers = {"Content-Type": "application/json"}

    for candidate in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={clean_key}"
        try:
            with httpx.Client(timeout=25.0) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code == 404:
                    logger.warning(f"Gemini model '{candidate}' not available (404). Trying next fallback model...")
                    continue
                if resp.status_code != 200:
                    logger.error(f"Gemini API ({candidate}) returned HTTP {resp.status_code}: {resp.text}")
                    continue

                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    logger.warning(f"Gemini ({candidate}) returned zero candidates")
                    continue

                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if not text:
                    continue

                # Extract suggested inquiries if Gemini formatted them
                suggestions: List[str] = []
                if "SUGGESTED_INQUIRIES:" in text:
                    parts = text.split("SUGGESTED_INQUIRIES:")
                    reply_text = parts[0].strip()
                    sugg_block = parts[1].strip()
                    for line in sugg_block.split("\n"):
                        clean_line = re.sub(r"^[-*•\d.\s]+", "", line).strip().strip('"').strip("'")
                        if clean_line and len(clean_line) > 5:
                            suggestions.append(clean_line)
                else:
                    reply_text = text.strip()

                if not suggestions:
                    suggestions = [
                        "What is my overall attendance?",
                        "Which subjects am I below 75%?",
                        "What is my timetable today?"
                    ]

                logger.info(f"Successfully generated response with Gemini model '{candidate}'")
                return reply_text, suggestions[:4], candidate

        except Exception as e:
            logger.error(f"Error communicating with Gemini model '{candidate}': {e}")
            continue

    return None, [], None

def process_rule_based_student_query(db: Session, student: models.Student, query: str) -> Dict[str, Any]:
    """
    Fallback deterministic ERP reasoning engine when Gemini API key is absent or unreachable.
    """
    q = query.strip().lower()

    # Recovery query
    if any(k in q for k in ["reach 75", "consecutive", "how many classes", "recover", "improve attendance", "recovery"]):
        att_data = get_student_full_attendance(db, student)
        needed = att_data["recovery_classes"]
        overall = att_data["overall_percentage"]
        if overall >= 75.0:
            reply = f"Great news, **{student.name}**! Your overall attendance is currently **{overall}%**, which is safely at or above the required 75%. You do not need recovery classes, but continue attending regularly to maintain your safe standing."
        else:
            subjects_low = [s for s in att_data["subjects"] if s["percentage"] < 75.0]
            sub_breakdown = "\n".join([f"- **{s['subject_name']}** ({s['percentage']}%): Attend **{s['recovery_classes']}** more consecutive classes." for s in subjects_low])
            reply = (
                f"Your overall attendance is currently **{overall}%** (Status: **{att_data['risk_status']}**).\n\n"
                f"🎯 **Recovery Prediction:**\n"
                f"You need to attend approximately **{needed} more consecutive classes** overall without unexcused absences to reach the mandatory 75% threshold.\n\n"
                f"**Subject-wise classes needed:**\n{sub_breakdown if sub_breakdown else 'None'}"
            )
        return {
            "reply": reply,
            "intent": "attendance_recovery",
            "suggested_questions": ["Which subjects am I below 75%?", "What is my timetable today?", "When is my next exam?"],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Low attendance / Shortage subjects
    if any(k in q for k in ["below 75", "shortage", "at risk", "warning subjects", "low attendance", "safe or risk"]):
        att_data = get_student_full_attendance(db, student)
        subjects_low = [s for s in att_data["subjects"] if s["percentage"] < 75.0]
        if not subjects_low:
            reply = f"Good news! None of your subjects are below 75%. All your courses are in **Safe** standing (Overall: **{att_data['overall_percentage']}%**)."
        else:
            list_txt = "\n".join([f"- **{s['subject_name']}** ({s['subject_code']}): **{s['percentage']}%** ({s['attended_classes']}/{s['total_classes']} classes) - Status: **{s['status']}**" for s in subjects_low])
            reply = (
                f"You currently have **{len(subjects_low)} subject(s)** below the 75% mandatory threshold:\n\n"
                f"{list_txt}\n\n"
                f"⚠️ *Note:* Parents are alerted when overall attendance drops below 75%. Prioritize attending these lectures."
            )
        return {
            "reply": reply,
            "intent": "low_attendance_subjects",
            "suggested_questions": ["How many classes should I attend to reach 75%?", "What is my timetable today?", "Show my latest notifications."],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Overall attendance
    if any(k in q for k in ["attendance", "percentage", "attended"]):
        att_data = get_student_full_attendance(db, student)
        sub_txt = "\n".join([f"- **{s['subject_name']}**: {s['percentage']}% ({s['attended_classes']}/{s['total_classes']} attended)" for s in att_data["subjects"]])
        recovery_hint = f"\n💡 *Recommendation:* Attend {att_data['recovery_classes']} consecutive classes to restore safe standing." if att_data['recovery_classes'] > 0 else " Keep up the steady attendance!"
        reply = (
            f"Here is your attendance summary, **{student.name}**:\n\n"
            f"- **Overall Attendance:** **{att_data['overall_percentage']}%**\n"
            f"- **Attended:** {att_data['total_attended']} of {att_data['total_conducted']} total lectures\n"
            f"- **Risk Level:** **{att_data['risk_status']}** (Required: 75%)\n\n"
            f"**Subject-wise Breakdown:**\n{sub_txt}\n{recovery_hint}"
        )
        return {
            "reply": reply,
            "intent": "overall_attendance",
            "suggested_questions": ["Which subjects am I below 75%?", "How many classes should I attend to reach 75%?", "What is my timetable today?"],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Timetable
    if any(k in q for k in ["timetable", "classes today", "schedule", "routine", "lectures today", "today's timetable", "today classes"]):
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today_idx = datetime.date.today().weekday()
        current_day = days[today_idx] if today_idx < 5 else "Monday"

        entries = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.department_id == student.department_id,
            models.TimetableEntry.semester == student.semester,
            models.TimetableEntry.day_of_week == current_day
        ).order_by(models.TimetableEntry.start_time).all()

        if not entries:
            reply = f"You have no scheduled classes for **{current_day}** in the ERP timetable."
        else:
            schedule_txt = "\n".join([f"- **{e.start_time} - {e.end_time}**: {e.subject.name} (Room: {e.room}, Faculty: {e.faculty.name})" for e in entries])
            reply = f"📅 **Timetable for {current_day} (Semester {student.semester} - Sec {student.section}):**\n\n{schedule_txt}"

        return {
            "reply": reply,
            "intent": "timetable",
            "suggested_questions": ["When is my next exam?", "What is my overall attendance?", "Do I have any pending fees?"],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Exams
    if any(k in q for k in ["exam", "test", "midterm", "venue", "upcoming exam"]):
        today = datetime.date.today()
        upcoming_exams = db.query(models.Exam).filter(
            models.Exam.department_id == student.department_id,
            models.Exam.semester == student.semester,
            models.Exam.date >= today
        ).order_by(models.Exam.date).all()

        if not upcoming_exams:
            reply = f"There are no upcoming exams currently scheduled for Semester {student.semester} in your department."
        else:
            next_one = upcoming_exams[0]
            exams_txt = "\n".join([f"- **{e.name} - {e.subject.name}**: {e.date.strftime('%d %b %Y')} ({e.start_time} - {e.end_time}) at **{e.venue}**" for e in upcoming_exams])
            reply = (
                f"📝 **Upcoming Exams:**\n\n"
                f"Your next scheduled exam is **{next_one.name} ({next_one.subject.name})** on **{next_one.date.strftime('%A, %d %B %Y')}** at **{next_one.venue}**.\n\n"
                f"**Complete Schedule:**\n{exams_txt}"
            )
        return {
            "reply": reply,
            "intent": "exams",
            "suggested_questions": ["What is my timetable today?", "What is my attendance?", "Show my latest notifications."],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Fees
    if any(k in q for k in ["fee", "dues", "pending fee", "balance", "paid", "tuition"]):
        fees = db.query(models.FeeRecord).filter(models.FeeRecord.student_id == student.id).all()
        if not fees:
            reply = "You currently have no fee records in the ERP."
        else:
            total_sum = sum(f.total_amount for f in fees)
            paid_sum = sum(f.paid_amount for f in fees)
            pending_sum = total_sum - paid_sum
            fee_txt = "\n".join([f"- **{f.title}**: Total: ₹{f.total_amount:,.0f} | Paid: ₹{f.paid_amount:,.0f} | Status: **{f.status}** (Due: {f.due_date.strftime('%d %b %Y')})" for f in fees])
            reply = (
                f"💰 **Fee Details for {student.name}:**\n\n"
                f"- **Total Fees:** ₹{total_sum:,.0f}\n"
                f"- **Paid Amount:** ₹{paid_sum:,.0f}\n"
                f"- **Pending Balance:** **₹{pending_sum:,.0f}**\n\n"
                f"**Breakdown:**\n{fee_txt}"
            )
        return {
            "reply": reply,
            "intent": "fees",
            "suggested_questions": ["When is my next exam?", "What placements are available?", "What is my attendance?"],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Placements
    if any(k in q for k in ["placement", "job", "company", "interview", "package", "hiring", "internship"]):
        placements = db.query(models.Placement).order_by(models.Placement.deadline.asc()).limit(5).all()
        if not placements:
            reply = "There are no active placement drives listed at this moment."
        else:
            p_txt = "\n\n".join([f"🏢 **{p.company}** - *{p.role}*\n- Package: **{p.package_lpa} LPA**\n- Eligibility: {p.eligibility}\n- Deadline: **{p.deadline.strftime('%d %B %Y')}**\n- {p.description}" for p in placements])
            reply = f"🚀 **Active Campus Placement Drives:**\n\n{p_txt}"
        return {
            "reply": reply,
            "intent": "placements",
            "suggested_questions": ["What is my timetable today?", "What is my attendance?", "When is my next exam?"],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Notifications
    if any(k in q for k in ["notification", "announcement", "notice", "alert", "recent update"]):
        notifs = db.query(models.Notification).filter(
            (models.Notification.user_id == student.user_id) | (models.Notification.user_id == None)
        ).order_by(models.Notification.created_at.desc()).limit(4).all()

        if notifs:
            n_txt = "\n\n".join([f"🔔 **{n.title}** ({n.type})\n{n.message}\n*{n.created_at.strftime('%d %b %Y, %I:%M %p')}*" for n in notifs])
            reply = f"Here are your latest college announcements and alerts:\n\n{n_txt}"
        else:
            reply = "You have no recent notifications."
        return {
            "reply": reply,
            "intent": "notifications",
            "suggested_questions": ["What is my attendance?", "What is my timetable today?", "When is my next exam?"],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Semester / Profile
    if any(k in q for k in ["semester", "profile", "reg no", "register", "department", "who am i", "my details"]):
        dept_name = student.department.name if student.department else "Computer Science"
        reply = (
            f"🎓 **Your Academic Profile:**\n\n"
            f"- **Name:** {student.name}\n"
            f"- **Register Number:** {student.reg_no}\n"
            f"- **Department:** {dept_name}\n"
            f"- **Current Semester:** Semester {student.semester}\n"
            f"- **Section:** Section {student.section}\n"
            f"- **Registered Parent:** {student.parent_name} ({student.parent_email})\n"
            f"- **Student Email:** {student.email}"
        )
        return {
            "reply": reply,
            "intent": "profile",
            "suggested_questions": ["What is my overall attendance?", "What is my timetable today?", "When is my next exam?"],
            "engine": "Rule-Based ERP Engine",
            "model": None
        }

    # Default general reply
    reply = (
        f"Hello **{student.name}**! I am your AI ERP Assistant. I can answer real-time questions about your college records.\n\n"
        f"Try asking:\n"
        f"- *'What is my overall attendance?'*\n"
        f"- *'Which subjects am I below 75%?'*\n"
        f"- *'How many classes should I attend to reach 75%?'*\n"
        f"- *'What is my timetable today?'*\n"
        f"- *'When is my next exam?'*\n"
        f"- *'Do I have any pending fees?'*"
    )
    return {
        "reply": reply,
        "intent": "help",
        "suggested_questions": DEFAULT_SUGGESTIONS[:4],
        "engine": "Rule-Based ERP Engine",
        "model": None
    }

def process_student_query(db: Session, student: models.Student, query: str) -> Dict[str, Any]:
    """
    Main entry point for student queries.
    Uses Google Gemini API grounded with live student ERP context.
    Falls back gracefully to the deterministic rule engine if Gemini API key is missing or encounters errors.
    """
    # 1. Check if Gemini API key is configured
    gemini_key = (settings.GEMINI_API_KEY or "").strip()

    if gemini_key:
        logger.info(f"Processing student query using Google Gemini ({settings.GEMINI_MODEL})...")
        context_str = build_student_erp_context(db, student)

        system_instruction = f"""
You are the intelligent, polite, and authoritative AI ERP Academic Assistant for {student.name} ({student.reg_no}) at {settings.APP_NAME}.
You have direct, verified access to this student's real-time institutional records provided in the context below.

Instructions:
1. Always base your answers on the provided student ERP context.
2. If the student asks about attendance, explain their overall percentage, status (Safe/Warning/High Risk), and the mandatory 75% university requirement.
3. If they ask about recovery, accurately refer to the consecutive recovery classes needed without unexcused absences.
4. If they ask "Can I miss a class?" or "Can I bunk?", calculate whether their attendance will drop below 75% and advise accordingly.
5. Format your answers clearly using Markdown (use bolding for percentages and names, bullet points for lists).
6. Be encouraging, concise, and academically supportive.
7. At the very end of your response, always provide 3 relevant follow-up questions formatted exactly as:
SUGGESTED_INQUIRIES:
- Question 1
- Question 2
- Question 3

STUDENT ERP CONTEXT:
{context_str}
"""

        gemini_reply, suggestions, model_used = query_gemini_api(
            api_key=gemini_key,
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_instruction,
            user_query=query
        )

        if gemini_reply:
            return {
                "reply": gemini_reply,
                "intent": "gemini_generative",
                "suggested_questions": suggestions,
                "engine": "Google Gemini AI",
                "model": model_used or settings.GEMINI_MODEL
            }
        else:
            logger.warning("Gemini API call failed or returned empty. Falling back to deterministic rule engine.")

    # 2. Fallback to rule-based ERP reasoning
    return process_rule_based_student_query(db, student, query)
