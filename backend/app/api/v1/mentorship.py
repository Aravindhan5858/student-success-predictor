import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.mentorship import MentorshipRequest, Mentorship

router = APIRouter()


# --- Schemas ---
class UserBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class MentorshipRequestIn(BaseModel):
    to_user_id: uuid.UUID
    message: Optional[str] = None


class MentorshipRequestOut(BaseModel):
    id: uuid.UUID
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    role: str
    status: str
    message: Optional[str]
    created_at: datetime
    sender: Optional[UserBrief] = None

    class Config:
        from_attributes = True


class MentorshipOut(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    professor_id: uuid.UUID
    status: str
    started_at: datetime
    mentor: Optional[UserBrief] = None
    mentee: Optional[UserBrief] = None

    class Config:
        from_attributes = True


# --- Routes ---
@router.post("/mentorship/request", response_model=MentorshipRequestOut, status_code=201)
def request_mentorship(
    data: MentorshipRequestIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = MentorshipRequest(
        from_user_id=current_user.id,
        to_user_id=data.to_user_id,
        role=current_user.role.value,
        message=data.message,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/mentorship/requests", response_model=List[MentorshipRequestOut])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    reqs = (
        db.query(MentorshipRequest)
        .filter(
            MentorshipRequest.to_user_id == current_user.id,
            MentorshipRequest.status == "pending",
        )
        .all()
    )
    result = []
    for req in reqs:
        sender = db.query(User).filter(User.id == req.from_user_id).first()
        out = MentorshipRequestOut.model_validate(req)
        if sender:
            out.sender = UserBrief(id=sender.id, full_name=sender.full_name, email=sender.email, role=sender.role.value)
        result.append(out)
    return result


@router.post("/mentorship/{request_id}/approve", response_model=MentorshipOut)
def approve_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == request_id,
        MentorshipRequest.to_user_id == current_user.id,
        MentorshipRequest.status == "pending",
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "approved"

    # Determine student/professor from roles
    from_user = db.query(User).filter(User.id == req.from_user_id).first()
    if from_user.role.value == "student":
        student_id, professor_id = req.from_user_id, req.to_user_id
    else:
        student_id, professor_id = req.to_user_id, req.from_user_id

    mentorship = Mentorship(student_id=student_id, professor_id=professor_id)
    db.add(mentorship)
    db.commit()
    db.refresh(mentorship)
    return mentorship


@router.post("/mentorship/{request_id}/reject")
def reject_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == request_id,
        MentorshipRequest.to_user_id == current_user.id,
        MentorshipRequest.status == "pending",
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected"
    db.commit()
    return {"status": "rejected"}


@router.get("/mentorships", response_model=List[MentorshipOut])
def list_mentorships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mentorships = (
        db.query(Mentorship)
        .filter(
            (Mentorship.student_id == current_user.id) | (Mentorship.professor_id == current_user.id),
            Mentorship.status == "active",
        )
        .all()
    )
    result = []
    for m in mentorships:
        professor = db.query(User).filter(User.id == m.professor_id).first()
        student = db.query(User).filter(User.id == m.student_id).first()
        out = MentorshipOut.model_validate(m)
        if professor:
            out.mentor = UserBrief(id=professor.id, full_name=professor.full_name, email=professor.email, role=professor.role.value)
        if student:
            out.mentee = UserBrief(id=student.id, full_name=student.full_name, email=student.email, role=student.role.value)
        result.append(out)
    return result


@router.delete("/mentorships/{mentorship_id}", status_code=204)
def end_mentorship(
    mentorship_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    m = db.query(Mentorship).filter(
        Mentorship.id == mentorship_id,
        (Mentorship.student_id == current_user.id) | (Mentorship.professor_id == current_user.id),
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    m.status = "ended"
    db.commit()
