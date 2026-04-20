import uuid
import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_admin, require_professor
from app.models.user import User
from app.models.mock_test import Domain, QuestionBank, TestSession, TestAttempt

router = APIRouter()


# --- Schemas ---
class DomainOut(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class DomainCreate(BaseModel):
    name: str


class QuestionBankOut(BaseModel):
    id: uuid.UUID
    domain_id: Optional[uuid.UUID]
    type: str
    difficulty: str
    prompt: str
    options: list
    answer: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionBankCreate(BaseModel):
    domain_id: Optional[uuid.UUID] = None
    type: str  # 'mcq' | 'code'
    difficulty: str  # 'easy' | 'medium' | 'hard'
    prompt: str
    options: List[str] = []
    answer: Optional[str] = None
    testcases_json: List[dict] = []


class QuestionForStudent(BaseModel):
    id: uuid.UUID
    type: str
    difficulty: str
    prompt: str
    options: list


class StartTestIn(BaseModel):
    domain_id: uuid.UUID
    difficulty: Optional[str] = None
    count: int = 10


class StartTestOut(BaseModel):
    session_id: uuid.UUID
    questions: List[QuestionForStudent]


class AttemptIn(BaseModel):
    question_id: uuid.UUID
    response: str


class SubmitIn(BaseModel):
    session_id: uuid.UUID
    attempts: List[AttemptIn]


class SubmitOut(BaseModel):
    score: float
    correct_count: int
    total: int
    violations: int


class SessionOut(BaseModel):
    id: uuid.UUID
    domain_id: Optional[uuid.UUID]
    started_at: datetime
    ended_at: Optional[datetime]
    score: Optional[float]
    violations: int
    status: str

    class Config:
        from_attributes = True


class AttemptOut(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    response: Optional[str]
    correct: Optional[bool]

    class Config:
        from_attributes = True


class SessionReport(SessionOut):
    attempts: List[AttemptOut] = []


class ProctorEventIn(BaseModel):
    session_id: uuid.UUID
    event_type: str  # tab_switch|copy|focus_loss|webcam_snapshot
    details: Optional[dict] = None


# --- Helpers ---
def _finish_session(db: Session, session: TestSession):
    attempts = db.query(TestAttempt).filter(TestAttempt.session_id == session.id).all()
    correct = sum(1 for a in attempts if a.correct)
    total = len(attempts)
    session.score = (correct / total * 100) if total else 0
    session.status = "completed"
    session.ended_at = datetime.utcnow()
    db.commit()


# --- Routes ---
@router.get("/tests/domains", response_model=List[DomainOut])
def list_domains(db: Session = Depends(get_db), _: User = Depends(get_current_active_user)):
    return db.query(Domain).all()


@router.post("/tests/domains", response_model=DomainOut, status_code=201)
def create_domain(
    data: DomainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_admin(current_user)
    d = Domain(name=data.name)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.get("/tests/questions", response_model=List[QuestionBankOut])
def list_bank_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_professor(current_user)
    return db.query(QuestionBank).all()


@router.post("/tests/questions", response_model=QuestionBankOut, status_code=201)
def add_bank_question(
    data: QuestionBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    require_professor(current_user)
    q = QuestionBank(**data.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.post("/tests/start", response_model=StartTestOut)
def start_test(
    data: StartTestIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(QuestionBank).filter(QuestionBank.domain_id == data.domain_id)
    if data.difficulty:
        query = query.filter(QuestionBank.difficulty == data.difficulty)
    pool = query.all()
    if not pool:
        raise HTTPException(status_code=404, detail="No questions found for this domain/difficulty")
    selected = random.sample(pool, min(data.count, len(pool)))

    session = TestSession(user_id=current_user.id, domain_id=data.domain_id)
    db.add(session)
    db.flush()

    for q in selected:
        db.add(TestAttempt(session_id=session.id, question_id=q.id))

    db.commit()
    db.refresh(session)

    questions = [QuestionForStudent(id=q.id, type=q.type, difficulty=q.difficulty, prompt=q.prompt, options=q.options) for q in selected]
    return StartTestOut(session_id=session.id, questions=questions)


@router.get("/tests/sessions", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(TestSession).filter(TestSession.user_id == current_user.id).order_by(TestSession.started_at.desc()).all()


@router.get("/tests/sessions/{session_id}", response_model=SessionOut)
def get_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    s = db.query(TestSession).filter(TestSession.id == session_id, TestSession.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


@router.post("/tests/submit", response_model=SubmitOut)
def submit_test(
    data: SubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = db.query(TestSession).filter(
        TestSession.id == data.session_id, TestSession.user_id == current_user.id, TestSession.status == "active"
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")

    correct_count = 0
    for attempt_in in data.attempts:
        attempt = db.query(TestAttempt).filter(
            TestAttempt.session_id == session.id, TestAttempt.question_id == attempt_in.question_id
        ).first()
        if not attempt:
            continue
        attempt.response = attempt_in.response
        q = db.query(QuestionBank).filter(QuestionBank.id == attempt_in.question_id).first()
        if q and q.type == "mcq":
            attempt.correct = q.answer is not None and attempt_in.response.strip() == q.answer.strip()
            if attempt.correct:
                correct_count += 1
        else:
            attempt.correct = None  # code: pending review

    total = len(data.attempts)
    score = (correct_count / total * 100) if total else 0
    session.score = score
    session.status = "completed"
    session.ended_at = datetime.utcnow()
    db.commit()

    return SubmitOut(score=score, correct_count=correct_count, total=total, violations=session.violations)


@router.post("/tests/proctor/event")
def proctor_event(
    data: ProctorEventIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = db.query(TestSession).filter(
        TestSession.id == data.session_id, TestSession.user_id == current_user.id, TestSession.status == "active"
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")

    session.violations += 1
    db.commit()

    if session.violations >= 3:
        _finish_session(db, session)
        return {"violations": session.violations, "auto_submitted": True}

    return {"violations": session.violations, "auto_submitted": False}


@router.get("/tests/sessions/{session_id}/report", response_model=SessionReport)
def session_report(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = db.query(TestSession).filter(TestSession.id == session_id, TestSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    attempts = db.query(TestAttempt).filter(TestAttempt.session_id == session_id).all()
    return SessionReport(**SessionOut.model_validate(session).model_dump(), attempts=attempts)
