"""add resume scoring and public profile fields

Revision ID: 010
Revises: 009
Create Date: 2026-04-29
"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("profiles", sa.Column("resume_score", sa.Float(), nullable=True))
    op.add_column(
        "profiles",
        sa.Column("resume_analysis_status", sa.String(length=20), nullable=False, server_default="not_started"),
    )
    op.add_column("profiles", sa.Column("resume_analysis_summary", sa.Text(), nullable=True))
    op.add_column("profiles", sa.Column("resume_analyzed_at", sa.DateTime(), nullable=True))
    op.add_column("profiles", sa.Column("public_slug", sa.String(length=100), nullable=True))
    op.add_column("profiles", sa.Column("is_public", sa.Boolean(), nullable=False, server_default="false"))
    op.create_index("ix_profiles_public_slug", "profiles", ["public_slug"], unique=True)


def downgrade():
    op.drop_index("ix_profiles_public_slug", table_name="profiles")
    op.drop_column("profiles", "is_public")
    op.drop_column("profiles", "public_slug")
    op.drop_column("profiles", "resume_analyzed_at")
    op.drop_column("profiles", "resume_analysis_summary")
    op.drop_column("profiles", "resume_analysis_status")
    op.drop_column("profiles", "resume_score")
