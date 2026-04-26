from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.extended import College
from app.models.audit import AuditLog
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


class CollegeCreate(BaseModel):
    name: str
    code: str


class CollegeResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True


class SystemStats(BaseModel):
    total_users: int
    total_students: int
    total_professors: int
    total_colleges: int


@router.post("/colleges", response_model=CollegeResponse)
def create_college(
    data: CollegeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    college = College(name=data.name, code=data.code)
    db.add(college)
    db.commit()
    db.refresh(college)
    return college


@router.get("/colleges", response_model=List[CollegeResponse])
def list_colleges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    colleges = db.scalars(select(College)).all()
    return colleges


@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    from app.models.student import Student
    
    total_users = db.scalar(select(func.count(User.id)))
    total_students = db.scalar(select(func.count(Student.id)))
    total_professors = db.scalar(select(func.count(User.id)).where(User.role == "professor"))
    total_colleges = db.scalar(select(func.count(College.id)))

    return {
        "total_users": total_users or 0,
        "total_students": total_students or 0,
        "total_professors": total_professors or 0,
        "total_colleges": total_colleges or 0
    }


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    logs = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)).all()
    return logs


@router.patch("/users/{user_id}/suspend")
def suspend_user(
    user_id: uuid.UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "professor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "suspended"
    user.suspension_reason = reason
    user.is_active = False
    db.commit()
    return {"message": "User suspended"}
