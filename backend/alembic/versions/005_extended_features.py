"""extended features

Revision ID: 005
Revises: 004
Create Date: 2026-04-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # Colleges
    op.create_table('colleges',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )

    # Add college_id to users
    op.add_column('users', sa.Column('college_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_users_college', 'users', 'colleges', ['college_id'], ['id'])

    # Add community_points to students
    op.add_column('students', sa.Column('community_points', sa.Integer(), nullable=False, server_default='0'))

    # Correction requests
    op.create_table('correction_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('current_value', sa.Text(), nullable=True),
        sa.Column('requested_value', sa.Text(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('review_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['students.id']),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_correction_requests_student_id', 'correction_requests', ['student_id'])

    # Campus interviews
    op.create_table('campus_interviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=255), nullable=False),
        sa.Column('ctc', sa.Float(), nullable=True),
        sa.Column('job_description', sa.Text(), nullable=True),
        sa.Column('link', sa.String(length=500), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Interview applications
    op.create_table('interview_applications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('interview_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_url', sa.String(length=500), nullable=True),
        sa.Column('is_interested', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['interview_id'], ['campus_interviews.id']),
        sa.ForeignKeyConstraint(['student_id'], ['students.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_applications_interview_id', 'interview_applications', ['interview_id'])
    op.create_index('ix_interview_applications_student_id', 'interview_applications', ['student_id'])

    # Test violations
    op.create_table('test_violations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('violation_type', sa.String(length=50), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['test_sessions.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_test_violations_session_id', 'test_violations', ['session_id'])

    # Add proctoring fields to test_sessions
    op.add_column('test_sessions', sa.Column('proctoring_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('test_sessions', sa.Column('violation_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    op.drop_column('test_sessions', 'violation_count')
    op.drop_column('test_sessions', 'proctoring_enabled')
    op.drop_index('ix_test_violations_session_id')
    op.drop_table('test_violations')
    op.drop_index('ix_interview_applications_student_id')
    op.drop_index('ix_interview_applications_interview_id')
    op.drop_table('interview_applications')
    op.drop_table('campus_interviews')
    op.drop_index('ix_correction_requests_student_id')
    op.drop_table('correction_requests')
    op.drop_column('students', 'community_points')
    op.drop_constraint('fk_users_college', 'users', type_='foreignkey')
    op.drop_column('users', 'college_id')
    op.drop_table('colleges')
