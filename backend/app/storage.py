from __future__ import annotations
import os
import shutil
from typing import Dict, Optional
from fastapi import UploadFile


UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)


class Storage:
    def __init__(self) -> None:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        self.resumes: Dict[str, Dict] = {}
        self.job_descriptions: Dict[str, Dict] = {}

    def save_upload(self, item_id: str, file: UploadFile) -> str:
        safe_name = file.filename.replace("/", "_").replace("\\", "_")
        dest = os.path.join(UPLOAD_DIR, f"{item_id}__{safe_name}")
        with open(dest, "wb") as f:
            f.write(file.file.read())
        return dest

    def save_resume_text(self, resume_id: str, text: str, candidate_name: str, path: Optional[str]):
        self.resumes[resume_id] = {
            "resume_id": resume_id,
            "text": text,
            "candidate_name": candidate_name,
            "path": path,
        }

    def save_jd_text(self, jd_id: str, text: str, path: Optional[str]):
        self.job_descriptions[jd_id] = {
            "jd_id": jd_id,
            "text": text,
            "path": path,
        }

    def get_resume(self, resume_id: str) -> Optional[Dict]:
        return self.resumes.get(resume_id)

    def get_jd(self, jd_id: str) -> Optional[Dict]:
        return self.job_descriptions.get(jd_id)

    def cleanup_after_analysis(self, jd_id: str, resume_ids: list[str]):
        # Delete files on disk
        item_paths = []
        jd = self.job_descriptions.pop(jd_id, None)
        if jd and jd.get("path"):
            item_paths.append(jd["path"])
        for rid in resume_ids:
            r = self.resumes.pop(rid, None)
            if r and r.get("path"):
                item_paths.append(r["path"])
        for p in item_paths:
            try:
                os.remove(p)
            except Exception:
                pass

    def wipe_all(self):
        self.resumes.clear()
        self.job_descriptions.clear()
        try:
            shutil.rmtree(UPLOAD_DIR)
        except Exception:
            pass
        os.makedirs(UPLOAD_DIR, exist_ok=True)