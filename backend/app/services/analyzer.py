from __future__ import annotations
from typing import Dict, List
from dataclasses import dataclass
import re


@dataclass
class ResumeRecord:
    resume_id: str
    text: str
    candidate_name: str


# Lightweight static skills dictionary; extend as needed
SKILLS = {
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "node.js", "fastapi", "django", "flask", "sql", "postgresql",
    "mysql", "mongodb", "redis", "aws", "gcp", "azure", "docker", "kubernetes",
    "terraform", "git", "linux", "nlp", "machine learning", "deep learning",
    "pytorch", "tensorflow", "sklearn", "pandas", "numpy", "spark", "hadoop",
    "ci/cd", "kafka", "graphql", "rest", "microservices",
}

EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "b.sc", "b.e", "m.sc", "m.s", "m.eng", "b.tech", "m.tech",
]

EXPERIENCE_REGEX = re.compile(r"(\d+)\+?\s*(?:years|yrs)\s*(?:of)?\s*(?:experience)?", re.I)

# Lazy load model
_model = None
_st_util = None


def _get_model():
    global _model, _st_util
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer, util  # type: ignore
            _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            _st_util = util
        except Exception:
            _model = None
            _st_util = None
    return _model


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().lower()


def extract_skills(text: str) -> List[str]:
    text_l = normalize_text(text)
    found = set()
    for s in SKILLS:
        if s in text_l:
            found.add(s)
    return sorted(found)


def extract_education(text: str) -> List[str]:
    text_l = normalize_text(text)
    found = []
    for kw in EDUCATION_KEYWORDS:
        if kw in text_l:
            found.append(kw)
    return sorted(set(found))


def extract_years_experience(text: str) -> int:
    years = 0
    for m in EXPERIENCE_REGEX.finditer(text or ""):
        try:
            years = max(years, int(m.group(1)))
        except Exception:
            continue
    return years


def compute_match_score(jd_text: str, resume_text: str) -> float:
    model = _get_model()
    jd_skills = set(extract_skills(jd_text))
    res_skills = set(extract_skills(resume_text))

    try:
        if model is not None and _st_util is not None:
            jd_emb = model.encode(jd_text, convert_to_tensor=True)
            res_emb = model.encode(resume_text, convert_to_tensor=True)
            sim = _st_util.cos_sim(jd_emb, res_emb).item()  # -1..1
            sim_score = max(0.0, min(1.0, (sim + 1) / 2.0)) * 100
        else:
            # Fallback: Jaccard similarity on words as a naive proxy
            jd_words = set(normalize_text(jd_text).split())
            res_words = set(normalize_text(resume_text).split())
            inter = len(jd_words & res_words)
            union = len(jd_words | res_words) or 1
            sim_score = (inter / union) * 100
    except Exception:
        sim_score = 50.0

    if jd_skills:
        skill_recall = len(jd_skills & res_skills) / len(jd_skills)
    else:
        skill_recall = 0.5  # neutral if no skills detected in JD

    # Weighted average: 70% semantic, 30% skills recall
    final_score = 0.7 * sim_score + 0.3 * (skill_recall * 100)
    return round(final_score, 2)


def analyze_resumes_against_job(jd_text: str, resumes: List[Dict]) -> List[Dict]:
    jd_skills = extract_skills(jd_text)

    results: List[Dict] = []
    for r in resumes:
        res_text = r["text"]
        candidate_name = r["candidate_name"]
        score = compute_match_score(jd_text, res_text)
        res_skills = extract_skills(res_text)
        matched = sorted(set(jd_skills) & set(res_skills))
        missing = sorted(set(jd_skills) - set(res_skills))
        years = extract_years_experience(res_text)
        edu = extract_education(res_text)
        summary = (
            f"Skills matched: {len(matched)}. Experience: ~{years} years. "
            f"Education: {', '.join(edu) if edu else 'N/A'}."
        )
        results.append({
            "candidate_name": candidate_name,
            "match_score": score,
            "matched_skills": matched,
            "missing_skills": missing,
            "summary": summary,
        })

    # Sort by match score desc
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results