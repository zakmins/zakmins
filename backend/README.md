# Resume Analyzer Backend (FastAPI)

## Setup

1. Create virtual environment and install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Note: The `sentence-transformers` model will be downloaded on first run.

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health check: `GET /health`
- Endpoints:
  - `POST /upload-resumes` (multipart form): `files`[] of PDF/DOCX
  - `POST /upload-job-description` (multipart form): either `file` (PDF/DOCX) or `text` (string)
  - `POST /analyze` (JSON): `{ "jd_id": string, "resume_ids": string[] }`

Uploads are stored under `app/uploads/` temporarily and are deleted after `/analyze` completes.