import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import cloudinary
import cloudinary.uploader

from app.api.deps import get_db, get_current_active_user, require_professor, require_admin
from app.config import settings
from app.models.user import User
from app.models.profile import Profile, Skill, UserSkill, StudentMetrics
from app.models.student import Student

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

router = APIRouter()


# --- Schemas ---
class ProfileOut(BaseModel):
    user_id: uuid.UUID
    bio: Optional[str] = None
    headline: Optional[str] = None
    resume_url: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    headline: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None


class SkillOut(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class SkillCreate(BaseModel):
    name: str


class UserSkillIn(BaseModel):
    skill_id: uuid.UUID
    level: Optional[str] = None
    years: Optional[float] = None


class MetricsOut(BaseModel):
    student_id: uuid.UUID
    gpa: Optional[float] = None
    attendance_pct: Optional[float] = None
    risk_score: Optional[float] = None
    strengths: list = []
    weaknesses: list = []
    updated_at: datetime

    class Config:
        from_attributes = True


class MetricsUpdate(BaseModel):
    gpa: Optional[float] = None
    attendance_pct: Optional[float] = None
    risk_score: Optional[float] = None
    strengths: Optional[list] = None
    weaknesses: Optional[list] = None


# --- Helpers ---
def _get_or_create_profile(db: Session, user_id: uuid.UUID) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def _require_prof_or_admin(current_user: User) -> User:
    require_professor(current_user)
    return current_user


# --- Routes ---
@router.get("/profile", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return _get_or_create_profile(db, current_user.id)


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = _get_or_create_profile(db, current_user.id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/profile/resume", response_model=ProfileOut)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = cloudinary.uploader.upload(
        file.file,
        folder="resumes",
        resource_type="raw",
        public_id=f"{current_user.id}_{file.filename}",
    )
    profile = _get_or_create_profile(db, current_user.id)
    profile.resume_url = result["secure_url"]
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/skills", response_model=List[SkillOut])
def list_skills(db: Session = Depends(get_db), _: User = Depends(get_current_active_user)):
    return db.query(Skill).all()


@router.post("/skills", response_model=SkillOut, status_code=201)
def create_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_professor(current_user)
    skill = Skill(name=data.name)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.post("/user/skills", status_code=201)
def add_user_skill(
    data: UserSkillIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id, UserSkill.skill_id == data.skill_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Skill already added")
    us = UserSkill(user_id=current_user.id, skill_id=data.skill_id, level=data.level, years=data.years)
    db.add(us)
    db.commit()
    return {"status": "added"}


@router.delete("/user/skills/{skill_id}", status_code=204)
def remove_user_skill(
    skill_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    us = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id, UserSkill.skill_id == skill_id
    ).first()
    if not us:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(us)
    db.commit()


@router.get("/students/{student_id}/metrics", response_model=MetricsOut)
def get_metrics(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_professor(current_user)
    metrics = db.query(StudentMetrics).filter(StudentMetrics.student_id == student_id).first()
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found")
    return metrics


@router.put("/students/{student_id}/metrics", response_model=MetricsOut)
def update_metrics(
    student_id: uuid.UUID,
    data: MetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_professor(current_user)
    metrics = db.query(StudentMetrics).filter(StudentMetrics.student_id == student_id).first()
    if not metrics:
        metrics = StudentMetrics(student_id=student_id)
        db.add(metrics)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(metrics, field, value)
    metrics.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(metrics)
    return metrics
