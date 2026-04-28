import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.models.assessment import AssessmentType


class AssessmentCreate(BaseModel):
    title: str
    type: AssessmentType
    questions: List[Dict[str, Any]]
    duration_mins: int = 60


class AssessmentResponse(BaseModel):
    id: uuid.UUID
    title: str
    type: AssessmentType
    created_by: uuid.UUID
    questions: List[Dict[str, Any]]
    duration_mins: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TestResultCreate(BaseModel):
    score: float
    max_score: float
    answers: Optional[Dict[str, Any]] = None


class TestResultResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    assessment_id: uuid.UUID
    score: float
    max_score: float
    answers: Optional[Dict[str, Any]]
    completed_at: datetime

    model_config = {"from_attributes": True}
