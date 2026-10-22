import json
import datetime
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "notes"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

def seed_enhancement_data(db: Optional[Session] = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Check if already seeded
        if db.query(models.Quiz).first():
            print("[SEED_ENHANCEMENT] Quiz and Assignment enhancement records already present.")
            return

        print("[SEED_ENHANCEMENT] Seeding realistic sample quizzes, assignments, announcements & notes...")

        fac = db.query(models.Faculty).first()
        dept = db.query(models.Department).filter(models.Department.code == "CSE").first()
        sub = db.query(models.Subject).filter(models.Subject.code == "CS601").first()
        admin = db.query(models.User).filter(models.User.role == "admin").first()
        students = db.query(models.Student).filter(models.Student.department_id == (dept.id if dept else 1)).all()

        if not fac or not sub or not dept or not students:
            print("[SEED_ENHANCEMENT] Core faculty/subjects/students not found. Skipping.")
            return

        now = datetime.datetime.utcnow()
        future_deadline = now + datetime.timedelta(days=7)

        # 1. Sample Quiz: "Data Structures & Tree Algorithms Quiz 1"
        quiz = models.Quiz(
            title="Data Structures: Trees, Graphs & Algorithm Complexity",
            description="Departmental assessment covering Binary Search Trees, AVL rotations, and time complexity analysis.",
            subject_id=sub.id,
            faculty_id=fac.id,
            department_id=dept.id,
            academic_year="2025-2026",
            semester=6,
            section="A",
            duration_minutes=25,
            total_marks=10.0,
            start_time=now,
            deadline=future_deadline,
            status="published",
            results_published=True,
            allow_multiple_attempts=False,
            max_attempts=1,
            created_at=now,
            updated_at=now
        )
        db.add(quiz)
        db.flush()

        # Quiz Questions
        q1_opts = [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(log n)"},
            {"id": "C", "text": "O(n)"},
            {"id": "D", "text": "O(n log n)"}
        ]
        q1 = models.QuizQuestion(
            quiz_id=quiz.id,
            question_text="What is the worst-case search time complexity in a standard unbalanced Binary Search Tree (BST)?",
            question_type="mcq",
            marks=2.5,
            order=1,
            options=json.dumps(q1_opts),
            correct_answer="C",
            explanation="In the worst case (skewed tree resembling a linked list), searching a BST requires inspecting all n nodes, yielding O(n) complexity."
        )

        q2_opts = [
            {"id": "A", "text": "-1, 0, or 1"},
            {"id": "B", "text": "-2, 0, or 2"},
            {"id": "C", "text": "Strictly 0"},
            {"id": "D", "text": "Any positive integer"}
        ]
        q2 = models.QuizQuestion(
            quiz_id=quiz.id,
            question_text="In an AVL Tree, what are the allowed balance factor values for every node?",
            question_type="mcq",
            marks=2.5,
            order=2,
            options=json.dumps(q2_opts),
            correct_answer="A",
            explanation="By definition, an AVL tree maintains a balance factor of height(left) - height(right) within {-1, 0, +1} for every node."
        )

        q3_opts = [
            {"id": "A", "text": "Breadth-First Search uses a Stack"},
            {"id": "B", "text": "Depth-First Search uses a Queue"},
            {"id": "C", "text": "Dijkstra's algorithm cannot handle negative edge weights"},
            {"id": "D", "text": "Prim's algorithm finds the shortest path between two specific vertices"}
        ]
        q3 = models.QuizQuestion(
            quiz_id=quiz.id,
            question_text="Which of the following statements regarding Graph Algorithms is TRUE?",
            question_type="mcq",
            marks=2.5,
            order=3,
            options=json.dumps(q3_opts),
            correct_answer="C",
            explanation="Dijkstra's greedy algorithm assumes non-negative weights and may yield incorrect shortest paths if negative weight cycles or edges exist."
        )

        q4_opts = [
            {"id": "A", "text": "O(1) auxiliary space"},
            {"id": "B", "text": "Stable sorting property"},
            {"id": "C", "text": "Guaranteed O(n log n) worst-case time"},
            {"id": "D", "text": "Adaptive behavior on pre-sorted data"}
        ]
        q4 = models.QuizQuestion(
            quiz_id=quiz.id,
            question_text="What is the main theoretical advantage of Merge Sort over standard Quick Sort?",
            question_type="mcq",
            marks=2.5,
            order=4,
            options=json.dumps(q4_opts),
            correct_answer="C",
            explanation="Merge Sort strictly divides the array in half at each step, guaranteeing O(n log n) even in the worst case, unlike Quick Sort which degrades to O(n^2) on bad pivots."
        )
        db.add_all([q1, q2, q3, q4])

        # Assign to students
        for s in students:
            db.add(models.QuizAssignment(
                quiz_id=quiz.id,
                student_id=s.id,
                is_excluded=False,
                created_at=now
            ))

        # Sample submitted attempt for Aarav (first student)
        if students:
            first_std = students[0]
            attempt = models.QuizAttempt(
                quiz_id=quiz.id,
                student_id=first_std.id,
                attempt_number=1,
                started_at=now - datetime.timedelta(hours=2),
                submitted_at=now - datetime.timedelta(hours=1, minutes=40),
                status="submitted",
                score=10.0,
                total_marks=10.0,
                feedback="Excellent performance!"
            )
            db.add(attempt)
            db.flush()

            for q, choice in [(q1, "C"), (q2, "A"), (q3, "C"), (q4, "C")]:
                db.add(models.QuizAnswer(
                    attempt_id=attempt.id,
                    question_id=q.id,
                    selected_answer=choice,
                    is_correct=True,
                    marks_awarded=2.5,
                    evaluated_at=now - datetime.timedelta(hours=1, minutes=40)
                ))

        # 2. Sample Assignment: "Data Structures Mini-Project: Balanced AVL Search Engine"
        asgn = models.Assignment(
            subject_id=sub.id,
            department_id=dept.id,
            semester=6,
            section="A",
            title="Mini-Project: Balanced AVL Tree & Indexed Search Engine",
            description="Implement a complete self-balancing AVL Tree in C++ or Python with insert, delete, and range query capabilities. Include comprehensive unit test cases and time complexity benchmark report.",
            due_date=(now + datetime.timedelta(days=4)).date(),
            due_time="23:59",
            max_marks=20.0,
            allowed_file_types="pdf,docx,zip,txt",
            max_file_size_mb=10,
            submission_format="both",
            allow_resubmission=True,
            allow_late=True,
            status="published",
            reminder_interval_minutes=60,
            created_by=fac.id,
            created_at=now
        )
        db.add(asgn)
        db.flush()

        for s in students:
            # Everyone is eligible; Vikram has no submission so he shows PENDING in RED!
            elig = models.AssignmentEligibility(
                assignment_id=asgn.id,
                student_id=s.id,
                is_excluded=False,
                last_reminder_sent_at=now - datetime.timedelta(hours=1),
                next_reminder_at=now + datetime.timedelta(hours=1),
                reminder_count=1,
                created_at=now
            )
            db.add(elig)

        # First student (Aarav) submitted
        if len(students) >= 1:
            sub_rec = models.AssignmentSubmission(
                assignment_id=asgn.id,
                student_id=students[0].id,
                submission_type="drive_link",
                drive_link="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ",
                status="Submitted",
                submitted_at=now - datetime.timedelta(hours=5),
                marks_obtained=None,
                faculty_feedback=None,
                version=1
            )
            db.add(sub_rec)

        # 3. Sample Admin Announcements
        if admin:
            ann1 = models.Announcement(
                title="INVENTO 2026: National Level Technical Symposium",
                description="The Department of Computer Science & Engineering is organizing INVENTO 2026 featuring Hackathons, Paper Presentations, Algorithmic Coding Contests, and AI workshops. Cash prizes worth ₹1,50,000!",
                category="Symposium",
                poster_url="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                event_date=(now + datetime.timedelta(days=14)).date(),
                registration_url="https://invento2026.college.edu/register",
                audience_type="all",
                status="published",
                created_by=admin.id,
                created_at=now,
                published_at=now
            )
            db.add(ann1)
            db.flush()

            ann2 = models.Announcement(
                title="Mid-Semester Examination Schedule & Hall Guidelines",
                description="The revised timetable for Term 2 Mid-Semester Examinations has been published. All students must bring physical identity cards. Electronic smart watches and unauthorized devices are strictly prohibited in the exam hall.",
                category="Exam Schedule",
                poster_url=None,
                event_date=(now + datetime.timedelta(days=10)).date(),
                registration_url=None,
                audience_type="all",
                status="published",
                created_by=admin.id,
                created_at=now - datetime.timedelta(hours=12),
                published_at=now - datetime.timedelta(hours=12)
            )
            db.add(ann2)
            db.flush()

            # Create notification records for each student
            for s in students:
                db.add(models.Notification(
                    user_id=s.user_id,
                    announcement_id=ann1.id,
                    title=ann1.title,
                    message=ann1.description[:140] + "...",
                    type="Symposium",
                    is_read=False,
                    is_cleared=False,
                    created_at=now
                ))
                db.add(models.Notification(
                    user_id=s.user_id,
                    announcement_id=ann2.id,
                    title=ann2.title,
                    message=ann2.description[:140] + "...",
                    type="Exam Schedule",
                    is_read=False,
                    is_cleared=False,
                    created_at=now - datetime.timedelta(hours=12)
                ))

        # 4. Sample Notes Document for Student
        if students:
            std = students[0]
            notes_content = """# OPERATING SYSTEMS LECTURE NOTES: CONCURRENCY, DEADLOCKS AND SYNCHRONIZATION

## Chapter 1: The Critical Section Problem
In concurrent programming, a critical section refers to a piece of code that accesses shared resources, such as variables, memory buffers, or peripheral devices. If multiple concurrent threads execute the critical section simultaneously, unpredictable race conditions occur.

### Three Mandatory Criteria for Any Critical Section Solution:
1. Mutual Exclusion: If thread T1 is executing in its critical section, no other thread can execute in their critical section simultaneously.
2. Progress: If no thread is executing in its critical section and there are threads that wish to enter, only those threads not in their remainder section can participate in the decision, and this selection cannot be postponed indefinitely.
3. Bounded Waiting: There must be a limit on the number of times other threads are allowed to enter their critical sections after a thread has made a request to enter and before that request is granted.

## Chapter 2: Semaphores & Mutex Locks
A Semaphore S is an integer variable accessed only through two standard atomic operations: wait() (also called P) and signal() (also called V).
- wait(S): Decrements S. If S becomes negative, the calling process is suspended on the semaphore's waiting queue.
- signal(S): Increments S. If there are waiting processes, one is unblocked and moved to the ready queue.

## Chapter 3: Deadlock Characterization
A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process in the set.

### Coffman's Four Necessary Conditions for Deadlock:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be currently holding at least one resource and requesting additional resources that are held by other processes.
3. No Preemption: Resources cannot be forcibly preempted from a process; they can only be released voluntarily after the process has completed its task.
4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain (P0 waits for P1, P1 waits for P2, ..., Pn waits for P0).

## Chapter 4: Deadlock Avoidance - Banker's Algorithm
Developed by Edsger Dijkstra, the Banker's Algorithm ensures that the system will never enter an unsafe state. A state is safe if there exists a safe sequence of processes <P1, P2, ..., Pn> such that for each Pi, the resources that Pi can still request can be satisfied by currently available resources plus resources held by all prior Pj (where j < i).

If a process requests resources and granting them leads to an unsafe state, the process must wait, even if the requested resources are physically available!
"""
            storage_path = STORAGE_DIR / f"doc_{std.id}_sample_os_concurrency.txt"
            with open(storage_path, "w", encoding="utf-8") as f:
                f.write(notes_content)

            sample_doc = models.StudentDocument(
                student_id=std.id,
                filename="Unit-3_Operating_Systems_Concurrency_and_Deadlocks.txt",
                file_path=str(storage_path),
                file_type="txt",
                file_size=len(notes_content.encode("utf-8")),
                extracted_text=notes_content,
                summary="Lecture notes covering Critical Section Criteria, Semaphores, Coffman's 4 Deadlock Conditions, and Dijkstra's Banker's Algorithm.",
                processing_status="processed",
                created_at=now
            )
            db.add(sample_doc)
            db.flush()

            # Add chunks
            chunks_text = [
                (1, notes_content[:1000], 1),
                (2, notes_content[850:1850], 2),
                (3, notes_content[1700:], 3)
            ]
            for idx, text_block, pg in chunks_text:
                db.add(models.DocumentChunk(
                    document_id=sample_doc.id,
                    chunk_index=idx,
                    chunk_text=text_block,
                    page_number=pg,
                    created_at=now
                ))

        db.commit()
        print("[SEED_ENHANCEMENT] Enhancement records successfully seeded!")

    except Exception as e:
        db.rollback()
        print(f"[SEED_ENHANCEMENT] Error seeding enhancements: {e}")
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    seed_enhancement_data()
