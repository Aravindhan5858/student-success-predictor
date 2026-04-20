import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel


class AcademicRecordCreate(BaseModel):
    student_id: uuid.UUID
    course_id: uuid.UUID
    semester: int
    marks: Optional[float] = None
    grade: Optional[str] = None
    attendance: Optional[float] = None


class AcademicRecordResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    course_id: uuid.UUID
    semester: int
    marks: Optional[float]
    grade: Optional[str]
    attendance: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class CSVUploadResponse(BaseModel):
    total: int
    success: int
    errors: List[str]
    job_id: Optional[str] = None


class AttendanceCreate(BaseModel):
    student_id: uuid.UUID
    course_id: uuid.UUID
    date: date
    present: bool


class AttendanceResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    course_id: uuid.UUID
    date: date
    present: bool

    model_config = {"from_attributes": True}
