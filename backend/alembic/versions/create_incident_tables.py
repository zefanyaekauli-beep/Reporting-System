"""create incident tables

Revision ID: create_incident_tables
Revises: create_patrol_tables
Create Date: 2025-12-25 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'create_incident_tables'
down_revision: Union[str, None] = 'create_patrol_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if tables exist before creating
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create lk_lp_reports table
    if 'lk_lp_reports' not in existing_tables:
        op.create_table(
            'lk_lp_reports',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('site_id', sa.Integer(), nullable=False),
            sa.Column('incident_type', sa.String(length=20), nullable=False),
            sa.Column('incident_number', sa.String(length=50), nullable=False),
            sa.Column('incident_date', sa.Date(), nullable=False),
            sa.Column('reported_by', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='DRAFT'),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('location', sa.String(length=255), nullable=True),
            sa.Column('evidence_paths', sa.Text(), nullable=True),
            sa.Column('police_report_number', sa.String(length=100), nullable=True),
            sa.Column('police_station', sa.String(length=255), nullable=True),
            sa.Column('perpetrator_name', sa.String(length=255), nullable=True),
            sa.Column('perpetrator_details', sa.Text(), nullable=True),
            sa.Column('witness_names', sa.Text(), nullable=True),
            sa.Column('damage_estimate', sa.String(length=100), nullable=True),
            sa.Column('follow_up_required', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
            sa.ForeignKeyConstraint(['reported_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('incident_number')
        )
        op.create_index(op.f('ix_lk_lp_reports_id'), 'lk_lp_reports', ['id'], unique=False)
        op.create_index(op.f('ix_lk_lp_reports_company_id'), 'lk_lp_reports', ['company_id'], unique=False)
        op.create_index(op.f('ix_lk_lp_reports_site_id'), 'lk_lp_reports', ['site_id'], unique=False)
        op.create_index(op.f('ix_lk_lp_reports_incident_type'), 'lk_lp_reports', ['incident_type'], unique=False)
        op.create_index(op.f('ix_lk_lp_reports_incident_date'), 'lk_lp_reports', ['incident_date'], unique=False)
        op.create_index(op.f('ix_lk_lp_reports_status'), 'lk_lp_reports', ['status'], unique=False)

    # Create bap_reports table
    if 'bap_reports' not in existing_tables:
        op.create_table(
            'bap_reports',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('site_id', sa.Integer(), nullable=False),
            sa.Column('incident_type', sa.String(length=20), nullable=False),
            sa.Column('incident_number', sa.String(length=50), nullable=False),
            sa.Column('incident_date', sa.Date(), nullable=False),
            sa.Column('reported_by', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='DRAFT'),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('location', sa.String(length=255), nullable=True),
            sa.Column('evidence_paths', sa.Text(), nullable=True),
            sa.Column('investigation_date', sa.Date(), nullable=True),
            sa.Column('investigator_name', sa.String(length=255), nullable=True),
            sa.Column('subject_name', sa.String(length=255), nullable=True),
            sa.Column('subject_id_number', sa.String(length=100), nullable=True),
            sa.Column('investigation_findings', sa.Text(), nullable=True),
            sa.Column('recommendations', sa.Text(), nullable=True),
            sa.Column('related_incident_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
            sa.ForeignKeyConstraint(['reported_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('incident_number')
        )
        op.create_index(op.f('ix_bap_reports_id'), 'bap_reports', ['id'], unique=False)
        op.create_index(op.f('ix_bap_reports_company_id'), 'bap_reports', ['company_id'], unique=False)
        op.create_index(op.f('ix_bap_reports_site_id'), 'bap_reports', ['site_id'], unique=False)

    # Create stplk_reports table
    if 'stplk_reports' not in existing_tables:
        op.create_table(
            'stplk_reports',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('site_id', sa.Integer(), nullable=False),
            sa.Column('incident_type', sa.String(length=20), nullable=False),
            sa.Column('incident_number', sa.String(length=50), nullable=False),
            sa.Column('incident_date', sa.Date(), nullable=False),
            sa.Column('reported_by', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='DRAFT'),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('location', sa.String(length=255), nullable=True),
            sa.Column('evidence_paths', sa.Text(), nullable=True),
            sa.Column('lost_item_description', sa.Text(), nullable=False),
            sa.Column('lost_item_value', sa.String(length=100), nullable=True),
            sa.Column('lost_date', sa.Date(), nullable=True),
            sa.Column('lost_location', sa.String(length=255), nullable=True),
            sa.Column('owner_name', sa.String(length=255), nullable=True),
            sa.Column('owner_contact', sa.String(length=100), nullable=True),
            sa.Column('police_report_number', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
            sa.ForeignKeyConstraint(['reported_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('incident_number')
        )
        op.create_index(op.f('ix_stplk_reports_id'), 'stplk_reports', ['id'], unique=False)
        op.create_index(op.f('ix_stplk_reports_company_id'), 'stplk_reports', ['company_id'], unique=False)
    else:
        # Table exists, check and add missing columns
        conn = op.get_bind()
        result = conn.execute(sa.text("PRAGMA table_info(stplk_reports)"))
        columns = [row[1] for row in result]
        
        with op.batch_alter_table('stplk_reports', schema=None) as batch_op:
            if 'lost_item_value' not in columns:
                batch_op.add_column(sa.Column('lost_item_value', sa.String(length=100), nullable=True))
            if 'lost_location' not in columns:
                batch_op.add_column(sa.Column('lost_location', sa.String(length=255), nullable=True))
            if 'owner_name' not in columns:
                batch_op.add_column(sa.Column('owner_name', sa.String(length=255), nullable=True))
            if 'owner_contact' not in columns:
                batch_op.add_column(sa.Column('owner_contact', sa.String(length=100), nullable=True))

    # Create findings_reports table
    if 'findings_reports' not in existing_tables:
        op.create_table(
            'findings_reports',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('site_id', sa.Integer(), nullable=False),
            sa.Column('incident_type', sa.String(length=20), nullable=False),
            sa.Column('incident_number', sa.String(length=50), nullable=False),
            sa.Column('incident_date', sa.Date(), nullable=False),
            sa.Column('reported_by', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='DRAFT'),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('location', sa.String(length=255), nullable=True),
            sa.Column('evidence_paths', sa.Text(), nullable=True),
            sa.Column('finding_category', sa.String(length=100), nullable=True),
            sa.Column('severity_level', sa.String(length=20), nullable=True),
            sa.Column('root_cause', sa.Text(), nullable=True),
            sa.Column('corrective_action', sa.Text(), nullable=True),
            sa.Column('preventive_action', sa.Text(), nullable=True),
            sa.Column('responsible_party', sa.String(length=255), nullable=True),
            sa.Column('due_date', sa.Date(), nullable=True),
            sa.Column('resolved_date', sa.Date(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
            sa.ForeignKeyConstraint(['reported_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('incident_number')
        )
        op.create_index(op.f('ix_findings_reports_id'), 'findings_reports', ['id'], unique=False)
        op.create_index(op.f('ix_findings_reports_company_id'), 'findings_reports', ['company_id'], unique=False)
    else:
        # Table exists, check and add missing columns
        conn = op.get_bind()
        result = conn.execute(sa.text("PRAGMA table_info(findings_reports)"))
        columns = [row[1] for row in result]
        
        with op.batch_alter_table('findings_reports', schema=None) as batch_op:
            if 'resolved_date' not in columns:
                batch_op.add_column(sa.Column('resolved_date', sa.Date(), nullable=True))



def downgrade() -> None:
    # Drop incident tables if they exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()
    
    if 'findings_reports' in existing_tables:
        op.drop_index(op.f('ix_findings_reports_company_id'), table_name='findings_reports')
        op.drop_index(op.f('ix_findings_reports_id'), table_name='findings_reports')
        op.drop_table('findings_reports')
    
    if 'stplk_reports' in existing_tables:
        op.drop_index(op.f('ix_stplk_reports_company_id'), table_name='stplk_reports')
        op.drop_index(op.f('ix_stplk_reports_id'), table_name='stplk_reports')
        op.drop_table('stplk_reports')
    
    if 'bap_reports' in existing_tables:
        op.drop_index(op.f('ix_bap_reports_site_id'), table_name='bap_reports')
        op.drop_index(op.f('ix_bap_reports_company_id'), table_name='bap_reports')
        op.drop_index(op.f('ix_bap_reports_id'), table_name='bap_reports')
        op.drop_table('bap_reports')
    
    if 'lk_lp_reports' in existing_tables:
        op.drop_index(op.f('ix_lk_lp_reports_status'), table_name='lk_lp_reports')
        op.drop_index(op.f('ix_lk_lp_reports_incident_date'), table_name='lk_lp_reports')
        op.drop_index(op.f('ix_lk_lp_reports_incident_type'), table_name='lk_lp_reports')
        op.drop_index(op.f('ix_lk_lp_reports_site_id'), table_name='lk_lp_reports')
        op.drop_index(op.f('ix_lk_lp_reports_company_id'), table_name='lk_lp_reports')
        op.drop_index(op.f('ix_lk_lp_reports_id'), table_name='lk_lp_reports')
        op.drop_table('lk_lp_reports')

