import json
from dataclasses import dataclass

import google.generativeai as genai

from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)


@dataclass
class ResumeScoreResult:
    score: float
    summary: str


def _fallback_summary(resume_text: str) -> ResumeScoreResult:
    length_score = min(max(len(resume_text) // 80, 20), 75) if resume_text else 25
    summary = (
        "Resume analysis fallback used. Add concise experience bullets, measurable impact, "
        "and a clearer skills/projects section for a higher score."
    )
    return ResumeScoreResult(score=float(length_score), summary=summary)


def analyze_resume_text(resume_text: str, profile_context: str = "") -> ResumeScoreResult:
    if not settings.GEMINI_API_KEY:
        return _fallback_summary(resume_text)

    prompt = f"""
You are a resume reviewer. Score the resume from 0 to 100.
Return ONLY compact JSON with keys: score (number), summary (string).

Profile context:
{profile_context}

Resume content:
{resume_text[:10000]}
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        result = model.generate_content(prompt)
        text = (result.text or "").strip()
        data = json.loads(text)
        score = float(data.get("score", 0))
        summary = str(data.get("summary", "")).strip() or "No summary returned from AI."
        score = max(0.0, min(100.0, score))
        return ResumeScoreResult(score=score, summary=summary)
    except Exception:
        return _fallback_summary(resume_text)
