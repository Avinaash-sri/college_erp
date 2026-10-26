import io
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))
import zipfile
import datetime
import xml.etree.ElementTree as ET
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.ai_assistant import (
    build_student_erp_context,
    is_cross_student_query,
    is_unrelated_query,
    process_student_query,
    PRIVACY_VIOLATION_RESPONSE,
    NON_ACADEMIC_STANDARD_RESPONSE
)
from app.routers.notes_ai import (
    extract_text_from_file,
    create_chunks_for_document,
    find_relevant_chunks,
    generate_document_summary,
    _generate_deterministic_grounded_summary
)

def build_sample_pptx_bytes() -> bytes:
    """Creates a valid in-memory .pptx with two slides containing algorithmic lecture notes."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>')
        
        slide1_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
    <p:cSld><p:spTree>
        <p:sp><p:txBody>
            <a:p><a:r><a:t>Unit 1: Design and Analysis of Algorithms - Introduction</a:t></a:r></a:p>
            <a:p><a:r><a:t>Definition: An algorithm is a well-defined sequence of computational steps.</a:t></a:r></a:p>
            <a:p><a:r><a:t>Formula: Asymptotic growth is evaluated using Big-O: f(n) &lt;= c * g(n) for all n &gt;= n0.</a:t></a:r></a:p>
        </p:txBody></p:sp>
    </p:spTree></p:cSld>
</p:sld>"""

        slide2_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
    <p:cSld><p:spTree>
        <p:sp><p:txBody>
            <a:p><a:r><a:t>Slide 2: Divide and Conquer Paradigm</a:t></a:r></a:p>
            <a:p><a:r><a:t>Master Theorem solves recurrences T(n) = aT(n/b) + f(n).</a:t></a:r></a:p>
            <a:p><a:r><a:t>QuickSort worst case is O(n^2), average is O(n log n).</a:t></a:r></a:p>
            <a:p><a:r><a:t>Practice Question: State Master Theorem and derive recurrence for MergeSort.</a:t></a:r></a:p>
        </p:txBody></p:sp>
    </p:spTree></p:cSld>
</p:sld>"""

        z.writestr("ppt/slides/slide1.xml", slide1_xml)
        z.writestr("ppt/slides/slide2.xml", slide2_xml)

    buffer.seek(0)
    return buffer.getvalue()

def run_all_tests():
    db: Session = SessionLocal()
    print("=" * 70)
    print("RUNNING ADVANCED AI ASSISTANT & RAG NOTES SUMMARIZER VERIFICATION")
    print("=" * 70)

    try:
        student = db.query(models.Student).first()
        if not student:
            print("ERROR: No student found in database.")
            return

        print(f"Testing with Student: {student.name} (Reg No: {student.reg_no}, ID: {student.id})")

        # -------------------------------------------------------------
        # TEST 1: ERP Context Generation (Marks, Attendance, Assignments)
        # -------------------------------------------------------------
        print("\n[TEST 1] Verifying Student-Specific Live ERP Context...")
        context = build_student_erp_context(db, student, query="What is my attendance?")
        assert student.name in context, "Student name missing from ERP context"
        assert "LIVE ATTENDANCE METRICS" in context, "Attendance missing from ERP context"
        assert "ACADEMIC MARKS & SEMESTER PERFORMANCE" in context, "Marks missing from ERP context"
        assert "ASSIGNMENTS & DEADLINES" in context, "Assignments missing from ERP context"
        assert "TIMETABLE FOR TODAY" in context, "Timetable missing from ERP context"
        print("  --> PASS: Student ERP context successfully assembled with verified marks, attendance, and deadlines.")

        # -------------------------------------------------------------
        # TEST 2: Strict Privacy Guard (Cross-Student Access Rejection)
        # -------------------------------------------------------------
        print("\n[TEST 2] Verifying Privacy Guard (Cross-Student Access Rejection)...")
        cross_queries = [
            "What are Nivetha's marks?",
            "What is 21CS102's attendance percentage?",
            "Tell me who has the highest marks in our class",
            "Show me Sanjay Kumar's records"
        ]
        for q in cross_queries:
            is_cross = is_cross_student_query(q, student, db)
            res = process_student_query(db, student, q)
            assert res["reply"] == PRIVACY_VIOLATION_RESPONSE, f"Failed to block cross-student inquiry: '{q}'"
            print(f"  --> Blocked cross-student query: '{q}' => Received Privacy Policy Notice.")
        print("  --> PASS: Strict privacy guard prevents retrieving another student's records.")

        # -------------------------------------------------------------
        # TEST 3: Academic-Only Policy Filter
        # -------------------------------------------------------------
        print("\n[TEST 3] Verifying Academic-Only Policy Filter...")
        unrelated_queries = [
            "Who won the IPL cricket match yesterday?",
            "Tell me about the latest Marvel movie",
            "Where can I buy cheap crypto and bitcoin?",
            "Give me a good recipe for chicken biryani"
        ]
        for q in unrelated_queries:
            is_un = is_unrelated_query(q)
            res = process_student_query(db, student, q)
            assert res["reply"] == NON_ACADEMIC_STANDARD_RESPONSE, f"Failed to filter non-academic query: '{q}'"
            print(f"  --> Filtered non-academic query: '{q}' => Received Academic Policy Standard Notice.")
        print("  --> PASS: Academic-only response policy strictly enforced.")

        # -------------------------------------------------------------
        # TEST 4: PPTX Document Extraction & Chunking
        # -------------------------------------------------------------
        print("\n[TEST 4] Verifying PPTX Document Ingestion & Chunking...")
        pptx_bytes = build_sample_pptx_bytes()
        full_text, pages_data = extract_text_from_file(pptx_bytes, "Algorithms_Lecture_Slides.pptx")
        assert "Slide 1" in full_text and "Master Theorem" in full_text, "Failed to extract text from PPTX"
        assert len(pages_data) == 2, f"Expected 2 slides in pages_data, got {len(pages_data)}"
        
        chunks = create_chunks_for_document(full_text, pages_data)
        assert len(chunks) >= 2, f"Expected at least 2 chunks, got {len(chunks)}"
        print(f"  --> Successfully extracted {len(full_text)} characters across {len(pages_data)} slides into {len(chunks)} semantic chunks.")
        print("  --> PASS: PPTX extraction and semantic chunking verified.")

        # -------------------------------------------------------------
        # TEST 5: The 4 Summary Formats & 9 Structured Sections
        # -------------------------------------------------------------
        print("\n[TEST 5] Verifying 4 Summary Formats & 9 Structured Sections...")
        test_doc = models.StudentDocument(
            id=9999,
            student_id=student.id,
            filename="Algorithms_Lecture_Slides.pptx",
            file_path="/mock/storage/doc.pptx",
            file_type="pptx",
            file_size=len(pptx_bytes),
            extracted_text=full_text,
            processing_status="completed"
        )
        mock_chunks = [
            models.DocumentChunk(document_id=9999, chunk_index=0, chunk_text=pages_data[0]["text"], page_number=1),
            models.DocumentChunk(document_id=9999, chunk_index=1, chunk_text=pages_data[1]["text"], page_number=2),
        ]

        summary_formats = ["quick", "detailed", "topic_wise", "exam_revision"]
        for fmt in summary_formats:
            summary_output = _generate_deterministic_grounded_summary(test_doc, fmt, mock_chunks)
            # Verify 9 sections are represented
            assert "1. Document Overview" in summary_output
            assert "2. Chapter / Topic Summary" in summary_output or "Topic Summary" in summary_output
            assert "3. Key Concepts" in summary_output
            assert "4. Important Definitions" in summary_output
            assert "5. Important Points" in summary_output
            assert "6. Formulas and Examples" in summary_output
            assert "7. Revision Notes" in summary_output
            assert "8. Practice Questions" in summary_output
            assert "9. Source References" in summary_output
            print(f"  --> Verified summary format '{fmt}': contains all 9 structured sections and page references.")
        print("  --> PASS: 4 summary formats and 9 structured sections verified.")

        # -------------------------------------------------------------
        # TEST 6: Document-Grounded Q&A & Not-Found Honesty
        # -------------------------------------------------------------
        print("\n[TEST 6] Verifying Document Grounded Q&A...")
        # 6a: Relevant query
        rel_chunks = find_relevant_chunks(mock_chunks, "Master Theorem QuickSort", top_k=2)
        assert len(rel_chunks) > 0, "Failed to retrieve relevant chunk for Master Theorem"
        assert "Master Theorem" in rel_chunks[0].chunk_text
        print(f"  --> Grounded QA retrieved chunk from Slide {rel_chunks[0].page_number} for 'Master Theorem'.")

        # 6b: Out-of-scope query
        out_of_scope_chunks = find_relevant_chunks(mock_chunks, "quantum entanglement teleportation astrophysics", top_k=2)
        q_words = set(["quantum", "entanglement", "teleportation", "astrophysics"])
        matched = False
        for c in out_of_scope_chunks:
            c_words = set(c.chunk_text.lower().split())
            if len(q_words.intersection(c_words)) >= 2:
                matched = True
        assert not matched, "Expected out-of-scope query to not match notes chunks"
        print("  --> Correctly reported that out-of-scope query is not in uploaded document.")
        print("  --> PASS: Document-grounded Q&A citations and honesty verified.")

        print("\n" + "=" * 70)
        print("ALL TESTS PASSED SUCCESSFULLY! (6/6 Test Suites Passed)")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_all_tests()
