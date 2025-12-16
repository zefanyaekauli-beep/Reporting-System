"""add comprehensive feature models

Revision ID: add_comprehensive_features
Revises: fix_security_reports_division
Create Date: 2025-12-12 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite


# revision identifiers, used by Alembic.
revision: str = 'add_comprehensive_features'
down_revision: Union[str, None] = 'fix_security_reports_division'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ========== CCTV Cameras ==========
    op.create_table('cctv_cameras',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('stream_url', sa.String(length=512), nullable=False),
        sa.Column('camera_type', sa.String(length=32), nullable=True),
        sa.Column('stream_type', sa.String(length=32), nullable=True),
        sa.Column('brand', sa.String(length=128), nullable=True),
        sa.Column('model', sa.String(length=128), nullable=True),
        sa.Column('resolution', sa.String(length=32), nullable=True),
        sa.Column('username', sa.String(length=128), nullable=True),
        sa.Column('password', sa.String(length=128), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_recording', sa.Boolean(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cctv_cameras_id'), 'cctv_cameras', ['id'], unique=False)
    op.create_index(op.f('ix_cctv_cameras_company_id'), 'cctv_cameras', ['company_id'], unique=False)
    op.create_index(op.f('ix_cctv_cameras_site_id'), 'cctv_cameras', ['site_id'], unique=False)

    # ========== Employees ==========
    op.create_table('employees',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('nik', sa.String(length=32), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=128), nullable=True),
        sa.Column('last_name', sa.String(length=128), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('place_of_birth', sa.String(length=128), nullable=True),
        sa.Column('gender', sa.String(length=16), nullable=True),
        sa.Column('blood_type', sa.String(length=8), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=128), nullable=True),
        sa.Column('postal_code', sa.String(length=16), nullable=True),
        sa.Column('employee_number', sa.String(length=64), nullable=True),
        sa.Column('position', sa.String(length=128), nullable=True),
        sa.Column('division', sa.String(length=32), nullable=True),
        sa.Column('site_id', sa.Integer(), nullable=True),
        sa.Column('department', sa.String(length=128), nullable=True),
        sa.Column('hire_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', name='employeestatus'), nullable=False),
        sa.Column('photo_path', sa.String(length=512), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_employees_id'), 'employees', ['id'], unique=False)
    op.create_index(op.f('ix_employees_company_id'), 'employees', ['company_id'], unique=False)
    op.create_index(op.f('ix_employees_nik'), 'employees', ['nik'], unique=True)
    op.create_index(op.f('ix_employees_email'), 'employees', ['email'], unique=False)
    op.create_index(op.f('ix_employees_employee_number'), 'employees', ['employee_number'], unique=True)
    op.create_index(op.f('ix_employees_status'), 'employees', ['status'], unique=False)
    op.create_index(op.f('ix_employees_site_id'), 'employees', ['site_id'], unique=False)

    # ========== Employee Contracts ==========
    op.create_table('employee_contracts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('contract_type', sa.Enum('PERMANENT', 'CONTRACT', 'INTERNSHIP', 'PART_TIME', name='contracttype'), nullable=False),
        sa.Column('contract_number', sa.String(length=128), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('base_salary', sa.Integer(), nullable=True),
        sa.Column('allowances', sa.Integer(), nullable=False),
        sa.Column('benefits', sa.Text(), nullable=True),
        sa.Column('terms', sa.Text(), nullable=True),
        sa.Column('probation_period_days', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('signed_date', sa.Date(), nullable=True),
        sa.Column('signed_by', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('contract_number')
    )
    op.create_index(op.f('ix_employee_contracts_id'), 'employee_contracts', ['id'], unique=False)
    op.create_index(op.f('ix_employee_contracts_employee_id'), 'employee_contracts', ['employee_id'], unique=False)
    op.create_index(op.f('ix_employee_contracts_start_date'), 'employee_contracts', ['start_date'], unique=False)
    op.create_index(op.f('ix_employee_contracts_end_date'), 'employee_contracts', ['end_date'], unique=False)
    op.create_index(op.f('ix_employee_contracts_status'), 'employee_contracts', ['status'], unique=False)
    op.create_index(op.f('ix_employee_contracts_contract_number'), 'employee_contracts', ['contract_number'], unique=True)

    # ========== Master Data ==========
    op.create_table('master_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('code', sa.String(length=128), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('division', sa.String(length=32), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['master_data.id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_master_data_id'), 'master_data', ['id'], unique=False)
    op.create_index(op.f('ix_master_data_category'), 'master_data', ['category'], unique=False)
    op.create_index(op.f('ix_master_data_code'), 'master_data', ['code'], unique=False)
    op.create_index(op.f('ix_master_data_company_id'), 'master_data', ['company_id'], unique=False)
    op.create_index(op.f('ix_master_data_division'), 'master_data', ['division'], unique=False)
    op.create_index(op.f('ix_master_data_is_active'), 'master_data', ['is_active'], unique=False)
    op.create_index(op.f('ix_master_data_parent_id'), 'master_data', ['parent_id'], unique=False)

    # ========== Patrol Targets ==========
    op.create_table('patrol_targets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('zone_id', sa.Integer(), nullable=True),
        sa.Column('route_id', sa.Integer(), nullable=True),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('target_checkpoints', sa.Integer(), nullable=False),
        sa.Column('target_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('target_patrols', sa.Integer(), nullable=False),
        sa.Column('completed_checkpoints', sa.Integer(), nullable=False),
        sa.Column('actual_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('completed_patrols', sa.Integer(), nullable=False),
        sa.Column('completion_percentage', sa.Float(), nullable=False),
        sa.Column('missed_checkpoints', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('notes', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patrol_targets_id'), 'patrol_targets', ['id'], unique=False)
    op.create_index(op.f('ix_patrol_targets_company_id'), 'patrol_targets', ['company_id'], unique=False)
    op.create_index(op.f('ix_patrol_targets_site_id'), 'patrol_targets', ['site_id'], unique=False)
    op.create_index(op.f('ix_patrol_targets_zone_id'), 'patrol_targets', ['zone_id'], unique=False)
    op.create_index(op.f('ix_patrol_targets_route_id'), 'patrol_targets', ['route_id'], unique=False)
    op.create_index(op.f('ix_patrol_targets_target_date'), 'patrol_targets', ['target_date'], unique=False)
    op.create_index(op.f('ix_patrol_targets_status'), 'patrol_targets', ['status'], unique=False)

    # ========== Patrol Teams ==========
    op.create_table('patrol_teams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('division', sa.String(length=32), nullable=False),
        sa.Column('team_members', sa.JSON(), nullable=False),
        sa.Column('assigned_routes', sa.JSON(), nullable=True),
        sa.Column('team_leader_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.ForeignKeyConstraint(['team_leader_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patrol_teams_id'), 'patrol_teams', ['id'], unique=False)
    op.create_index(op.f('ix_patrol_teams_company_id'), 'patrol_teams', ['company_id'], unique=False)
    op.create_index(op.f('ix_patrol_teams_site_id'), 'patrol_teams', ['site_id'], unique=False)
    op.create_index(op.f('ix_patrol_teams_division'), 'patrol_teams', ['division'], unique=False)
    op.create_index(op.f('ix_patrol_teams_is_active'), 'patrol_teams', ['is_active'], unique=False)

    # ========== Visitors ==========
    op.create_table('visitors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('company', sa.String(length=255), nullable=True),
        sa.Column('id_card_number', sa.String(length=64), nullable=True),
        sa.Column('id_card_type', sa.String(length=32), nullable=True),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('purpose', sa.String(length=255), nullable=True),
        sa.Column('category', sa.String(length=64), nullable=True),
        sa.Column('visit_date', sa.DateTime(), nullable=False),
        sa.Column('expected_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('check_in_time', sa.DateTime(), nullable=True),
        sa.Column('check_out_time', sa.DateTime(), nullable=True),
        sa.Column('is_checked_in', sa.Boolean(), nullable=False),
        sa.Column('host_user_id', sa.Integer(), nullable=True),
        sa.Column('host_name', sa.String(length=255), nullable=True),
        sa.Column('security_user_id', sa.Integer(), nullable=True),
        sa.Column('badge_number', sa.String(length=32), nullable=True),
        sa.Column('photo_path', sa.String(length=512), nullable=True),
        sa.Column('id_card_photo_path', sa.String(length=512), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['host_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['security_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_visitors_id'), 'visitors', ['id'], unique=False)
    op.create_index(op.f('ix_visitors_company_id'), 'visitors', ['company_id'], unique=False)
    op.create_index(op.f('ix_visitors_site_id'), 'visitors', ['site_id'], unique=False)
    op.create_index(op.f('ix_visitors_category'), 'visitors', ['category'], unique=False)
    op.create_index(op.f('ix_visitors_visit_date'), 'visitors', ['visit_date'], unique=False)
    op.create_index(op.f('ix_visitors_check_in_time'), 'visitors', ['check_in_time'], unique=False)
    op.create_index(op.f('ix_visitors_check_out_time'), 'visitors', ['check_out_time'], unique=False)
    op.create_index(op.f('ix_visitors_is_checked_in'), 'visitors', ['is_checked_in'], unique=False)
    op.create_index(op.f('ix_visitors_status'), 'visitors', ['status'], unique=False)

    # ========== Trainings ==========
    op.create_table('trainings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=64), nullable=True),
        sa.Column('scheduled_date', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('instructor_id', sa.Integer(), nullable=True),
        sa.Column('instructor_name', sa.String(length=255), nullable=True),
        sa.Column('max_participants', sa.Integer(), nullable=True),
        sa.Column('min_participants', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED', name='trainingstatus'), nullable=False),
        sa.Column('materials_url', sa.String(length=512), nullable=True),
        sa.Column('materials_path', sa.String(length=512), nullable=True),
        sa.Column('division', sa.String(length=32), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['instructor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trainings_id'), 'trainings', ['id'], unique=False)
    op.create_index(op.f('ix_trainings_company_id'), 'trainings', ['company_id'], unique=False)
    op.create_index(op.f('ix_trainings_site_id'), 'trainings', ['site_id'], unique=False)
    op.create_index(op.f('ix_trainings_category'), 'trainings', ['category'], unique=False)
    op.create_index(op.f('ix_trainings_scheduled_date'), 'trainings', ['scheduled_date'], unique=False)
    op.create_index(op.f('ix_trainings_status'), 'trainings', ['status'], unique=False)
    op.create_index(op.f('ix_trainings_division'), 'trainings', ['division'], unique=False)

    # ========== Training Attendances ==========
    op.create_table('training_attendances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('training_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('registered_at', sa.DateTime(), nullable=False),
        sa.Column('attendance_status', sa.Enum('REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED', name='trainingattendancestatus'), nullable=False),
        sa.Column('attended_at', sa.DateTime(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=True),
        sa.Column('completion_date', sa.DateTime(), nullable=True),
        sa.Column('certificate_url', sa.String(length=512), nullable=True),
        sa.Column('certificate_path', sa.String(length=512), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['training_id'], ['trainings.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_training_attendances_id'), 'training_attendances', ['id'], unique=False)
    op.create_index(op.f('ix_training_attendances_training_id'), 'training_attendances', ['training_id'], unique=False)
    op.create_index(op.f('ix_training_attendances_user_id'), 'training_attendances', ['user_id'], unique=False)

    # ========== Development Plans ==========
    op.create_table('development_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('development_type', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('completion_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('evaluation', sa.Text(), nullable=True),
        sa.Column('evaluation_date', sa.Date(), nullable=True),
        sa.Column('evaluated_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['evaluated_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_development_plans_id'), 'development_plans', ['id'], unique=False)
    op.create_index(op.f('ix_development_plans_company_id'), 'development_plans', ['company_id'], unique=False)
    op.create_index(op.f('ix_development_plans_user_id'), 'development_plans', ['user_id'], unique=False)
    op.create_index(op.f('ix_development_plans_target_date'), 'development_plans', ['target_date'], unique=False)
    op.create_index(op.f('ix_development_plans_status'), 'development_plans', ['status'], unique=False)

    # ========== Documents ==========
    op.create_table('documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('document_type', sa.Enum('SOP', 'WORK_INSTRUCTION', 'POLICY', 'MANUAL', 'FORM', 'OTHER', name='documenttype'), nullable=False),
        sa.Column('document_number', sa.String(length=128), nullable=True),
        sa.Column('version', sa.String(length=32), nullable=False),
        sa.Column('revision_date', sa.Date(), nullable=True),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'ARCHIVED', 'OBSOLETE', name='documentstatus'), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=128), nullable=True),
        sa.Column('category', sa.String(length=128), nullable=True),
        sa.Column('division', sa.String(length=32), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('approval_notes', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', sa.String(length=512), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_number')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
    op.create_index(op.f('ix_documents_company_id'), 'documents', ['company_id'], unique=False)
    op.create_index(op.f('ix_documents_document_type'), 'documents', ['document_type'], unique=False)
    op.create_index(op.f('ix_documents_category'), 'documents', ['category'], unique=False)
    op.create_index(op.f('ix_documents_division'), 'documents', ['division'], unique=False)
    op.create_index(op.f('ix_documents_status'), 'documents', ['status'], unique=False)
    op.create_index(op.f('ix_documents_effective_date'), 'documents', ['effective_date'], unique=False)
    op.create_index(op.f('ix_documents_document_number'), 'documents', ['document_number'], unique=True)

    # ========== Document Versions ==========
    op.create_table('document_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('version', sa.String(length=32), nullable=False),
        sa.Column('revision_date', sa.Date(), nullable=True),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('changes_made_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['changes_made_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_versions_id'), 'document_versions', ['id'], unique=False)
    op.create_index(op.f('ix_document_versions_document_id'), 'document_versions', ['document_id'], unique=False)

    # ========== Sync Queue ==========
    op.create_table('sync_queue',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('operation_type', sa.Enum('CREATE', 'UPDATE', 'DELETE', name='syncoperationtype'), nullable=False),
        sa.Column('resource_type', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('original_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY', name='syncstatus'), nullable=False),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('max_retries', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', sa.JSON(), nullable=True),
        sa.Column('has_conflict', sa.Boolean(), nullable=False),
        sa.Column('conflict_resolution', sa.String(length=32), nullable=True),
        sa.Column('device_id', sa.String(length=128), nullable=True),
        sa.Column('offline_timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sync_queue_id'), 'sync_queue', ['id'], unique=False)
    op.create_index(op.f('ix_sync_queue_user_id'), 'sync_queue', ['user_id'], unique=False)
    op.create_index(op.f('ix_sync_queue_company_id'), 'sync_queue', ['company_id'], unique=False)
    op.create_index(op.f('ix_sync_queue_operation_type'), 'sync_queue', ['operation_type'], unique=False)
    op.create_index(op.f('ix_sync_queue_resource_type'), 'sync_queue', ['resource_type'], unique=False)
    op.create_index(op.f('ix_sync_queue_status'), 'sync_queue', ['status'], unique=False)
    op.create_index(op.f('ix_sync_queue_created_at'), 'sync_queue', ['created_at'], unique=False)

    # ========== Payrolls ==========
    op.create_table('payrolls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('pay_date', sa.Date(), nullable=True),
        sa.Column('base_salary', sa.Integer(), nullable=False),
        sa.Column('overtime_hours', sa.Integer(), nullable=False),
        sa.Column('overtime_pay', sa.Integer(), nullable=False),
        sa.Column('allowances', sa.Integer(), nullable=False),
        sa.Column('bonuses', sa.Integer(), nullable=False),
        sa.Column('other_earnings', sa.Integer(), nullable=False),
        sa.Column('tax', sa.Integer(), nullable=False),
        sa.Column('insurance', sa.Integer(), nullable=False),
        sa.Column('loan_deduction', sa.Integer(), nullable=False),
        sa.Column('other_deductions', sa.Integer(), nullable=False),
        sa.Column('total_gross', sa.Integer(), nullable=False),
        sa.Column('total_deductions', sa.Integer(), nullable=False),
        sa.Column('net_pay', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'APPROVED', 'PAID', 'CANCELLED', name='payrollstatus'), nullable=False),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('invoice_number', sa.String(length=128), nullable=True),
        sa.Column('invoice_path', sa.String(length=512), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number')
    )
    op.create_index(op.f('ix_payrolls_id'), 'payrolls', ['id'], unique=False)
    op.create_index(op.f('ix_payrolls_company_id'), 'payrolls', ['company_id'], unique=False)
    op.create_index(op.f('ix_payrolls_user_id'), 'payrolls', ['user_id'], unique=False)
    op.create_index(op.f('ix_payrolls_period_start'), 'payrolls', ['period_start'], unique=False)
    op.create_index(op.f('ix_payrolls_period_end'), 'payrolls', ['period_end'], unique=False)
    op.create_index(op.f('ix_payrolls_status'), 'payrolls', ['status'], unique=False)
    op.create_index(op.f('ix_payrolls_invoice_number'), 'payrolls', ['invoice_number'], unique=True)

    # ========== Payments ==========
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('payroll_id', sa.Integer(), nullable=False),
        sa.Column('payment_method', sa.Enum('BANK_TRANSFER', 'CASH', 'E_WALLET', 'PAYMENT_GATEWAY', name='paymentmethod'), nullable=False),
        sa.Column('payment_gateway', sa.String(length=64), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.String(length=128), nullable=True),
        sa.Column('reference_number', sa.String(length=128), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', name='paymentstatus'), nullable=False),
        sa.Column('initiated_at', sa.DateTime(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('gateway_response', sa.Text(), nullable=True),
        sa.Column('gateway_url', sa.String(length=512), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_code', sa.String(length=64), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['payroll_id'], ['payrolls.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
    op.create_index(op.f('ix_payments_payroll_id'), 'payments', ['payroll_id'], unique=False)
    op.create_index(op.f('ix_payments_status'), 'payments', ['status'], unique=False)
    op.create_index(op.f('ix_payments_transaction_id'), 'payments', ['transaction_id'], unique=True)

    # ========== GPS Tracks ==========
    op.create_table('gps_tracks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('track_type', sa.String(length=32), nullable=False),
        sa.Column('track_reference_id', sa.Integer(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('altitude', sa.Float(), nullable=True),
        sa.Column('accuracy', sa.Float(), nullable=True),
        sa.Column('speed', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('device_id', sa.String(length=128), nullable=True),
        sa.Column('is_mock_location', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_gps_tracks_id'), 'gps_tracks', ['id'], unique=False)
    op.create_index(op.f('ix_gps_tracks_company_id'), 'gps_tracks', ['company_id'], unique=False)
    op.create_index(op.f('ix_gps_tracks_user_id'), 'gps_tracks', ['user_id'], unique=False)
    op.create_index(op.f('ix_gps_tracks_site_id'), 'gps_tracks', ['site_id'], unique=False)
    op.create_index(op.f('ix_gps_tracks_track_type'), 'gps_tracks', ['track_type'], unique=False)
    op.create_index(op.f('ix_gps_tracks_track_reference_id'), 'gps_tracks', ['track_reference_id'], unique=False)
    op.create_index(op.f('ix_gps_tracks_recorded_at'), 'gps_tracks', ['recorded_at'], unique=False)

    # ========== Enhance existing tables ==========
    
    # Add new columns to security_reports
    op.add_column('security_reports', sa.Column('incident_category', sa.String(length=64), nullable=True))
    op.add_column('security_reports', sa.Column('incident_level', sa.String(length=32), nullable=True))
    op.add_column('security_reports', sa.Column('incident_severity_score', sa.Integer(), nullable=True))
    op.add_column('security_reports', sa.Column('incident_details', sa.Text(), nullable=True))
    op.add_column('security_reports', sa.Column('perpetrator_name', sa.String(length=255), nullable=True))
    op.add_column('security_reports', sa.Column('perpetrator_type', sa.String(length=32), nullable=True))
    op.add_column('security_reports', sa.Column('perpetrator_details', sa.Text(), nullable=True))
    op.add_column('security_reports', sa.Column('reported_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_security_reports_incident_category'), 'security_reports', ['incident_category'], unique=False)
    op.create_index(op.f('ix_security_reports_incident_level'), 'security_reports', ['incident_level'], unique=False)
    op.create_index(op.f('ix_security_reports_reported_at'), 'security_reports', ['reported_at'], unique=False)

    # Add new columns to security_patrol_logs
    op.add_column('security_patrol_logs', sa.Column('patrol_type', sa.String(length=32), nullable=True))
    op.add_column('security_patrol_logs', sa.Column('distance_covered', sa.Float(), nullable=True))
    op.add_column('security_patrol_logs', sa.Column('steps_count', sa.Integer(), nullable=True))
    op.add_column('security_patrol_logs', sa.Column('route_id', sa.Integer(), nullable=True))
    op.add_column('security_patrol_logs', sa.Column('team_id', sa.Integer(), nullable=True))
    op.add_column('security_patrol_logs', sa.Column('gps_track_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_security_patrol_logs_route_id'), 'security_patrol_logs', ['route_id'], unique=False)
    op.create_index(op.f('ix_security_patrol_logs_team_id'), 'security_patrol_logs', ['team_id'], unique=False)

    # Add new columns to shifts
    op.add_column('shifts', sa.Column('scheduled_start_time', sa.DateTime(), nullable=True))
    op.add_column('shifts', sa.Column('scheduled_end_time', sa.DateTime(), nullable=True))
    op.add_column('shifts', sa.Column('actual_start_time', sa.DateTime(), nullable=True))
    op.add_column('shifts', sa.Column('actual_end_time', sa.DateTime(), nullable=True))
    op.add_column('shifts', sa.Column('overtime_hours', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('shifts', sa.Column('break_duration_minutes', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('shifts', sa.Column('shift_category', sa.String(length=32), nullable=True))

    # Add new columns to shift_handovers
    op.add_column('shift_handovers', sa.Column('handover_type', sa.String(length=32), nullable=True))
    op.add_column('shift_handovers', sa.Column('priority_items', sa.JSON(), nullable=True))
    op.add_column('shift_handovers', sa.Column('pending_tasks', sa.JSON(), nullable=True))
    
    # ========== RBAC Tables ==========
    op.create_table('permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('resource', sa.String(length=64), nullable=False),
        sa.Column('action', sa.String(length=32), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)
    op.create_index(op.f('ix_permissions_resource'), 'permissions', ['resource'], unique=False)
    op.create_index(op.f('ix_permissions_action'), 'permissions', ['action'], unique=False)
    
    op.create_table('roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('display_name', sa.String(length=128), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)
    
    op.create_table('user_permissions',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'permission_id')
    )
    
    op.create_table('role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )
    
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('resource_type', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_company_id'), 'audit_logs', ['company_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_type'), 'audit_logs', ['resource_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_id'), 'audit_logs', ['resource_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    
    # Add role_id to users if not exists
    try:
        op.add_column('users', sa.Column('role_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_users_role', 'users', 'roles', ['role_id'], ['id'])
        op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)
    except Exception:
        # Column might already exist
        pass


def downgrade() -> None:
    # Drop new tables
    op.drop_table('gps_tracks')
    op.drop_table('payments')
    op.drop_table('payrolls')
    op.drop_table('sync_queue')
    op.drop_table('document_versions')
    op.drop_table('documents')
    op.drop_table('development_plans')
    op.drop_table('training_attendances')
    op.drop_table('trainings')
    op.drop_table('visitors')
    op.drop_table('patrol_teams')
    op.drop_table('patrol_targets')
    op.drop_table('master_data')
    op.drop_table('employee_contracts')
    op.drop_table('employees')
    op.drop_table('cctv_cameras')
    
    # Remove columns from existing tables
    op.drop_column('shift_handovers', 'pending_tasks')
    op.drop_column('shift_handovers', 'priority_items')
    op.drop_column('shift_handovers', 'handover_type')
    op.drop_column('shifts', 'shift_category')
    op.drop_column('shifts', 'break_duration_minutes')
    op.drop_column('shifts', 'overtime_hours')
    op.drop_column('shifts', 'actual_end_time')
    op.drop_column('shifts', 'actual_start_time')
    op.drop_column('shifts', 'scheduled_end_time')
    op.drop_column('shifts', 'scheduled_start_time')
    op.drop_index(op.f('ix_security_patrol_logs_team_id'), table_name='security_patrol_logs')
    op.drop_index(op.f('ix_security_patrol_logs_route_id'), table_name='security_patrol_logs')
    op.drop_column('security_patrol_logs', 'gps_track_id')
    op.drop_column('security_patrol_logs', 'team_id')
    op.drop_column('security_patrol_logs', 'route_id')
    op.drop_column('security_patrol_logs', 'steps_count')
    op.drop_column('security_patrol_logs', 'distance_covered')
    op.drop_column('security_patrol_logs', 'patrol_type')
    op.drop_index(op.f('ix_security_reports_reported_at'), table_name='security_reports')
    op.drop_index(op.f('ix_security_reports_incident_level'), table_name='security_reports')
    op.drop_index(op.f('ix_security_reports_incident_category'), table_name='security_reports')
    op.drop_column('security_reports', 'reported_at')
    op.drop_column('security_reports', 'perpetrator_details')
    op.drop_column('security_reports', 'perpetrator_type')
    op.drop_column('security_reports', 'perpetrator_name')
    op.drop_column('security_reports', 'incident_details')
    op.drop_column('security_reports', 'incident_severity_score')
    op.drop_column('security_reports', 'incident_level')
    op.drop_column('security_reports', 'incident_category')
    
    # Drop RBAC tables
    op.drop_table('audit_logs')
    op.drop_table('role_permissions')
    op.drop_table('user_permissions')
    op.drop_table('roles')
    op.drop_table('permissions')
    
    # Remove role_id from users
    try:
        op.drop_index(op.f('ix_users_role_id'), table_name='users')
        op.drop_constraint('fk_users_role', 'users', type_='foreignkey')
        op.drop_column('users', 'role_id')
    except Exception:
        pass

