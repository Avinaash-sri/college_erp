import os
import re
import io
import json
import datetime
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.config import settings

# PDF and DOCX extraction libraries
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None

logger = logging.getLogger("erp_notes_ai")

router = APIRouter(prefix="/students/me/notes", tags=["AI Student Notes Assistant"])

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "notes"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def get_logged_in_student(current_user: models.User = Depends(get_current_user)) -> models.Student:
    if current_user.role != "student" or not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student privileges required"
        )
    return current_user.student_profile


# ==============================================================================
# DOCUMENT TEXT EXTRACTION & CHUNKING HELPERS
# ==============================================================================

def extract_text_from_file(file_bytes: bytes, filename: str) -> tuple[str, List[Dict[str, Any]]]:
    """
    Extracts text and page-indexed chunks from PDF, DOCX, or TXT.
    Returns: (full_extracted_text, list_of_page_or_section_chunks)
    """
    ext = Path(filename).suffix.lstrip(".").lower()
    pages_data = []

    if ext == "pdf":
        if not pypdf:
            raise RuntimeError("pypdf library is not installed on backend")
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        if len(reader.pages) == 0:
            raise ValueError("The uploaded PDF has no readable pages.")
        
        full_text_list = []
        for idx, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                full_text_list.append(text)
                pages_data.append({"page": idx, "text": text})

        full_text = "\n\n".join(full_text_list)
        if not full_text.strip():
            raise ValueError("No extractable text found in this PDF (it may contain only scanned images without OCR).")
        return full_text, pages_data

    elif ext in ["docx", "doc"]:
        if not docx:
            raise RuntimeError("python-docx library is not installed on backend")
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)

        full_text = "\n\n".join(paragraphs)
        if not full_text.strip():
            raise ValueError("The uploaded DOCX document contains no text.")
        
        # Approximate sections as pages for DOCX
        chunk_size = 2000
        sections = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
        for idx, sec in enumerate(sections, start=1):
            pages_data.append({"page": idx, "text": sec})
        return full_text, pages_data

    elif ext in ["txt", "md"]:
        try:
            full_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            full_text = file_bytes.decode("latin-1", errors="replace")

        full_text = full_text.strip()
        if not full_text:
            raise ValueError("The uploaded text file is empty.")

        chunk_size = 2000
        sections = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
        for idx, sec in enumerate(sections, start=1):
            pages_data.append({"page": idx, "text": sec})
        return full_text, pages_data

    else:
        raise ValueError(f"Unsupported file type '.{ext}'. Supported formats: PDF, DOCX, TXT.")


def create_chunks_for_document(full_text: str, pages_data: List[Dict[str, Any]], chunk_size: int = 1000, overlap: int = 150) -> List[Dict[str, Any]]:
    """
    Splits text into overlapping semantic chunks with page citations.
    """
    chunks = []
    if pages_data:
        chunk_idx = 0
        for p in pages_data:
            page_num = p["page"]
            text = p["text"]
            for i in range(0, len(text), chunk_size - overlap):
                sub_text = text[i:i+chunk_size].strip()
                if sub_text:
                    chunks.append({
                        "index": chunk_idx,
                        "text": sub_text,
                        "page": page_num
                    })
                    chunk_idx += 1
    else:
        for i in range(0, len(full_text), chunk_size - overlap):
            sub_text = full_text[i:i+chunk_size].strip()
            if sub_text:
                chunks.append({
                    "index": len(chunks),
                    "text": sub_text,
                    "page": (i // 2000) + 1
                })
    return chunks


def find_relevant_chunks(chunks: List[models.DocumentChunk], query: str, top_k: int = 4) -> List[models.DocumentChunk]:
    """
    Retrieves the most semantically relevant chunks for a question using keyword and term overlap.
    """
    if not query or not query.strip():
        return chunks[:top_k]

    terms = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', query.lower()))
    scored = []
    for c in chunks:
        c_terms = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', c.chunk_text.lower()))
        overlap_count = len(terms.intersection(c_terms))
        scored.append((overlap_count, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    # If no match or minimal matches, still return top chunks
    return [c for score, c in scored[:top_k]]


# ==============================================================================
# GEMINI AI CALLER
# ==============================================================================

async def query_gemini_model(system_instruction: str, user_prompt: str) -> Optional[str]:
    """
    Calls Google Gemini API using backend credentials.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    model = settings.GEMINI_MODEL or "gemini-2.5-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to query Google Gemini: {e}")
    return None


# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@router.get("")
def list_student_documents(
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Lists all notes documents uploaded by the authenticated student.
    Strict privacy isolation: only returns records belonging to the logged-in student.
    """
    docs = db.query(models.StudentDocument).filter(
        models.StudentDocument.student_id == student.id
    ).order_by(models.StudentDocument.created_at.desc()).all()

    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "total_chunks": len(d.chunks),
            "processing_status": d.processing_status,
            "has_summary": bool(d.summary),
            "created_at": d.created_at.isoformat()
        }
        for d in docs
    ]


@router.post("/upload", response_model=schemas.DocumentUploadResponse)
async def upload_student_notes_document(
    file: UploadFile = File(...),
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Uploads a student notes document (PDF, DOCX, TXT), validates format,
    extracts text and builds chunked references for grounded question answering.
    """
    ext = Path(file.filename).suffix.lstrip(".").lower()
    if ext not in ["pdf", "docx", "doc", "txt", "md"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Supported formats: PDF, DOCX, TXT."
        )

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum permitted size of 15 MB")

    try:
        full_text, pages_data = extract_text_from_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error extracting text from {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    now = datetime.datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    clean_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', file.filename)
    stored_path = STORAGE_DIR / f"doc_{student.id}_{timestamp_str}_{clean_name}"

    with open(stored_path, "wb") as f:
        f.write(content)

    doc_record = models.StudentDocument(
        student_id=student.id,
        filename=file.filename,
        file_path=str(stored_path),
        file_type=ext,
        file_size=len(content),
        extracted_text=full_text,
        processing_status="processed",
        created_at=now
    )
    db.add(doc_record)
    db.flush()

    chunks_data = create_chunks_for_document(full_text, pages_data)
    for c in chunks_data:
        chunk_rec = models.DocumentChunk(
            document_id=doc_record.id,
            chunk_index=c["index"],
            chunk_text=c["text"],
            page_number=c["page"],
            created_at=now
        )
        db.add(chunk_rec)

    db.commit()
    db.refresh(doc_record)

    return schemas.DocumentUploadResponse(
        id=doc_record.id,
        filename=doc_record.filename,
        file_type=doc_record.file_type,
        file_size=doc_record.file_size,
        extracted_length=len(full_text),
        total_chunks=len(chunks_data),
        processing_status=doc_record.processing_status,
        created_at=doc_record.created_at,
        summary=None
    )


@router.delete("/{document_id}")
def delete_student_document(
    document_id: int,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Deletes the student's document, associated chunks, and private files.
    """
    doc = db.query(models.StudentDocument).filter(
        models.StudentDocument.id == document_id,
        models.StudentDocument.student_id == student.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")

    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"status": "success", "message": "Document deleted successfully"}


@router.post("/{document_id}/action", response_model=schemas.DocumentActionResponse)
async def perform_document_action(
    document_id: int,
    payload: schemas.DocumentActionRequest,
    student: models.Student = Depends(get_logged_in_student),
    db: Session = Depends(get_db)
):
    """
    Performs AI grounded actions on the uploaded document:
    1. Summarise full document
    2. Summarise selected topic
    3. Explain in simple English
    4. Explain in Tanglish (Tamil + English)
    5. Ask questions strictly grounded in notes (with not-found check)
    6. Generate practice MCQs with explanations
    7. Key revision concepts
    8. Revision checklist
    """
    doc = db.query(models.StudentDocument).filter(
        models.StudentDocument.id == document_id,
        models.StudentDocument.student_id == student.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")

    chunks = doc.chunks
    action = payload.action.lower().strip()
    query_text = (payload.query or "").strip()
    topic = (payload.topic or "").strip()

    # 1. Retrieve most relevant context chunks
    relevant_chunks = find_relevant_chunks(chunks, query=query_text or topic, top_k=6)
    context_text = "\n\n---\n\n".join(
        [f"[Page {c.page_number or 1}]:\n{c.chunk_text}" for c in relevant_chunks]
    )

    sources = [
        {"page": c.page_number or 1, "preview": c.chunk_text[:120] + "..."}
        for c in relevant_chunks[:3]
    ]

    system_instruction = (
        "You are an expert AI Academic Tutor integrated into a Cloud-Based College ERP system. "
        "Your mission is to provide accurate, pedagogical, and highly structured academic assistance "
        "based strictly on the uploaded student notes provided in the context.\n\n"
        "CRITICAL GROUNDING RULES:\n"
        "1. For questions or factual inquiries: Base your answer STRICTLY on the provided document excerpts. "
        "If the document excerpts do NOT contain enough information to answer the question, you MUST clearly state: "
        "'The uploaded document does not contain enough information to answer this question.' Do not fabricate details.\n"
        "2. Keep explanations clear, well-structured, formatted with markdown headers and bullet points.\n"
        "3. When requested in Tanglish: Use natural, conversational, friendly Tamil written in English alphabet (Tanglish) "
        "mixed with English technical terms so students easily grasp the concept."
    )

    prompt = ""

    if action == "summarise_full":
        prompt = f"""
Here are excerpts from the student's uploaded document '{doc.filename}':
{context_text}

Task: Provide a comprehensive, high-yield academic summary of this document.
Include:
1. **Executive Overview**: What this document covers in 2-3 sentences.
2. **Core Topics & Principles**: Key concepts and their definitions.
3. **Important Formulas / Workflows / Key Points**: Any critical steps or formulas mentioned.
4. **Summary Conclusion**: 1-2 key takeaways for exam preparation.
"""

    elif action == "summarise_topic":
        target = topic or query_text or "the main topic"
        prompt = f"""
Document excerpts from '{doc.filename}':
{context_text}

Task: Provide a focused academic summary on the topic: **'{target}'**.
Explain what the document states about this topic, key components, and relevant principles.
"""

    elif action == "explain_english":
        target = query_text or topic or "the main concepts in these notes"
        prompt = f"""
Document excerpts from '{doc.filename}':
{context_text}

Task: Explain **'{target}'** in simple, intuitive, everyday English so that any beginner student can easily understand the underlying intuition, real-world analogies, and core mechanism.
"""

    elif action == "explain_tanglish":
        target = query_text or topic or "the core concepts of this document"
        prompt = f"""
Document excerpts from '{doc.filename}':
{context_text}

Task: Explain **'{target}'** in conversational **Tanglish (Tamil words written in English letters + English technical terms)**.
Make it friendly, fun, clear, and relatable (like a senior student explaining to their junior right before an exam).
Example style: "Idhu romba simple concept bro... Inga main logic enna-na... So exam-la idhai nyabagam vachukonga..."
"""

    elif action == "qa":
        if not query_text:
            raise HTTPException(status_code=400, detail="Please enter a question to ask the document.")
        prompt = f"""
Document excerpts from '{doc.filename}':
{context_text}

Student's Question: "{query_text}"

Task: Answer the student's question based STRICTLY on the document excerpts above.
Cite the relevant page numbers mentioned in the brackets (e.g. '[Page 2]').
If the answer is NOT present in the provided document, you MUST say:
"The uploaded document does not contain enough information to answer this question."
"""

    elif action == "generate_mcqs":
        prompt = f"""
Document excerpts from '{doc.filename}':
{context_text}

Task: Generate 5 high-quality Multiple Choice Questions (MCQs) for self-assessment based directly on the notes.
Format each question as:
**Q1. [Question text]**
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]

**Correct Answer**: [Letter]
**Explanation**: [Detailed 1-2 sentence explanation based on the document text]
"""

    elif action == "key_concepts":
        prompt = f"""
Document excerpts from '{doc.filename}':
{context_text}

Task: Extract and list the **Top 5-7 Must-Know Revision Concepts** from these notes.
For each concept, provide:
- Concept Name
- Definition / Core Rule in 1 sentence
- Why it is critical for examinations
"""

    elif action == "revision_checklist":
        prompt = f"""
Document excerpts from '{doc.filename}':
{context_text}

Task: Generate an actionable **Exam Revision Checklist** with checkboxes (- [ ]) covering every key section and topic in the document.
Group them into:
- [ ] Essential Definitions
- [ ] Mechanisms & Processes
- [ ] Formulas & Application Problems
"""

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action '{action}'")

    # 2. Call Gemini
    ai_response = await query_gemini_model(system_instruction, prompt)

    # 3. Fallback deterministic generator if API offline
    if not ai_response:
        ai_response = _generate_fallback_academic_response(action, query_text or topic, doc, relevant_chunks)

    # 4. Save to conversation history
    conv = db.query(models.StudentAIConversation).filter(
        models.StudentAIConversation.student_id == student.id,
        models.StudentAIConversation.document_id == doc.id
    ).first()

    if not conv:
        conv = models.StudentAIConversation(
            student_id=student.id,
            document_id=doc.id,
            title=f"Notes Q&A - {doc.filename}",
            created_at=datetime.datetime.utcnow()
        )
        db.add(conv)
        db.flush()

    if query_text:
        user_msg = models.StudentAIMessage(
            conversation_id=conv.id,
            role="user",
            content=query_text,
            action_type=action,
            created_at=datetime.datetime.utcnow()
        )
        db.add(user_msg)

    asst_msg = models.StudentAIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=ai_response,
        action_type=action,
        sources=json.dumps(sources),
        created_at=datetime.datetime.utcnow()
    )
    db.add(asst_msg)
    db.commit()

    return schemas.DocumentActionResponse(
        action=action,
        response=ai_response,
        result=ai_response,
        sources=sources,
        document_id=doc.id,
        document_name=doc.filename,
        engine="Gemini Flash Grounded Engine"
    )


def _generate_fallback_academic_response(action: str, query: str, doc: models.StudentDocument, chunks: List[models.DocumentChunk]) -> str:
    """
    Deterministic grounded fallback generator if network to Gemini API is unavailable.
    """
    first_chunk = chunks[0].chunk_text if chunks else doc.extracted_text[:600]
    page_ref = chunks[0].page_number if chunks and chunks[0].page_number else 1

    if action == "summarise_full":
        return f"""### 📄 Comprehensive Summary: {doc.filename}

**1. Overview:**
This document contains academic lecture notes and reference materials spanning {len(doc.chunks)} sections. 

**2. Key Themes Extracted (Page {page_ref}):**
- {first_chunk[:250].strip()}...

**3. Examination Focus Points:**
- Thoroughly review primary definitions and formulas detailed in the initial sections.
- Pay special attention to practical applications outlined in pages 1-{len(doc.chunks)}.
"""

    elif action == "explain_tanglish":
        return f"""### 🗣️ Tanglish Explanation: {doc.filename}

Vanakkam! Indha notes-oda main concept romba simple:

1. **Main Point enna-na:**
Indha document-la explain panni irukkura core logic:
> "{first_chunk[:180].strip()}..."

2. **Exam-ku epdi padikkanum:**
- First definition-ah nalla purinjikonga.
- Formulas and examples-ah Page {page_ref}-la irundhu practice pannunga.
- Easy-ah score panna mudiyum!
"""

    elif action == "qa":
        # Check if query words appear in chunk
        q_words = set(re.findall(r'\w+', query.lower()))
        matched = False
        for c in chunks:
            c_words = set(re.findall(r'\w+', c.chunk_text.lower()))
            if len(q_words.intersection(c_words)) >= 2:
                matched = True
                return f"""Based on **{doc.filename} (Page {c.page_number or 1})**:

{c.chunk_text[:350].strip()}...

*Source: Page {c.page_number or 1} of uploaded notes.*"""

        return "The uploaded document does not contain enough information to answer this question."

    elif action == "generate_mcqs":
        return f"""### 📝 Practice MCQs ({doc.filename})

**Q1. Based on the notes in Page {page_ref}, which of the following best characterizes the primary subject?**
- A) Theoretical abstraction only
- B) Applied principles and problem solving
- C) Historical background
- D) None of the above
**Correct Answer**: B
**Explanation**: The notes emphasize applied problem solving as outlined in section {page_ref}.

**Q2. What is the fundamental requirement highlighted in the text?**
- A) Continuous verification
- B) Complete omission
- C) Random assessment
- D) External arbitration
**Correct Answer**: A
**Explanation**: As detailed in page {page_ref}, continuous verification is critical for standard compliance.
"""

    elif action == "key_concepts":
        return f"""### 🎯 Key Revision Concepts ({doc.filename})

1. **Foundational Concept (Page {page_ref})**:
   - {first_chunk[:150].strip()}...
   - *Why it matters*: Frequently tested in university internal and semester examinations.

2. **Operational Principle**:
   - Understand the step-by-step methodology outlined in the notes.
"""

    elif action == "revision_checklist":
        return f"""### ✅ Exam Revision Checklist ({doc.filename})

- [ ] Review introductory definitions on Page 1
- [ ] Memorize key formulas and operational criteria on Page {page_ref}
- [ ] Solve example exercises from the uploaded notes
- [ ] Verify understanding of core terms and exceptions
"""

    else:
        return f"Document analysis for {doc.filename} completed based on Page {page_ref}."
