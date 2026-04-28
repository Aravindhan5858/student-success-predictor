import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.student import RiskLevel


class StudentCreate(BaseModel):
    student_id: str
    department: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = 0.0
    attendance_pct: Optional[float] = 0.0


class StudentUpdate(BaseModel):
    department: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    attendance_pct: Optional[float] = None
    risk_level: Optional[RiskLevel] = None


class StudentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    student_id: str
    department: Optional[str]
    year: Optional[int]
    semester: Optional[int]
    cgpa: Optional[float]
    attendance_pct: Optional[float]
    risk_level: RiskLevel
    created_at: datetime

    model_config = {"from_attributes": True}


class AcademicRecordBrief(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    semester: int
    marks: Optional[float]
    grade: Optional[str]
    attendance: Optional[float]

    model_config = {"from_attributes": True}


class StudentDetailResponse(StudentResponse):
    academic_records: List[AcademicRecordBrief] = []
