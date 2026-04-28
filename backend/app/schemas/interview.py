import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.models.interview import InterviewType, InterviewStatus


class InterviewSessionCreate(BaseModel):
    type: InterviewType = InterviewType.text
    questions: List[Dict[str, Any]] = []


class InterviewSessionResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    type: InterviewType
    questions: List[Dict[str, Any]]
    responses: Optional[List[Dict[str, Any]]]
    feedback: Optional[Dict[str, Any]]
    score: Optional[float]
    status: InterviewStatus
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class InterviewFeedback(BaseModel):
    overall_score: float
    strengths: List[str]
    improvements: List[str]
    recommendation: str
    detailed_feedback: Optional[Dict[str, Any]] = None


class InterviewRespondRequest(BaseModel):
    responses: List[Dict[str, Any]]
