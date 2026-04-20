import enum
import uuid
from datetime import datetime
from sqlalchemy import Float, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class InterviewType(str, enum.Enum):
    text = "text"
    audio = "audio"
    video = "video"


class InterviewStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    type: Mapped[InterviewType] = mapped_column(SAEnum(InterviewType), nullable=False, default=InterviewType.text)
    questions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    responses: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    feedback: Mapped[dict] = mapped_column(JSONB, nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[InterviewStatus] = mapped_column(SAEnum(InterviewStatus), nullable=False, default=InterviewStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
