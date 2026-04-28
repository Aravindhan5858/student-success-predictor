import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.student import Student
from app.models.interview import InterviewSession, InterviewStatus
from app.schemas.interview import InterviewSessionCreate, InterviewSessionResponse, InterviewFeedback, InterviewRespondRequest

router = APIRouter()


def _get_student(current_user: User, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    return student


@router.post("/sessions", response_model=InterviewSessionResponse, status_code=201)
def start_session(
    data: InterviewSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    student = _get_student(current_user, db)
    session = InterviewSession(
        student_id=student.id,
        type=data.type,
        questions=data.questions,
        status=InterviewStatus.in_progress,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/me", response_model=list[InterviewSessionResponse])
def my_sessions(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = _get_student(current_user, db)
    return db.query(InterviewSession).filter(InterviewSession.student_id == student.id).all()


@router.get("/sessions/{session_id}", response_model=InterviewSessionResponse)
def get_session(session_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_active_user)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.put("/sessions/{session_id}/respond", response_model=InterviewSessionResponse)
def respond(
    session_id: uuid.UUID,
    data: InterviewRespondRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session.responses = data.responses
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/complete", response_model=InterviewSessionResponse)
def complete_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    responses = session.responses or []
    score = round(len(responses) * 10.0, 2)  # Placeholder scoring
    session.status = InterviewStatus.completed
    session.score = score
    session.completed_at = datetime.utcnow()
    session.feedback = {
        "overall_score": score,
        "strengths": ["Communication", "Problem solving"],
        "improvements": ["Technical depth", "Conciseness"],
        "recommendation": "Good performance. Keep practicing.",
    }
    db.commit()
    db.refresh(session)
    return session
