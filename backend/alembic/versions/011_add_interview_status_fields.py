"""add interview and application status fields

Revision ID: 011
Revises: 010
Create Date: 2026-04-29
"""
from alembic import op
import sqlalchemy as sa

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("campus_interviews", sa.Column("status", sa.String(length=20), nullable=False, server_default="open"))
    op.add_column("interview_applications", sa.Column("status", sa.String(length=20), nullable=False, server_default="applied"))


def downgrade():
    op.drop_column("interview_applications", "status")
    op.drop_column("campus_interviews", "status")
