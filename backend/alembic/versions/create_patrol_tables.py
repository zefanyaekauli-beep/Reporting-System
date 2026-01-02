"""create patrol tables only

Revision ID: create_patrol_tables
Revises: create_compliance_001
Create Date: 2025-12-25 01:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'create_patrol_tables'
down_revision: Union[str, None] = 'create_compliance_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if tables exist before creating
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create patrol_schedules table if not exists
    if 'patrol_schedules' not in existing_tables:
        op.create_table(
            'patrol_schedules',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('site_id', sa.Integer(), nullable=False),
            sa.Column('route_id', sa.Integer(), nullable=False),
            sa.Column('scheduled_date', sa.Date(), nullable=False),
            sa.Column('scheduled_time', sa.String(length=8), nullable=False),
            sa.Column('frequency', sa.String(length=20), nullable=False, server_default='ONCE'),
            sa.Column('recurrence_end_date', sa.Date(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
            sa.Column('created_by', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_patrol_schedules_id'), 'patrol_schedules', ['id'], unique=False)
        op.create_index(op.f('ix_patrol_schedules_company_id'), 'patrol_schedules', ['company_id'], unique=False)
        op.create_index(op.f('ix_patrol_schedules_site_id'), 'patrol_schedules', ['site_id'], unique=False)
        op.create_index(op.f('ix_patrol_schedules_scheduled_date'), 'patrol_schedules', ['scheduled_date'], unique=False)
    else:
        # Table exists, check if recurrence_end_date column exists and add if missing
        conn = op.get_bind()
        result = conn.execute(sa.text("PRAGMA table_info(patrol_schedules)"))
        columns = [row[1] for row in result]
        if 'recurrence_end_date' not in columns:
            with op.batch_alter_table('patrol_schedules', schema=None) as batch_op:
                batch_op.add_column(sa.Column('recurrence_end_date', sa.Date(), nullable=True))

    # Create patrol_assignments table if not exists
    if 'patrol_assignments' not in existing_tables:
        op.create_table(
            'patrol_assignments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('schedule_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('is_lead', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='ASSIGNED'),
            sa.Column('assigned_at', sa.DateTime(), nullable=False),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['schedule_id'], ['patrol_schedules.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_patrol_assignments_id'), 'patrol_assignments', ['id'], unique=False)
        op.create_index(op.f('ix_patrol_assignments_schedule_id'), 'patrol_assignments', ['schedule_id'], unique=False)
        op.create_index(op.f('ix_patrol_assignments_user_id'), 'patrol_assignments', ['user_id'], unique=False)
        op.create_index(op.f('ix_patrol_assignments_status'), 'patrol_assignments', ['status'], unique=False)
    else:
        # Table exists, check if assigned_at column exists and add if missing
        conn = op.get_bind()
        result = conn.execute(sa.text("PRAGMA table_info(patrol_assignments)"))
        columns = [row[1] for row in result]
        if 'assigned_at' not in columns:
            with op.batch_alter_table('patrol_assignments', schema=None) as batch_op:
                batch_op.add_column(sa.Column('assigned_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))

    # Create patrol_logs table if not exists
    if 'patrol_logs' not in existing_tables:
        op.create_table(
            'patrol_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('assignment_id', sa.Integer(), nullable=False),
            sa.Column('checkpoint_id', sa.Integer(), nullable=False),
            sa.Column('scanned_at', sa.DateTime(), nullable=False),
            sa.Column('latitude', sa.Float(), nullable=True),
            sa.Column('longitude', sa.Float(), nullable=True),
            sa.Column('photo_path', sa.String(length=512), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('anomaly_detected', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('anomaly_details', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['assignment_id'], ['patrol_assignments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['checkpoint_id'], ['patrol_checkpoints.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_patrol_logs_id'), 'patrol_logs', ['id'], unique=False)
        op.create_index(op.f('ix_patrol_logs_assignment_id'), 'patrol_logs', ['assignment_id'], unique=False)

    # Create patrol_reports table if not exists
    if 'patrol_reports' not in existing_tables:
        op.create_table(
            'patrol_reports',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('assignment_id', sa.Integer(), nullable=False),
            sa.Column('report_date', sa.Date(), nullable=False),
            sa.Column('summary', sa.Text(), nullable=True),
            sa.Column('incidents_found', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('checkpoints_scanned', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('created_by', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['assignment_id'], ['patrol_assignments.id'], ),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_patrol_reports_id'), 'patrol_reports', ['id'], unique=False)
        op.create_index(op.f('ix_patrol_reports_assignment_id'), 'patrol_reports', ['assignment_id'], unique=False)
        op.create_index(op.f('ix_patrol_reports_report_date'), 'patrol_reports', ['report_date'], unique=False)


def downgrade() -> None:
    # Drop patrol tables if they exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()
    
    if 'patrol_reports' in existing_tables:
        op.drop_index(op.f('ix_patrol_reports_report_date'), table_name='patrol_reports')
        op.drop_index(op.f('ix_patrol_reports_assignment_id'), table_name='patrol_reports')
        op.drop_index(op.f('ix_patrol_reports_id'), table_name='patrol_reports')
        op.drop_table('patrol_reports')
    
    if 'patrol_logs' in existing_tables:
        op.drop_index(op.f('ix_patrol_logs_assignment_id'), table_name='patrol_logs')
        op.drop_index(op.f('ix_patrol_logs_id'), table_name='patrol_logs')
        op.drop_table('patrol_logs')
    
    if 'patrol_assignments' in existing_tables:
        op.drop_index(op.f('ix_patrol_assignments_status'), table_name='patrol_assignments')
        op.drop_index(op.f('ix_patrol_assignments_user_id'), table_name='patrol_assignments')
        op.drop_index(op.f('ix_patrol_assignments_schedule_id'), table_name='patrol_assignments')
        op.drop_index(op.f('ix_patrol_assignments_id'), table_name='patrol_assignments')
        op.drop_table('patrol_assignments')
    
    if 'patrol_schedules' in existing_tables:
        op.drop_index(op.f('ix_patrol_schedules_scheduled_date'), table_name='patrol_schedules')
        op.drop_index(op.f('ix_patrol_schedules_site_id'), table_name='patrol_schedules')
        op.drop_index(op.f('ix_patrol_schedules_company_id'), table_name='patrol_schedules')
        op.drop_index(op.f('ix_patrol_schedules_id'), table_name='patrol_schedules')
        op.drop_table('patrol_schedules')

