import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    bio: Mapped[Optional[str]] = mapped_column(nullable=True)
    headline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    resume_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    linkedin: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    portfolio: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    education: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    experience: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    projects: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    certifications: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("now()"), nullable=False)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)


class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    skill_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("skills.id"), primary_key=True)
    level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class StudentMetrics(Base):
    __tablename__ = "student_metrics"

    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True)
    gpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    attendance_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    strengths: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    weaknesses: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("now()"), nullable=False)
