import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_admin, require_professor
from app.models.user import User
from app.models.community import Question, Answer, ModerationLog

router = APIRouter()


# --- Schemas ---
class QuestionCreate(BaseModel):
    title: str
    body: str
    tags: List[str] = []


class QuestionOut(BaseModel):
    id: uuid.UUID
    author_id: Optional[uuid.UUID]
    title: str
    body: str
    tags: list
    status: str
    votes: int
    created_at: datetime

    class Config:
        from_attributes = True


class AnswerCreate(BaseModel):
    body: str


class AnswerOut(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    author_id: Optional[uuid.UUID]
    body: str
    is_accepted: bool
    votes: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionDetail(QuestionOut):
    answers: List[AnswerOut] = []


class VoteIn(BaseModel):
    direction: str  # 'up' | 'down'


class ModerationDeleteIn(BaseModel):
    target_type: str  # 'question' | 'answer'
    target_id: uuid.UUID
    reason: str


class ModerationSuspendIn(BaseModel):
    user_id: uuid.UUID
    reason: str
    hours: int = 24


class ModerationUnsuspendIn(BaseModel):
    user_id: uuid.UUID


class ModerationLogOut(BaseModel):
    id: uuid.UUID
    actor_id: Optional[uuid.UUID]
    action: str
    target_type: str
    target_id: str
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Helpers ---
def _check_not_suspended(user: User):
    if getattr(user, "status", None) == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")


def _log(db: Session, actor_id: uuid.UUID, action: str, target_type: str, target_id: str, reason: Optional[str] = None):
    db.add(ModerationLog(actor_id=actor_id, action=action, target_type=target_type, target_id=target_id, reason=reason))


# --- Routes ---
@router.get("/questions", response_model=List[QuestionOut])
def list_questions(
    tag: Optional[str] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _check_not_suspended(current_user)
    query = db.query(Question).filter(Question.status != "deleted")
    if tag:
        query = query.filter(Question.tags.contains([tag]))
    if q:
        query = query.filter(Question.title.ilike(f"%{q}%"))
    return query.order_by(Question.created_at.desc()).offset((page - 1) * size).limit(size).all()


@router.post("/questions", response_model=QuestionOut, status_code=201)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _check_not_suspended(current_user)
    q = Question(author_id=current_user.id, title=data.title, body=data.body, tags=data.tags)
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/questions/{question_id}", response_model=QuestionDetail)
def get_question(
    question_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Question).filter(Question.id == question_id, Question.status != "deleted").first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    answers = db.query(Answer).filter(Answer.question_id == question_id, Answer.status != "deleted").all()
    return QuestionDetail(**QuestionOut.model_validate(q).model_dump(), answers=answers)


@router.post("/questions/{question_id}/answers", response_model=AnswerOut, status_code=201)
def post_answer(
    question_id: uuid.UUID,
    data: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _check_not_suspended(current_user)
    q = db.query(Question).filter(Question.id == question_id, Question.status != "deleted").first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    a = Answer(question_id=question_id, author_id=current_user.id, body=data.body)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.post("/answers/{answer_id}/vote")
def vote_answer(
    answer_id: uuid.UUID,
    data: VoteIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _check_not_suspended(current_user)
    if data.direction not in ("up", "down"):
        raise HTTPException(status_code=400, detail="direction must be 'up' or 'down'")
    a = db.query(Answer).filter(Answer.id == answer_id, Answer.status != "deleted").first()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    a.votes += 1 if data.direction == "up" else -1
    db.commit()
    return {"votes": a.votes}


@router.post("/answers/{answer_id}/accept")
def accept_answer(
    answer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    a = db.query(Answer).filter(Answer.id == answer_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    q = db.query(Question).filter(Question.id == a.question_id).first()
    if q.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only question author can accept answers")
    # Unaccept others
    db.query(Answer).filter(Answer.question_id == a.question_id).update({"is_accepted": False})
    a.is_accepted = True
    db.commit()
    return {"accepted": True}


@router.post("/moderation/delete")
def moderate_delete(
    data: ModerationDeleteIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_professor(current_user)
    if data.target_type == "question":
        obj = db.query(Question).filter(Question.id == data.target_id).first()
    elif data.target_type == "answer":
        obj = db.query(Answer).filter(Answer.id == data.target_id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid target_type")
    if not obj:
        raise HTTPException(status_code=404, detail="Content not found")
    obj.status = "deleted"
    _log(db, current_user.id, "delete", data.target_type, str(data.target_id), data.reason)
    db.commit()
    return {"status": "deleted"}


@router.post("/moderation/suspend")
def moderate_suspend(
    data: ModerationSuspendIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_admin(current_user)
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "suspended"
    user.suspension_reason = data.reason
    user.suspended_until = datetime.utcnow() + timedelta(hours=data.hours)
    _log(db, current_user.id, "suspend", "user", str(data.user_id), data.reason)
    db.commit()
    return {"status": "suspended", "until": user.suspended_until}


@router.post("/moderation/unsuspend")
def moderate_unsuspend(
    data: ModerationUnsuspendIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_admin(current_user)
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "active"
    user.suspension_reason = None
    user.suspended_until = None
    _log(db, current_user.id, "unsuspend", "user", str(data.user_id))
    db.commit()
    return {"status": "active"}


@router.get("/moderation/logs", response_model=List[ModerationLogOut])
def get_moderation_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_admin(current_user)
    return db.query(ModerationLog).order_by(ModerationLog.created_at.desc()).limit(200).all()
