import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from ..services.parser import extract_text_from_upload
from ..services.analyzer import analyze_resumes_against_job
from ..storage import Storage

router = APIRouter()

storage = Storage()


class UploadResumeResponse(BaseModel):
    resume_id: str
    filename: str
    candidate_name: str
    text_preview: str


class UploadJDResponse(BaseModel):
    jd_id: str
    filename: Optional[str] = None
    text_preview: str


class AnalyzeRequest(BaseModel):
    jd_id: str
    resume_ids: List[str]


@router.post("/upload-resumes", response_model=List[UploadResumeResponse])
async def upload_resumes(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    responses: List[UploadResumeResponse] = []
    for f in files:
        resume_id = str(uuid.uuid4())
        saved_path = storage.save_upload(resume_id, f)
        text, candidate_name = extract_text_from_upload(saved_path, f.filename)
        storage.save_resume_text(resume_id, text, candidate_name, saved_path)
        responses.append(
            UploadResumeResponse(
                resume_id=resume_id,
                filename=f.filename,
                candidate_name=candidate_name,
                text_preview=text[:500]
            )
        )
    return responses


@router.post("/upload-job-description", response_model=UploadJDResponse)
async def upload_job_description(
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
):
    if not file and not text:
        raise HTTPException(status_code=400, detail="Provide either a file or text")

    jd_id = str(uuid.uuid4())
    filename = None

    if file:
        filename = file.filename
        saved_path = storage.save_upload(jd_id, file)
        parsed_text, _ = extract_text_from_upload(saved_path, filename)
        storage.save_jd_text(jd_id, parsed_text, saved_path)
        preview = parsed_text[:1000]
    else:
        storage.save_jd_text(jd_id, text or "", None)
        preview = (text or "")[:1000]

    return UploadJDResponse(jd_id=jd_id, filename=filename, text_preview=preview)


class AnalyzeResumeResult(BaseModel):
    candidate_name: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str


@router.post("/analyze", response_model=List[AnalyzeResumeResult])
async def analyze(req: AnalyzeRequest):
    jd = storage.get_jd(req.jd_id)
    if jd is None:
        raise HTTPException(status_code=404, detail="Job description not found")

    resumes = []
    for rid in req.resume_ids:
        r = storage.get_resume(rid)
        if r is None:
            raise HTTPException(status_code=404, detail=f"Resume {rid} not found")
        resumes.append(r)

    results = analyze_resumes_against_job(jd_text=jd.text, resumes=resumes)

    # After analysis, clean up uploaded files and memory
    storage.cleanup_after_analysis(req.jd_id, req.resume_ids)

    # Adapt to expected response keys
    formatted: List[AnalyzeResumeResult] = []
    for r in results:
        formatted.append(
            AnalyzeResumeResult(
                candidate_name=r["candidate_name"],
                match_score=r["match_score"],
                matched_skills=r["matched_skills"],
                missing_skills=r["missing_skills"],
                summary=r["summary"],
            )
        )

    return formatted