from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import google.generativeai as genai

from app.api.deps import get_db, get_current_active_user
from app.config import settings
from app.models.user import User
from app.models.student import Student
from app.models.profile import StudentMetrics

genai.configure(api_key=settings.GEMINI_API_KEY)

router = APIRouter()

_DEFAULT_ACTIONS = ["Start Mock Test", "Browse Q&A", "View Resources"]


class ChatIn(BaseModel):
    message: str


class ChatOut(BaseModel):
    response: str
    suggested_actions: List[str]


def _build_system_prompt(user: User, db: Session) -> str:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        return (
            "You are a helpful academic assistant for a student success platform. "
            "Give friendly, encouraging advice about studying, mock tests, and Q&A forums."
        )

    metrics = db.query(StudentMetrics).filter(StudentMetrics.student_id == student.id).first()
    if not metrics:
        return (
            f"You are a helpful academic assistant. The student's name is {user.full_name}. "
            "Give friendly, personalized advice about studying, mock tests, and Q&A forums."
        )

    weak_areas = ", ".join(metrics.weaknesses) if metrics.weaknesses else "none identified"
    risk = "high" if (metrics.risk_score or 0) >= 0.7 else "medium" if (metrics.risk_score or 0) >= 0.4 else "low"

    return (
        f"You are a friendly academic coach for {user.full_name}. "
        f"Their current GPA is {metrics.gpa or 'unknown'}, risk level is {risk}, "
        f"and weak areas include: {weak_areas}. "
        "Provide personalized, encouraging tips. Suggest taking mock tests to improve weak areas "
        "and browsing Q&A threads for peer support. Keep responses concise and actionable."
    )


@router.post("/chatbot/message", response_model=ChatOut)
def chat(
    data: ChatIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    system_prompt = _build_system_prompt(current_user, db)
    try:
        model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview",
            system_instruction=system_prompt,
        )
        result = model.generate_content(data.message)
        response_text = result.text
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    # Extract suggested actions from response or use defaults
    actions = _DEFAULT_ACTIONS[:]
    lower = response_text.lower()
    if "mock test" in lower:
        actions = ["Start Mock Test"] + [a for a in _DEFAULT_ACTIONS if a != "Start Mock Test"]
    elif "q&a" in lower or "question" in lower:
        actions = ["Browse Q&A"] + [a for a in _DEFAULT_ACTIONS if a != "Browse Q&A"]

    return ChatOut(response=response_text, suggested_actions=actions)
