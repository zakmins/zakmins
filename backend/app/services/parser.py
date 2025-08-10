from __future__ import annotations
import os
import re
from typing import Tuple

import fitz  # PyMuPDF
from docx import Document


def extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    texts = []
    try:
        for page in doc:
            texts.append(page.get_text())
    finally:
        doc.close()
    return "\n".join(texts)


def extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text_from_upload(path: str, original_filename: str) -> Tuple[str, str]:
    ext = os.path.splitext(original_filename)[1].lower()
    text = ""
    if ext == ".pdf":
        text = extract_text_from_pdf(path)
    elif ext in (".docx", ".doc"):
        # python-docx does not support .doc (binary), but attempt anyway
        try:
            text = extract_text_from_docx(path)
        except Exception:
            text = ""
    else:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception:
            text = ""

    text = text or ""

    candidate_name = infer_candidate_name(text, original_filename)
    return text, candidate_name


def infer_candidate_name(text: str, filename: str) -> str:
    # Try to infer from first lines
    for line in text.splitlines()[:10]:
        cleaned = line.strip()
        if 2 <= len(cleaned.split()) <= 5 and cleaned.isascii():
            if re.search(r"[A-Za-z]", cleaned):
                return cleaned
    # Fallback to filename without extension
    base = os.path.splitext(os.path.basename(filename))[0]
    base = re.sub(r"[_\-]+", " ", base).strip()
    return base or "Unknown Candidate"