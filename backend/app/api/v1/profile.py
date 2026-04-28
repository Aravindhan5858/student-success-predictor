import uuid
import re
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from urllib.request import urlopen

from app.api.deps import get_db, get_current_active_user, require_professor, require_admin
from app.config import settings
from app.models.user import User
from app.models.profile import Profile, Skill, UserSkill, StudentMetrics
from app.models.student import Student
from app.services.resume_scoring_service import analyze_resume_text
from app.services.cloudinary_service import upload_file as cloudinary_upload_file

logger = logging.getLogger(__name__)

router = APIRouter()


# --- Schemas ---
class ProfileOut(BaseModel):
    user_id: uuid.UUID
    bio: Optional[str] = None
    headline: Optional[str] = None
    resume_url: Optional[str] = None
    resume_score: Optional[float] = None
    resume_analysis_status: str = "not_started"
    resume_analysis_summary: Optional[str] = None
    resume_analyzed_at: Optional[datetime] = None
    public_slug: Optional[str] = None
    is_public: bool = False
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    education: list = []
    experience: list = []
    projects: list = []
    certifications: list = []
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    headline: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    education: Optional[list] = None
    experience: Optional[list] = None
    projects: Optional[list] = None
    certifications: Optional[list] = None


class PublicVisibilityIn(BaseModel):
    is_public: bool


class PublicProfileOut(BaseModel):
    full_name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    resume_url: Optional[str] = None
    resume_score: Optional[float] = None
    resume_analysis_status: str = "not_started"
    resume_analysis_summary: Optional[str] = None
    education: list = []
    experience: list = []
    projects: list = []
    certifications: list = []


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
        user = db.query(User).filter(User.id == user_id).first()
        profile = Profile(user_id=user_id, public_slug=_generate_slug((user.full_name if user else "student"), user_id))
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif not profile.public_slug:
        user = db.query(User).filter(User.id == user_id).first()
        profile.public_slug = _generate_slug((user.full_name if user else "student"), user_id)
        db.commit()
        db.refresh(profile)
    return profile


def _require_prof_or_admin(current_user: User) -> User:
    require_professor(current_user)
    return current_user


def _generate_slug(name: str, user_id: uuid.UUID) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "student"
    return f"{base}-{str(user_id)[:8]}"


def _extract_resume_text(url: str) -> str:
    try:
        with urlopen(url, timeout=10) as response:
            raw = response.read()
        return raw.decode("utf-8", errors="ignore")[:20000]
    except Exception:
        return ""


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
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        # Validate file type
        allowed_types = {"application/pdf", "application/msword", 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "text/plain", "application/vnd.ms-excel",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
        if file.content_type and file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: PDF, DOC, DOCX, TXT, XLS, XLSX")
        
        # Validate file size (max 5MB for resumes)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 5MB limit")
        
        # Reset file position for upload
        await file.seek(0)
        
        # Use centralized cloudinary service with safe public_id
        result = await cloudinary_upload_file(
            file,
            folder="resumes",
            resource_type="raw",
            public_id_override=f"resume_{current_user.id}"
        )
        
        profile = _get_or_create_profile(db, current_user.id)
        profile.resume_url = result["url"]
        profile.resume_analysis_status = "not_started"
        profile.resume_score = None
        profile.resume_analysis_summary = None
        profile.resume_analyzed_at = None
        profile.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(profile)
        logger.info(f"Resume uploaded for user {current_user.id}")
        return profile
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Resume upload error for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume upload failed: {str(e)}")


@router.post("/profile/resume/analyze", response_model=ProfileOut)
def analyze_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = _get_or_create_profile(db, current_user.id)
    if not profile.resume_url:
        raise HTTPException(status_code=400, detail="Upload resume first")

    profile.resume_analysis_status = "processing"
    db.commit()

    resume_text = _extract_resume_text(profile.resume_url)
    if not resume_text.strip():
        profile.resume_analysis_status = "failed"
        profile.resume_analysis_summary = "Could not parse resume content from uploaded file."
        profile.resume_analyzed_at = datetime.utcnow()
        db.commit()
        db.refresh(profile)
        return profile

    context = f"Headline: {profile.headline or ''}\nBio: {profile.bio or ''}\n"
    analysis = analyze_resume_text(resume_text, context)
    profile.resume_score = analysis.score
    profile.resume_analysis_summary = analysis.summary
    profile.resume_analysis_status = "completed"
    profile.resume_analyzed_at = datetime.utcnow()
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/profile/public-visibility", response_model=ProfileOut)
def set_public_visibility(
    data: PublicVisibilityIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = _get_or_create_profile(db, current_user.id)
    profile.is_public = data.is_public
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/profile/public-slug/regenerate", response_model=ProfileOut)
def regenerate_public_slug(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = _get_or_create_profile(db, current_user.id)
    profile.public_slug = _generate_slug(current_user.full_name, current_user.id)
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/public/profile/{slug}", response_model=PublicProfileOut)
def get_public_profile(slug: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.public_slug == slug).first()
    if not profile or not profile.is_public:
        raise HTTPException(status_code=404, detail="Public profile not found")

    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return PublicProfileOut(
        full_name=user.full_name,
        headline=profile.headline,
        bio=profile.bio,
        github=profile.github,
        linkedin=profile.linkedin,
        portfolio=profile.portfolio,
        resume_url=profile.resume_url,
        resume_score=profile.resume_score,
        resume_analysis_status=profile.resume_analysis_status,
        resume_analysis_summary=profile.resume_analysis_summary,
        education=profile.education or [],
        experience=profile.experience or [],
        projects=profile.projects or [],
        certifications=profile.certifications or [],
    )


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
