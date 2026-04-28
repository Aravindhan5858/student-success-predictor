"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "professor", "student", name="userrole"), nullable=False, server_default="student"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "students",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("student_id", sa.String(50), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("semester", sa.Integer(), nullable=True),
        sa.Column("cgpa", sa.Float(), nullable=True, server_default="0.0"),
        sa.Column("attendance_pct", sa.Float(), nullable=True, server_default="0.0"),
        sa.Column("risk_level", sa.Enum("low", "medium", "high", name="risklevel"), nullable=False, server_default="low"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_students_student_id", "students", ["student_id"], unique=True)

    op.create_table(
        "courses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("credits", sa.Integer(), nullable=False, server_default="3"),
        sa.UniqueConstraint("code", name="uq_courses_code"),
    )

    op.create_table(
        "enrollments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("course_id", UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("semester", sa.Integer(), nullable=False),
        sa.Column("grade", sa.String(5), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "academic_records",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("course_id", UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("semester", sa.Integer(), nullable=False),
        sa.Column("marks", sa.Float(), nullable=True),
        sa.Column("grade", sa.String(5), nullable=True),
        sa.Column("attendance", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_academic_records_student_id", "academic_records", ["student_id"])

    op.create_table(
        "attendance",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("course_id", UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("present", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "assessments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("type", sa.Enum("aptitude", "coding", "mcq", name="assessmenttype"), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("questions", JSONB(), nullable=False, server_default="[]"),
        sa.Column("duration_mins", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "test_results",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("assessment_id", UUID(as_uuid=True), sa.ForeignKey("assessments.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("max_score", sa.Float(), nullable=False, server_default="100.0"),
        sa.Column("answers", JSONB(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "interview_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("type", sa.Enum("text", "audio", "video", name="interviewtype"), nullable=False, server_default="text"),
        sa.Column("questions", JSONB(), nullable=False, server_default="[]"),
        sa.Column("responses", JSONB(), nullable=True, server_default="[]"),
        sa.Column("feedback", JSONB(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("status", sa.Enum("pending", "in_progress", "completed", name="interviewstatus"), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource", sa.String(100), nullable=False),
        sa.Column("resource_id", sa.String(255), nullable=True),
        sa.Column("details", JSONB(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_audit_logs_user_id_created_at", "audit_logs", ["user_id", "created_at"])

    op.create_table(
        "files",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("cloudinary_url", sa.String(500), nullable=True),
        sa.Column("cloudinary_public_id", sa.String(255), nullable=True),
        sa.Column("file_type", sa.String(100), nullable=True),
        sa.Column("size", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("files")
    op.drop_table("audit_logs")
    op.drop_table("interview_sessions")
    op.drop_table("test_results")
    op.drop_table("assessments")
    op.drop_table("attendance")
    op.drop_table("academic_records")
    op.drop_table("enrollments")
    op.drop_table("courses")
    op.drop_table("students")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS risklevel")
    op.execute("DROP TYPE IF EXISTS assessmenttype")
    op.execute("DROP TYPE IF EXISTS interviewtype")
    op.execute("DROP TYPE IF EXISTS interviewstatus")
