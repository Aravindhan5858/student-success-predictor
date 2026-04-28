"""migrate question_bank mcq rows to mcq_questions

Revision ID: 007
Revises: 006
Create Date: 2026-04-28
"""
from alembic import op

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Copy MCQ entries from question_bank into mcq_questions
    op.execute(
        """
        INSERT INTO mcq_questions (id, domain, question_text, options, correct_answer, difficulty, explanation, created_at)
        SELECT q.id, d.name, q.prompt, q.options, q.answer, q.difficulty, NULL, q.created_at
        FROM question_bank q
        JOIN domains d ON q.domain_id = d.id
        WHERE q.type = 'mcq'
        ON CONFLICT (id) DO NOTHING
        """
    )


def downgrade():
    op.execute(
        """
        DELETE FROM mcq_questions
        WHERE id IN (SELECT id FROM question_bank WHERE type = 'mcq')
        """
    )
