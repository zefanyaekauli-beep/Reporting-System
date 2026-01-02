"""create_compliance_tables

Revision ID: create_compliance_001
Revises: 0622a611d594
Create Date: 2025-12-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'create_compliance_001'
down_revision: Union[str, None] = 'add_updated_at_permissions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create compliance_checklists table
    op.create_table(
        'compliance_checklists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('checklist_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_compliance_checklists_id'), 'compliance_checklists', ['id'], unique=False)
    op.create_index(op.f('ix_compliance_checklists_company_id'), 'compliance_checklists', ['company_id'], unique=False)
    op.create_index(op.f('ix_compliance_checklists_site_id'), 'compliance_checklists', ['site_id'], unique=False)

    # Create audit_schedules table
    op.create_table(
        'audit_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('audit_type', sa.String(length=100), nullable=False),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('scheduled_time', sa.String(length=8), nullable=True),
        sa.Column('auditor_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='SCHEDULED'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_schedules_id'), 'audit_schedules', ['id'], unique=False)
    op.create_index(op.f('ix_audit_schedules_company_id'), 'audit_schedules', ['company_id'], unique=False)
    op.create_index(op.f('ix_audit_schedules_site_id'), 'audit_schedules', ['site_id'], unique=False)
    op.create_index(op.f('ix_audit_schedules_scheduled_date'), 'audit_schedules', ['scheduled_date'], unique=False)
    op.create_index(op.f('ix_audit_schedules_status'), 'audit_schedules', ['status'], unique=False)

    # Create audit_executions table
    op.create_table(
        'audit_executions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('audit_schedule_id', sa.Integer(), nullable=False),
        sa.Column('checklist_id', sa.Integer(), nullable=True),
        sa.Column('compliance_status', sa.String(length=20), nullable=False),
        sa.Column('findings', sa.Text(), nullable=True),
        sa.Column('corrective_action', sa.Text(), nullable=True),
        sa.Column('executed_by', sa.Integer(), nullable=False),
        sa.Column('executed_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['audit_schedule_id'], ['audit_schedules.id'], ),
        sa.ForeignKeyConstraint(['checklist_id'], ['compliance_checklists.id'], ),
        sa.ForeignKeyConstraint(['executed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_executions_id'), 'audit_executions', ['id'], unique=False)
    op.create_index(op.f('ix_audit_executions_audit_schedule_id'), 'audit_executions', ['audit_schedule_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_audit_executions_audit_schedule_id'), table_name='audit_executions')
    op.drop_index(op.f('ix_audit_executions_id'), table_name='audit_executions')
    op.drop_table('audit_executions')
    
    op.drop_index(op.f('ix_audit_schedules_status'), table_name='audit_schedules')
    op.drop_index(op.f('ix_audit_schedules_scheduled_date'), table_name='audit_schedules')
    op.drop_index(op.f('ix_audit_schedules_site_id'), table_name='audit_schedules')
    op.drop_index(op.f('ix_audit_schedules_company_id'), table_name='audit_schedules')
    op.drop_index(op.f('ix_audit_schedules_id'), table_name='audit_schedules')
    op.drop_table('audit_schedules')
    
    op.drop_index(op.f('ix_compliance_checklists_site_id'), table_name='compliance_checklists')
    op.drop_index(op.f('ix_compliance_checklists_company_id'), table_name='compliance_checklists')
    op.drop_index(op.f('ix_compliance_checklists_id'), table_name='compliance_checklists')
    op.drop_table('compliance_checklists')

