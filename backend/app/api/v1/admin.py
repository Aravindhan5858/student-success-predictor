import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List
from app.api.deps import get_db, get_current_active_user, require_admin, require_super_admin
from app.models.user import User, UserRole
from app.models.extended import College
from app.models.audit import AuditLog
from app.models.student import Student
from pydantic import BaseModel

router = APIRouter()


def _admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_admin(current_user)


def _super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_super_admin(current_user)


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
    active_sessions: int = 0


class SuspendIn(BaseModel):
    reason: str
    hours: int = 24


@router.post("/colleges", response_model=CollegeResponse)
def create_college(data: CollegeCreate, db: Session = Depends(get_db), _: User = Depends(_admin)):
    college = College(name=data.name, code=data.code)
    db.add(college)
    db.commit()
    db.refresh(college)
    return college


@router.get("/colleges", response_model=List[CollegeResponse])
def list_colleges(db: Session = Depends(get_db), _: User = Depends(_admin)):
    return db.scalars(select(College)).all()


@router.get("/stats", response_model=SystemStats)
def get_system_stats(db: Session = Depends(get_db), _: User = Depends(_admin)):
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_students = db.scalar(select(func.count(Student.id))) or 0
    total_professors = db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.professor)
    ) or 0
    total_colleges = db.scalar(select(func.count(College.id))) or 0

    return SystemStats(
        total_users=total_users,
        total_students=total_students,
        total_professors=total_professors,
        total_colleges=total_colleges,
    )


@router.get("/audit-logs")
def get_audit_logs(
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    total = db.query(AuditLog).count()
    items = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return {
        "items": [
            {
                "id": str(i.id),
                "user_id": str(i.user_id),
                "action": i.action,
                "resource": i.resource,
                "created_at": i.created_at.isoformat(),
            }
            for i in items
        ],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: uuid.UUID,
    data: SuspendIn,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "suspended"
    user.suspension_reason = data.reason
    user.suspended_until = datetime.utcnow() + timedelta(hours=data.hours)
    user.is_active = False
    db.commit()
    return {"status": "suspended", "until": user.suspended_until}


@router.post("/users/{user_id}/unsuspend")
def unsuspend_user(user_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(_admin)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "active"
    user.suspension_reason = None
    user.suspended_until = None
    user.is_active = True
    db.commit()
    return {"status": "active"}
