import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, require_admin
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.services.user_service import create_user, update_user, soft_delete_user

router = APIRouter()


def _admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_admin(current_user)


@router.get("", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return UserListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=UserResponse, status_code=201)
def create_new_user(data: UserCreate, db: Session = Depends(get_db), _: User = Depends(_admin)):
    return create_user(db, data)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_existing_user(user_id: uuid.UUID, data: UserUpdate, db: Session = Depends(get_db), _: User = Depends(_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return update_user(db, user, data)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    soft_delete_user(db, user)


class SuspendIn(BaseModel):
    reason: str
    hours: int = 24


@router.post("/{user_id}/suspend", dependencies=[Depends(_admin)])
def suspend_user(user_id: uuid.UUID, data: SuspendIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.status = "suspended"
    user.suspension_reason = data.reason
    user.suspended_until = datetime.utcnow() + timedelta(hours=data.hours)
    db.commit()
    return {"status": "suspended", "until": user.suspended_until}


@router.post("/{user_id}/unsuspend", dependencies=[Depends(_admin)])
def unsuspend_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.status = "active"
    user.suspension_reason = None
    user.suspended_until = None
    db.commit()
    return {"status": "active"}
