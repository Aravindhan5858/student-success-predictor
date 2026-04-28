"""add resume sections to profiles

Revision ID: 004
Revises: 003
Create Date: 2026-04-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('profiles', sa.Column('education', JSONB, nullable=False, server_default='[]'))
    op.add_column('profiles', sa.Column('experience', JSONB, nullable=False, server_default='[]'))
    op.add_column('profiles', sa.Column('projects', JSONB, nullable=False, server_default='[]'))
    op.add_column('profiles', sa.Column('certifications', JSONB, nullable=False, server_default='[]'))


def downgrade():
    op.drop_column('profiles', 'certifications')
    op.drop_column('profiles', 'projects')
    op.drop_column('profiles', 'experience')
    op.drop_column('profiles', 'education')
