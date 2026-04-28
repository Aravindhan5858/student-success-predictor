import uuid
import random
from collections import Counter
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.mcq import MCQQuestion, MCQAttempt, MCQWarning, MCQEmotionLog
from pydantic import BaseModel

router = APIRouter()


class MCQConnectionManager:
    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, attempt_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections.setdefault(attempt_id, []).append(websocket)

    def disconnect(self, attempt_id: str, websocket: WebSocket):
        if attempt_id not in self.connections:
            return
        self.connections[attempt_id] = [ws for ws in self.connections[attempt_id] if ws is not websocket]
        if not self.connections[attempt_id]:
            del self.connections[attempt_id]

    async def broadcast(self, attempt_id: str, payload: dict):
        for ws in self.connections.get(attempt_id, []):
            await ws.send_json(payload)


ws_manager = MCQConnectionManager()


class StartTestRequest(BaseModel):
    domain: str
    num_questions: int = 10


class SubmitAnswerRequest(BaseModel):
    attempt_id: uuid.UUID
    question_id: uuid.UUID
    answer: str


class LogWarningRequest(BaseModel):
    attempt_id: uuid.UUID
    warning_type: str
    severity: str = "medium"
    details: str | None = None


class LogEmotionRequest(BaseModel):
    attempt_id: uuid.UUID
    emotion: str
    confidence: float = 0.0
    face_detected: bool = True
    face_count: int = 1


def get_attempt_for_student(db: Session, attempt_id: uuid.UUID, current_user: User):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Students only")

    student = db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    attempt = db.scalar(select(MCQAttempt).where(MCQAttempt.id == attempt_id))
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.student_id != student.id:
        raise HTTPException(status_code=403, detail="You cannot access this attempt")
    return student, attempt


@router.post("/start")
def start_test(
    data: StartTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Students only")

    student = db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    questions = db.scalars(
        select(MCQQuestion).where(MCQQuestion.domain == data.domain)
    ).all()
    if len(questions) < data.num_questions:
        raise HTTPException(status_code=400, detail="Not enough questions in this domain")

    selected = random.sample(questions, data.num_questions)

    attempt = MCQAttempt(
        student_id=student.id,
        domain=data.domain,
        total_questions=data.num_questions,
        answers={},
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": str(attempt.id),
        "questions": [
            {
                "id": str(q.id),
                "question_text": q.question_text,
                "options": q.options,
                "difficulty": q.difficulty,
                "domain": q.domain,
            }
            for q in selected
        ],
    }


@router.post("/submit")
def submit_answer(
    data: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    attempt = db.scalar(select(MCQAttempt).where(MCQAttempt.id == data.attempt_id))
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    question = db.scalar(select(MCQQuestion).where(MCQQuestion.id == data.question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = question.correct_answer == data.answer
    attempt.answers = {
        **attempt.answers,
        str(data.question_id): {"answer": data.answer, "correct": is_correct},
    }
    if is_correct:
        attempt.correct_answers += 1

    db.commit()
    return {"correct": is_correct}


@router.post("/complete/{attempt_id}")
def complete_test(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    attempt = db.scalar(select(MCQAttempt).where(MCQAttempt.id == attempt_id))
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    attempt.completed = True
    attempt.completed_at = datetime.utcnow()
    # Store as float percentage (0-100)
    attempt.score = round((attempt.correct_answers / attempt.total_questions) * 100, 2)
    db.commit()

    return {
        "score": attempt.score,
        "correct": attempt.correct_answers,
        "total": attempt.total_questions,
    }


@router.get("/attempts")
def list_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Students only")

    student = db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return db.scalars(
        select(MCQAttempt)
        .where(MCQAttempt.student_id == student.id)
        .order_by(MCQAttempt.started_at.desc())
    ).all()


@router.get("/analytics/{attempt_id}")
def get_analytics(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _, attempt = get_attempt_for_student(db, attempt_id, current_user)

    weak_count = sum(1 for ans in attempt.answers.values() if not ans["correct"])
    strong_count = sum(1 for ans in attempt.answers.values() if ans["correct"])

    return {
        "score": attempt.score,
        "weak_count": weak_count,
        "strong_count": strong_count,
        "domain": attempt.domain,
    }


@router.post("/proctoring/warning")
async def log_warning(
    data: LogWarningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student, attempt = get_attempt_for_student(db, data.attempt_id, current_user)

    warning = MCQWarning(
        attempt_id=attempt.id,
        student_id=student.id,
        warning_type=data.warning_type,
        severity=data.severity,
        details=data.details,
    )
    db.add(warning)
    db.commit()
    db.refresh(warning)

    await ws_manager.broadcast(
        str(attempt.id),
        {
            "type": "proctor_alert",
            "warning_type": warning.warning_type,
            "severity": warning.severity,
            "message": warning.details or warning.warning_type.replace("_", " ").title(),
            "created_at": warning.created_at.isoformat(),
        },
    )
    return {"status": "logged", "warning_id": str(warning.id)}


@router.post("/proctoring/emotion")
def log_emotion(
    data: LogEmotionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student, attempt = get_attempt_for_student(db, data.attempt_id, current_user)
    row = MCQEmotionLog(
        attempt_id=attempt.id,
        student_id=student.id,
        emotion=data.emotion,
        confidence=data.confidence,
        face_detected=data.face_detected,
        face_count=data.face_count,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"status": "logged", "emotion_log_id": str(row.id)}


@router.get("/proctoring/{attempt_id}")
def get_proctoring_report(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _, attempt = get_attempt_for_student(db, attempt_id, current_user)
    warnings = db.scalars(
        select(MCQWarning)
        .where(MCQWarning.attempt_id == attempt.id)
        .order_by(MCQWarning.created_at.desc())
    ).all()
    emotions = db.scalars(
        select(MCQEmotionLog)
        .where(MCQEmotionLog.attempt_id == attempt.id)
        .order_by(MCQEmotionLog.created_at.desc())
    ).all()

    warning_counts = Counter(w.warning_type for w in warnings)
    emotion_counts = Counter(e.emotion for e in emotions)
    total_emotions = max(len(emotions), 1)
    dominant_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else None

    emotion_distribution = [
        {"emotion": emotion, "count": count, "percentage": round((count / total_emotions) * 100, 2)}
        for emotion, count in emotion_counts.items()
    ]
    emotion_distribution.sort(key=lambda x: x["count"], reverse=True)

    timeline = [
        {
            "id": str(w.id),
            "warning_type": w.warning_type,
            "severity": w.severity,
            "details": w.details,
            "created_at": w.created_at.isoformat(),
        }
        for w in warnings[:5]
    ]

    return {
        "attempt_id": str(attempt.id),
        "warning_total": len(warnings),
        "warning_counts": dict(warning_counts),
        "warnings": [
            {
                "id": str(w.id),
                "warning_type": w.warning_type,
                "severity": w.severity,
                "details": w.details,
                "created_at": w.created_at.isoformat(),
            }
            for w in warnings
        ],
        "dominant_emotion": dominant_emotion,
        "emotion_total": len(emotions),
        "emotion_distribution": emotion_distribution,
        "emotion_logs": [
            {
                "id": str(e.id),
                "emotion": e.emotion,
                "confidence": e.confidence,
                "face_detected": e.face_detected,
                "face_count": e.face_count,
                "created_at": e.created_at.isoformat(),
            }
            for e in emotions
        ],
        "timeline": timeline,
    }


@router.websocket("/ws/{attempt_id}")
async def mcq_ws(websocket: WebSocket, attempt_id: str):
    await ws_manager.connect(attempt_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(attempt_id, websocket)
