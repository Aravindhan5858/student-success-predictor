from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from app.api.deps import get_db, get_current_active_user, require_professor
from app.models.user import User, UserRole
from app.models.extended import Interview, InterviewApplication
from app.models.student import Student
from app.services.cloudinary_service import upload_file
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


def _prof_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


class InterviewCreate(BaseModel):
    company_name: str
    role: str
    ctc: Optional[float] = None
    job_description: Optional[str] = None
    link: Optional[str] = None
    department: Optional[str] = None


class InterviewResponse(BaseModel):
    id: uuid.UUID
    company_name: str
    role: str
    ctc: float | None
    job_description: str | None
    link: str | None
    department: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewUpdate(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    ctc: Optional[float] = None
    job_description: Optional[str] = None
    link: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None


class ApplicationStatusIn(BaseModel):
    status: str


@router.post("/", response_model=InterviewResponse)
def create_interview(
    data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_prof_or_admin),
):
    interview = Interview(
        company_name=data.company_name,
        role=data.role,
        ctc=data.ctc,
        job_description=data.job_description,
        link=data.link,
        department=data.department,
        status="open",
        created_by=current_user.id,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.get("/", response_model=List[InterviewResponse])
def list_interviews(
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Interview)
    if department:
        query = query.where(Interview.department == department)
    if status:
        query = query.where(Interview.status == status)
    return db.scalars(query).all()


@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: uuid.UUID,
    data: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_prof_or_admin),
):
    interview = db.scalar(select(Interview).where(Interview.id == interview_id))
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(interview, field, value)
    db.commit()
    db.refresh(interview)
    return interview


@router.post("/{interview_id}/close")
def close_interview(
    interview_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(_prof_or_admin),
):
    interview = db.scalar(select(Interview).where(Interview.id == interview_id))
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    interview.status = "closed"
    db.commit()
    return {"status": "closed"}


@router.post("/{interview_id}/apply")
async def apply_to_interview(
    interview_id: uuid.UUID,
    resume: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Students only")

    student = db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    interview = db.scalar(select(Interview).where(Interview.id == interview_id))
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    existing = db.scalar(
        select(InterviewApplication).where(
            InterviewApplication.interview_id == interview_id,
            InterviewApplication.student_id == student.id,
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
        is_interested=True,
        status="applied",
    )
    db.add(application)
    db.commit()
    return {"message": "Application submitted"}


@router.get("/{interview_id}/applications")
def get_interview_applications(
    interview_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(_prof_or_admin),
):
    return db.scalars(
        select(InterviewApplication).where(
            InterviewApplication.interview_id == interview_id
        )
    ).all()


@router.patch("/applications/{application_id}/status")
def update_application_status(
    application_id: uuid.UUID,
    data: ApplicationStatusIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(_prof_or_admin),
):
    application = db.scalar(select(InterviewApplication).where(InterviewApplication.id == application_id))
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application.status = data.status
    db.commit()
    return {"status": data.status}
