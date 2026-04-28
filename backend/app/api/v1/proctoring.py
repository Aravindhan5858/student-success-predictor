from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.extended import TestViolation
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter()


class ViolationCreate(BaseModel):
    session_id: uuid.UUID
    violation_type: str
    details: Optional[str] = None


@router.post("/violations")
def log_violation(
    data: ViolationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    violation = TestViolation(
        session_id=data.session_id,
        violation_type=data.violation_type,
        details=data.details,
    )
    db.add(violation)

    from app.models.mock_test import TestSession
    session = db.scalar(select(TestSession).where(TestSession.id == data.session_id))
    if session:
        if not hasattr(session, "violation_count"):
            session.violation_count = 0
        session.violation_count += 1
        if session.violation_count >= 3:
            session.completed = True

    db.commit()
    return {"message": "Violation logged", "count": session.violation_count if session else 0}


@router.get("/violations/{session_id}")
def get_violations(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return db.scalars(
        select(TestViolation).where(TestViolation.session_id == session_id)
    ).all()
