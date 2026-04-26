from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.extended import CorrectionRequest
from app.models.student import Student
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


class CorrectionRequestCreate(BaseModel):
    field_name: str
    current_value: str | None = None
    requested_value: str
    reason: str


class CorrectionRequestResponse(BaseModel):
    id: uuid.UUID
    field_name: str
    current_value: str | None
    requested_value: str
    reason: str
    status: str
    reviewed_by: uuid.UUID | None
    review_note: str | None
    created_at: datetime
    reviewed_at: datetime | None

    class Config:
        from_attributes = True


@router.post("/", response_model=CorrectionRequestResponse)
def create_correction_request(
    data: CorrectionRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    correction = CorrectionRequest(
        student_id=student.id,
        field_name=data.field_name,
        current_value=data.current_value,
        requested_value=data.requested_value,
        reason=data.reason,
        status="pending"
    )
    db.add(correction)
    db.commit()
    db.refresh(correction)
    return correction


@router.get("/", response_model=List[CorrectionRequestResponse])
def list_correction_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        student = db.scalar(select(Student).where(Student.user_id == current_user.id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        corrections = db.scalars(select(CorrectionRequest).where(CorrectionRequest.student_id == student.id)).all()
    elif current_user.role in ["professor", "admin"]:
        corrections = db.scalars(select(CorrectionRequest)).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return corrections


@router.patch("/{correction_id}/review")
def review_correction_request(
    correction_id: uuid.UUID,
    status: str,
    review_note: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    correction = db.scalar(select(CorrectionRequest).where(CorrectionRequest.id == correction_id))
    if not correction:
        raise HTTPException(status_code=404, detail="Correction request not found")

    correction.status = status
    correction.reviewed_by = current_user.id
    correction.review_note = review_note
    correction.reviewed_at = datetime.utcnow()

    if status == "approved":
        student = db.scalar(select(Student).where(Student.id == correction.student_id))
        if student and hasattr(student, correction.field_name):
            setattr(student, correction.field_name, correction.requested_value)

    db.commit()
    return {"message": "Correction request reviewed"}
