"""create mcq proctoring tables

Revision ID: 009
Revises: 008
Create Date: 2026-04-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mcq_warnings",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "attempt_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mcq_attempts.id"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("students.id"),
            nullable=False,
        ),
        sa.Column("warning_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_mcq_warnings_attempt_id", "mcq_warnings", ["attempt_id"])
    op.create_index("ix_mcq_warnings_student_id", "mcq_warnings", ["student_id"])
    op.create_index("ix_mcq_warnings_created_at", "mcq_warnings", ["created_at"])

    op.create_table(
        "mcq_emotion_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "attempt_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mcq_attempts.id"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("students.id"),
            nullable=False,
        ),
        sa.Column("emotion", sa.String(length=30), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("face_detected", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("face_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_mcq_emotion_logs_attempt_id", "mcq_emotion_logs", ["attempt_id"])
    op.create_index("ix_mcq_emotion_logs_student_id", "mcq_emotion_logs", ["student_id"])
    op.create_index("ix_mcq_emotion_logs_created_at", "mcq_emotion_logs", ["created_at"])


def downgrade():
    op.drop_index("ix_mcq_emotion_logs_created_at")
    op.drop_index("ix_mcq_emotion_logs_student_id")
    op.drop_index("ix_mcq_emotion_logs_attempt_id")
    op.drop_table("mcq_emotion_logs")
    op.drop_index("ix_mcq_warnings_created_at")
    op.drop_index("ix_mcq_warnings_student_id")
    op.drop_index("ix_mcq_warnings_attempt_id")
    op.drop_table("mcq_warnings")
