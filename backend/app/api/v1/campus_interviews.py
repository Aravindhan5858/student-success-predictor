from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.extended import Interview, InterviewApplication
from app.models.student import Student
from app.services.cloudinary_service import upload_file
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


class InterviewCreate(BaseModel):
    company_name: str
    role: str
    ctc: float | None = None
    job_description: str | None = None
    link: str | None = None
    department: str | None = None


class InterviewResponse(BaseModel):
    id: uuid.UUID
    company_name: str
    role: str
    ctc: float | None
    job_description: str | None
    link: str | None
    department: str | None
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=InterviewResponse)
def create_interview(
    data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    interview = Interview(
        company_name=data.company_name,
        role=data.role,
        ctc=data.ctc,
        job_description=data.job_description,
        link=data.link,
        department=data.department,
        created_by=current_user.id
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.get("/", response_model=List[InterviewResponse])
def list_interviews(
    department: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Interview)
    if department:
        query = query.where(Interview.department == department)
    interviews = db.scalars(query).all()
    return interviews


@router.post("/{interview_id}/apply")
async def apply_to_interview(
    interview_id: uuid.UUID,
    resume: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    interview = db.scalar(select(Interview).where(Interview.id == interview_id))
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    existing = db.scalar(
        select(InterviewApplication).where(
            InterviewApplication.interview_id == interview_id,
            InterviewApplication.student_id == student.id
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")

    resume_url = None
    if resume:
        resume_url = await upload_file(resume, folder="resumes")

    application = InterviewApplication(
        interview_id=interview_id,
        student_id=student.id,
        resume_url=resume_url,
        is_interested=True
    )
    db.add(application)
    db.commit()
    return {"message": "Application submitted"}


@router.get("/{interview_id}/applications")
def get_interview_applications(
    interview_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    applications = db.scalars(
        select(InterviewApplication).where(InterviewApplication.interview_id == interview_id)
    ).all()
    return applications
