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
    "What are my subject marks & CGPA?",
    "Which assignments are pending?",
    "What is my timetable today?",
    "When is my next exam?"
]

UNRELATED_KEYWORDS = [
    "movie", "film", "actor", "actress", "cinema", "song", "music", "cricket", "ipl",
    "football", "fifa", "recipe", "cook", "restaurant", "politics", "election",
    "minister", "president", "gossip", "horoscope", "astrology", "dating", "relationship",
    "shopping", "amazon", "flipkart", "discount", "crypto", "bitcoin", "weather forecast",
    "tell me a joke", "standup", "comedy", "game", "gaming", "playstation", "xbox",
    "netflix", "prime video", "spotify"
]

NON_ACADEMIC_STANDARD_RESPONSE = (
    "I'm your College ERP Academic Assistant. I can help with your academic doubts, "
    "attendance, marks, assignments, timetable and student-related ERP information."
)

PRIVACY_VIOLATION_RESPONSE = (
    "I'm your College ERP Academic Assistant. For student privacy and institutional security, "
    "I can only retrieve and discuss your own academic records and authorized coursework. "
    "Other students' private marks, attendance, or personal records cannot be accessed."
)


def is_cross_student_query(query: str, student: models.Student, db: Session) -> bool:
    """
    Detects if the authenticated student is attempting to access another student's private data.
    """
    q = query.lower()
    # Check for keywords indicating inquiry about others
    if any(phrase in q for phrase in [
        "other student", "classmate", "highest mark", "who scored", "who failed",
        "who has low attendance", "topper", "rank 1", "someone else", "another student"
    ]):
        return True

    # Check for other student register numbers or names in this department
    other_students = db.query(models.Student).filter(
        models.Student.id != student.id,
        models.Student.department_id == student.department_id
    ).limit(30).all()

    for s in other_students:
        if s.reg_no and s.reg_no.lower() in q:
            return True
        first_name = s.name.split()[0].lower() if s.name else ""
        if len(first_name) > 3 and f" {first_name} " in f" {q} ":
            # If query asks for their marks, attendance, or details
            if any(k in q for k in ["mark", "attendance", "score", "grade", "gpa", "record", "contact", "phone", "email"]):
                return True

    return False


def is_unrelated_query(query: str) -> bool:
    """
    Identifies non-academic, general entertainment, or unrelated queries.
    """
    q = query.lower().strip()
    # If question mentions ERP or academic keywords, treat as academic
    academic_keywords = [
        "attendance", "mark", "exam", "assignment", "quiz", "timetable", "class",
        "period", "lecture", "cgpa", "gpa", "fee", "placement", "faculty", "professor",
        "syllabus", "semester", "algorithm", "database", "network", "code", "programming",
        "software", "notes", "od", "leave", "college", "subject", "deadlock", "recursion",
        "quicksort", "binary", "tree", "graph", "cpu", "os", "compiler", "math", "physics",
        "chemistry", "engineering", "concept", "explain", "tanglish", "mcq", "question"
    ]
    if any(k in q for k in academic_keywords):
        return False

    return any(k in q for k in UNRELATED_KEYWORDS)


def retrieve_relevant_notes_chunks(db: Session, student: models.Student, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """
    RAG Ingestion & Semantic Retrieval:
    Retrieves authorized note chunks belonging to this student matching query keywords.
    Strictly isolated: only searches notes uploaded by this authenticated student.
    """
    if not query or len(query.strip()) < 3:
        return []

    # Get student's document IDs
    doc_ids = [d.id for d in db.query(models.StudentDocument.id).filter(models.StudentDocument.student_id == student.id).all()]
    if not doc_ids:
        return []

    terms = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', query.lower()))
    if not terms:
        return []

    chunks = db.query(models.DocumentChunk).filter(models.DocumentChunk.document_id.in_(doc_ids)).all()
    scored = []
    for c in chunks:
        c_terms = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', c.chunk_text.lower()))
        overlap = len(terms.intersection(c_terms))
        if overlap > 0:
            scored.append((overlap, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for score, c in scored[:top_k]:
        doc_name = c.document.filename if c.document else "Uploaded Notes"
        results.append({
            "document_name": doc_name,
            "page": c.page_number or 1,
            "text": c.chunk_text
        })
    return results


def build_student_erp_context(db: Session, student: models.Student, query: str = "") -> str:
    """
    Assembles comprehensive live ERP context for the authenticated student
    to ground Google Gemini with verified institutional records.
    Strictly personalized to the authenticated student session.
    """
    dept_name = student.department.name if student.department else "Engineering & Science"

    # 1. Attendance Metrics
    att_data = get_student_full_attendance(db, student)
    overall_pct = att_data["overall_percentage"]
    total_attended = att_data["total_attended"]
    total_conducted = att_data["total_conducted"]
    risk_status = att_data["risk_status"]
    recovery_classes = att_data["recovery_classes"]

    subjects_lines = []
    low_att_subjects = []
    for s in att_data["subjects"]:
        recovery_note = f" (Needs {s['recovery_classes']} consecutive classes to reach 75%)" if s['recovery_classes'] > 0 else ""
        subjects_lines.append(
            f"- {s['subject_name']} ({s['subject_code']}): {s['percentage']}% ({s['attended_classes']}/{s['total_classes']} attended) | Status: {s['status']} | Faculty: {s['faculty_name']}{recovery_note}"
        )
        if s['percentage'] < 75.0:
            low_att_subjects.append(f"{s['subject_name']} ({s['percentage']}%)")
    subjects_text = "\n".join(subjects_lines) if subjects_lines else "No enrolled subjects recorded."
    low_att_text = ", ".join(low_att_subjects) if low_att_subjects else "None (All subjects safely at or above 75%)"

    # 2. Marks & CGPA
    marks = db.query(models.Mark).filter(models.Mark.student_id == student.id).all()
    marks_lines = []
    if marks:
        for m in marks:
            sub_name = m.subject.name if m.subject else f"Subject #{m.subject_id}"
            sub_code = m.subject.code if m.subject else "N/A"
            marks_lines.append(
                f"- {sub_name} ({sub_code}): CIA-1: {m.internal_1 or 'N/A'}/60, CIA-2: {m.internal_2 or 'N/A'}/60, "
                f"Assignment: {m.assignment or 'N/A'}/10, Total Scaled: {m.total or 'N/A'}/100, "
                f"Grade: {m.grade or 'Pending'}, Grade Point: {m.grade_point or 'N/A'}"
            )
        marks_text = "\n".join(marks_lines)
    else:
        marks_text = "No internal marks recorded in the ERP for current semester."

    cgpa_val = f"{student.cgpa:.2f}" if student.cgpa else "Pending calculation"

    # 3. Released Quiz Results (Strictly respect results_published)
    quiz_attempts = db.query(models.QuizAttempt).join(models.Quiz).filter(
        models.QuizAttempt.student_id == student.id,
        models.Quiz.results_published == True
    ).all()

    quiz_lines = []
    for qa in quiz_attempts:
        q_title = qa.quiz.title if qa.quiz else "Quiz"
        quiz_lines.append(
            f"- {q_title}: Score {qa.score}/{qa.total_marks} ({((qa.score / qa.total_marks) * 100):.1f}%) | Status: {qa.status}"
        )
    quizzes_text = "\n".join(quiz_lines) if quiz_lines else "No released quiz results available at this time (Faculty has not released quiz results yet)."

    # 4. Assignments & Submission Deadlines
    assignments = db.query(models.Assignment).filter(
        models.Assignment.department_id == student.department_id,
        models.Assignment.semester == student.semester
    ).order_by(models.Assignment.due_date.asc()).all()

    pending_assignments = []
    submitted_assignments = []
    for a in assignments:
        sub = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.student_id == student.id
        ).first()
        sub_title = a.subject.name if a.subject else "Course"
        if sub:
            marks_info = f"Marks: {sub.marks_obtained}/{a.max_marks}" if sub.marks_obtained is not None else "Grading in Progress"
            submitted_assignments.append(
                f"- [SUBMITTED] {a.title} ({sub_title}): Submitted on {sub.submitted_at.strftime('%d %b %Y')} | Status: {sub.status} ({marks_info})"
            )
        else:
            pending_assignments.append(
                f"- [PENDING] {a.title} ({sub_title}): Due {a.due_date.strftime('%d %b %Y')} at {a.due_time or '23:59'} | Max Marks: {a.max_marks}"
            )

    assignments_text = ""
    if pending_assignments:
        assignments_text += "**Pending Assignments:**\n" + "\n".join(pending_assignments) + "\n\n"
    else:
        assignments_text += "**Pending Assignments:** None (All current assignments submitted!)\n\n"

    if submitted_assignments:
        assignments_text += "**Completed Submissions:**\n" + "\n".join(submitted_assignments)
    else:
        assignments_text += "**Completed Submissions:** None recorded yet."

    # 5. Timetable Today
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

    # 6. Upcoming Exams
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

    # 7. Tuition & Academic Fees
    fees = db.query(models.FeeRecord).filter(models.FeeRecord.student_id == student.id).all()
    if fees:
        total_fee = sum(f.total_amount for f in fees)
        paid_fee = sum(f.paid_amount for f in fees)
        pending_fee = total_fee - paid_fee
        fee_lines = [f"- {f.title}: Total ₹{f.total_amount:,.0f}, Paid ₹{f.paid_amount:,.0f}, Due ₹{f.total_amount - f.paid_amount:,.0f}, Status: {f.status}" for f in fees]
        fees_text = f"Total Fees: ₹{total_fee:,.0f} | Paid: ₹{paid_fee:,.0f} | Pending Balance: ₹{pending_fee:,.0f}\n" + "\n".join(fee_lines)
    else:
        fees_text = "No fee records recorded."

    # 8. Available Notes & Course Materials
    notes_docs = db.query(models.StudentDocument).filter(models.StudentDocument.student_id == student.id).all()
    if notes_docs:
        notes_lines = [f"- {d.filename} ({d.file_type.upper()}, {len(d.chunks)} sections) - Status: {d.processing_status}" for d in notes_docs]
        notes_text = "\n".join(notes_lines)
    else:
        notes_text = "No uploaded study notes currently in your account."

    # 9. Semantic RAG Chunks from Student Notes
    retrieved_chunks = retrieve_relevant_notes_chunks(db, student, query, top_k=3)
    chunks_text = ""
    if retrieved_chunks:
        chunk_lines = [f"[{c['document_name']} - Page/Slide {c['page']}]:\n{c['text'][:400]}..." for c in retrieved_chunks]
        chunks_text = "\n\n=== RETRIEVED STUDENT ACADEMIC NOTES EXCERPTS ===\n" + "\n\n".join(chunk_lines) + "\n==============================================="

    context = f"""
=== AUTHENTICATED STUDENT LIVE ERP CONTEXT ===
- Name: {student.name}
- Register Number: {student.reg_no}
- Department: {dept_name} (Semester {student.semester}, Section {student.section})
- Cumulative GPA (CGPA): {cgpa_val}
- Student Email: {student.email}

=== LIVE ATTENDANCE METRICS ===
- Overall Attendance: {overall_pct}% ({total_attended} attended out of {total_conducted} conducted classes)
- Risk Classification: {risk_status} (Mandatory university minimum is {settings.SAFE_THRESHOLD}%)
- Consecutive Recovery Classes Needed for 75%: {recovery_classes} classes
- Low Attendance Shortage Subjects (< 75%): {low_att_text}

=== SUBJECT-WISE ATTENDANCE BREAKDOWN ===
{subjects_text}

=== ACADEMIC MARKS & SEMESTER PERFORMANCE ===
{marks_text}

=== RELEASED QUIZ RESULTS ===
{quizzes_text}

=== ASSIGNMENTS & DEADLINES ===
{assignments_text}

=== TIMETABLE FOR TODAY ({current_day}) ===
{timetable_text}

=== UPCOMING EXAMS ===
{exams_text}

=== TUITION & ACADEMIC FEES ===
{fees_text}

=== AVAILABLE STUDENT NOTES ===
{notes_text}
{chunks_text}
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
    Dispatches query to Google Generative Language API (Gemini 2.5 / 2.0 / 1.5).
    Supports automatic graceful fallback across supported Gemini models.
    """
    clean_key = api_key.strip().strip('"').strip("'")
    clean_requested = model_name.strip() if model_name else "gemini-2.5-flash-lite"
    
    candidate_models: List[str] = [clean_requested]
    for m in [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-flash-latest"
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
            "temperature": 0.3,
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
                    logger.warning(f"Gemini model '{candidate}' not available (404). Trying next fallback...")
                    continue
                if resp.status_code != 200:
                    logger.error(f"Gemini API ({candidate}) returned HTTP {resp.status_code}: {resp.text}")
                    continue

                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    continue

                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if not text:
                    continue

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
                    suggestions = DEFAULT_SUGGESTIONS[:4]

                return reply_text, suggestions[:4], candidate

        except Exception as e:
            logger.error(f"Error communicating with Gemini model '{candidate}': {e}")
            continue

    return None, [], None


def process_rule_based_student_query(db: Session, student: models.Student, query: str) -> Dict[str, Any]:
    """
    Fallback deterministic ERP reasoning engine when Gemini API key is absent or unreachable.
    Strictly derives answers from database values.
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
            "suggested_questions": ["Which subjects am I below 75%?", "What are my marks & CGPA?", "Which assignments are pending?"],
            "engine": "Deterministic ERP Engine",
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
                f"⚠️ *Note:* Regular attendance is required to be eligible for university semester examinations."
            )
        return {
            "reply": reply,
            "intent": "low_attendance_subjects",
            "suggested_questions": ["How many classes should I attend to reach 75%?", "What is my timetable today?", "Which assignments are pending?"],
            "engine": "Deterministic ERP Engine",
            "model": None
        }

    # Overall attendance
    if any(k in q for k in ["attendance", "percentage", "attended", "classes"]):
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
            "suggested_questions": ["Which subjects am I below 75%?", "What are my marks & CGPA?", "What is my timetable today?"],
            "engine": "Deterministic ERP Engine",
            "model": None
        }

    # Marks & CGPA
    if any(k in q for k in ["mark", "marks", "cgpa", "gpa", "grade", "internal", "cia", "score", "quiz result"]):
        marks = db.query(models.Mark).filter(models.Mark.student_id == student.id).all()
        cgpa_str = f"**{student.cgpa:.2f}**" if student.cgpa else "Pending calculation"
        if not marks:
            reply = f"Your current Cumulative GPA is {cgpa_str}. Internal marks for current semester are not yet finalized in the ERP."
        else:
            table_lines = [
                "| Subject | CIA-1 | CIA-2 | Assignment | Total (100) | Grade |",
                "| :--- | :---: | :---: | :---: | :---: | :---: |"
            ]
            for m in marks:
                sub_name = m.subject.name if m.subject else f"Subject #{m.subject_id}"
                c1 = m.internal_1 if m.internal_1 is not None else "-"
                c2 = m.internal_2 if m.internal_2 is not None else "-"
                asg = m.assignment if m.assignment is not None else "-"
                tot = f"**{m.total}**" if m.total is not None else "-"
                grd = m.grade or "-"
                table_lines.append(f"| {sub_name} | {c1}/60 | {c2}/60 | {asg}/10 | {tot} | {grd} |")

            reply = (
                f"📊 **Academic Performance Summary for {student.name}:**\n\n"
                f"- **Cumulative GPA (CGPA):** {cgpa_str}\n\n"
                f"{chr(10).join(table_lines)}\n\n"
                f"*Note: Only marks finalized by faculty are shown above.*"
            )
        return {
            "reply": reply,
            "intent": "academic_marks",
            "suggested_questions": ["Which assignments are pending?", "What is my overall attendance?", "When is my next exam?"],
            "engine": "Deterministic ERP Engine",
            "model": None
        }

    # Assignments
    if any(k in q for k in ["assignment", "homework", "submission", "due", "deadline"]):
        assignments = db.query(models.Assignment).filter(
            models.Assignment.department_id == student.department_id,
            models.Assignment.semester == student.semester
        ).order_by(models.Assignment.due_date.asc()).all()

        pending = []
        completed = []
        for a in assignments:
            sub = db.query(models.AssignmentSubmission).filter(
                models.AssignmentSubmission.assignment_id == a.id,
                models.AssignmentSubmission.student_id == student.id
            ).first()
            sub_title = a.subject.name if a.subject else "Subject"
            if sub:
                score = f" (Score: {sub.marks_obtained}/{a.max_marks})" if sub.marks_obtained is not None else " (Pending Grading)"
                completed.append(f"- **{a.title}** ({sub_title}) — Submitted on {sub.submitted_at.strftime('%d %b %Y')}{score}")
            else:
                pending.append(f"- **{a.title}** ({sub_title}) — **Due {a.due_date.strftime('%d %b %Y')} at {a.due_time or '23:59'}** (Max Marks: {a.max_marks})")

        reply = f"📝 **Assignment Status for {student.name}:**\n\n"
        if pending:
            reply += f"**Pending Assignments ({len(pending)}):**\n" + "\n".join(pending) + "\n\n"
        else:
            reply += "✅ **No pending assignments!** All active assignments are submitted.\n\n"

        if completed:
            reply += f"**Completed Submissions ({len(completed)}):**\n" + "\n".join(completed)
        return {
            "reply": reply,
            "intent": "assignments",
            "suggested_questions": ["When is my next exam?", "What is my timetable today?", "Show my subject marks."],
            "engine": "Deterministic ERP Engine",
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
            "suggested_questions": ["When is my next exam?", "Which assignments are pending?", "What is my attendance?"],
            "engine": "Deterministic ERP Engine",
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
            "suggested_questions": ["What is my timetable today?", "Which assignments are pending?", "What are my subject marks?"],
            "engine": "Deterministic ERP Engine",
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
            fee_txt = "\n".join([f"- **{f.title}**: Total: ₹{f.total_amount:,.0f} | Paid: ₹{f.paid_amount:,.0f} | Status: **{f.status}**" for f in fees])
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
            "suggested_questions": ["What is my overall attendance?", "Which assignments are pending?", "When is my next exam?"],
            "engine": "Deterministic ERP Engine",
            "model": None
        }

    # Default reply
    return {
        "reply": (
            f"Hello **{student.name}**! I am your AI ERP Academic Assistant. I can answer verified questions about your coursework and institutional records.\n\n"
            f"Try asking:\n"
            f"- *'What is my overall attendance?'*\n"
            f"- *'Which subjects am I below 75%?'*\n"
            f"- *'What are my subject marks & CGPA?'*\n"
            f"- *'Which assignments are pending?'*\n"
            f"- *'What is my timetable today?'*\n"
            f"- *'Explain QuickSort from my course notes'*."
        ),
        "intent": "help",
        "suggested_questions": DEFAULT_SUGGESTIONS[:4],
        "engine": "Deterministic ERP Engine",
        "model": None
    }


def process_student_query(db: Session, student: models.Student, query: str) -> Dict[str, Any]:
    """
    Main entry point for student queries:
    1. Authenticates student via server-side session.
    2. Enforces strict privacy isolation (blocks cross-student private data requests).
    3. Enforces academic-only response policy (rejects unrelated entertainment/politics).
    4. Builds live student ERP context + semantic chunks from authorized student notes.
    5. Dispatches grounded prompt to Google Gemini API (with deterministic fallback).
    """
    clean_q = query.strip()

    # Rule 1: Check for Cross-Student Privacy Violation
    if is_cross_student_query(clean_q, student, db):
        logger.warning(f"Cross-student private inquiry blocked for student {student.id}")
        return {
            "reply": PRIVACY_VIOLATION_RESPONSE,
            "intent": "privacy_guard",
            "suggested_questions": [
                "What is my overall attendance?",
                "What are my subject marks & CGPA?",
                "Which assignments are pending for me?"
            ],
            "engine": "Institutional Privacy Guard",
            "model": None
        }

    # Rule 2: Academic-Only Response Policy Filter
    if is_unrelated_query(clean_q):
        return {
            "reply": NON_ACADEMIC_STANDARD_RESPONSE,
            "intent": "academic_policy_filter",
            "suggested_questions": DEFAULT_SUGGESTIONS[:4],
            "engine": "Academic Policy Filter",
            "model": None
        }

    # Rule 3: Query Google Gemini with live grounded ERP context
    gemini_key = (settings.GEMINI_API_KEY or "").strip()

    if gemini_key:
        context_str = build_student_erp_context(db, student, query=clean_q)

        system_instruction = f"""
You are the authoritative, intelligent, and supportive AI ERP Academic Assistant for {student.name} ({student.reg_no}) enrolled in {student.department.name if student.department else 'Engineering'}.
You have direct, verified access to this student's real-time institutional records provided in the context below.

STRICT OPERATIONAL & PRIVACY RULES:
1. ONLY answer questions related to the authenticated student's own academic records, coursework, syllabus doubts, attendance, marks, assignments, timetable, exams, and authorized notes.
2. For student-specific data (attendance %, marks, deadlines, timetable), cite ONLY the exact numbers present in the context. NEVER guess, estimate, or hallucinate numerical percentages, marks, or deadlines.
3. If the student asks about a concept or their uploaded notes, provide a clear, step-by-step academic explanation in simple English with practical examples. If relevant notes chunks are provided in the context, cite them.
4. If a requested detail is missing from the context (e.g. unreleased quiz marks or unannounced exams), state honestly that the information is currently unavailable in the ERP.
5. If the user asks about another student's marks or attendance, respond: "{PRIVACY_VIOLATION_RESPONSE}"
6. If the user asks about general entertainment, sports, politics, or unrelated topics, respond: "{NON_ACADEMIC_STANDARD_RESPONSE}"
7. Format answers cleanly using Markdown (bolding for key metrics, bullet points, and tables where helpful).
8. Conclude your response with exactly 3 relevant academic follow-up questions formatted as:
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
            user_query=clean_q
        )

        if gemini_reply:
            return {
                "reply": gemini_reply,
                "intent": "gemini_generative",
                "suggested_questions": suggestions,
                "engine": "Google Gemini RAG",
                "model": model_used or settings.GEMINI_MODEL
            }
        else:
            logger.warning("Gemini API call returned empty or failed. Falling back to deterministic ERP reasoning engine.")

    # Rule 4: Fallback to deterministic ERP reasoning engine
    return process_rule_based_student_query(db, student, clean_q)
