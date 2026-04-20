"""Feature modules

Revision ID: 002
Revises: 001
Create Date: 2026-04-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users table additions ---
    op.add_column("users", sa.Column("status", sa.String(20), nullable=False, server_default="active"))
    op.add_column("users", sa.Column("suspension_reason", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("suspended_until", sa.DateTime(), nullable=True))

    # --- profiles ---
    op.create_table(
        "profiles",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("headline", sa.String(255), nullable=True),
        sa.Column("resume_url", sa.String(500), nullable=True),
        sa.Column("github", sa.String(255), nullable=True),
        sa.Column("linkedin", sa.String(255), nullable=True),
        sa.Column("portfolio", sa.String(255), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # --- skills ---
    op.create_table(
        "skills",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
    )

    # --- user_skills ---
    op.create_table(
        "user_skills",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("skill_id", UUID(as_uuid=True), sa.ForeignKey("skills.id"), nullable=False),
        sa.Column("level", sa.String(20), nullable=True),
        sa.Column("years", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("user_id", "skill_id"),
    )

    # --- student_metrics ---
    op.create_table(
        "student_metrics",
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("students.id"), primary_key=True),
        sa.Column("gpa", sa.Float(), nullable=True),
        sa.Column("attendance_pct", sa.Float(), nullable=True),
        sa.Column("risk_score", sa.Float(), nullable=True),
        sa.Column("strengths", JSONB(), nullable=False, server_default="[]"),
        sa.Column("weaknesses", JSONB(), nullable=False, server_default="[]"),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # --- questions ---
    op.create_table(
        "questions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("author_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("tags", JSONB(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("votes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_questions_author_id", "questions", ["author_id"])
    op.create_index("ix_questions_status", "questions", ["status"])

    # --- answers ---
    op.create_table(
        "answers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("question_id", UUID(as_uuid=True), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("author_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_accepted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("votes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_answers_question_id", "answers", ["question_id"])

    # --- moderation_logs ---
    op.create_table(
        "moderation_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=False),
        sa.Column("target_id", sa.String(255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # --- mentorship_requests ---
    op.create_table(
        "mentorship_requests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("from_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("to_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # --- mentorships ---
    op.create_table(
        "mentorships",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("professor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("started_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # --- domains ---
    op.create_table(
        "domains",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
    )

    # --- question_bank ---
    op.create_table(
        "question_bank",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("domain_id", UUID(as_uuid=True), sa.ForeignKey("domains.id"), nullable=True),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("difficulty", sa.String(10), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("options", JSONB(), nullable=False, server_default="[]"),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("testcases_json", JSONB(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # --- test_sessions ---
    op.create_table(
        "test_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("domain_id", UUID(as_uuid=True), sa.ForeignKey("domains.id"), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("violations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
    )
    op.create_index("ix_test_sessions_user_id", "test_sessions", ["user_id"])

    # --- test_attempts ---
    op.create_table(
        "test_attempts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("test_sessions.id"), nullable=False),
        sa.Column("question_id", UUID(as_uuid=True), sa.ForeignKey("question_bank.id"), nullable=False),
        sa.Column("response", sa.Text(), nullable=True),
        sa.Column("correct", sa.Boolean(), nullable=True),
        sa.Column("time_spent", sa.Integer(), nullable=True),
    )
    op.create_index("ix_test_attempts_session_id", "test_attempts", ["session_id"])

    # --- academic_uploads ---
    op.create_table(
        "academic_uploads",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("professor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("report_json", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_academic_uploads_professor_id", "academic_uploads", ["professor_id"])


def downgrade() -> None:
    op.drop_index("ix_academic_uploads_professor_id", table_name="academic_uploads")
    op.drop_table("academic_uploads")
    op.drop_index("ix_test_attempts_session_id", table_name="test_attempts")
    op.drop_table("test_attempts")
    op.drop_index("ix_test_sessions_user_id", table_name="test_sessions")
    op.drop_table("test_sessions")
    op.drop_table("question_bank")
    op.drop_table("domains")
    op.drop_table("mentorships")
    op.drop_table("mentorship_requests")
    op.drop_table("moderation_logs")
    op.drop_index("ix_answers_question_id", table_name="answers")
    op.drop_table("answers")
    op.drop_index("ix_questions_status", table_name="questions")
    op.drop_index("ix_questions_author_id", table_name="questions")
    op.drop_table("questions")
    op.drop_table("student_metrics")
    op.drop_table("user_skills")
    op.drop_table("skills")
    op.drop_table("profiles")
    op.drop_column("users", "suspended_until")
    op.drop_column("users", "suspension_reason")
    op.drop_column("users", "status")
