"""add_missing_columns_to_attendance_and_sites

Revision ID: 001
Revises: 
Create Date: 2025-12-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to sites table
    try:
        op.add_column('sites', sa.Column('lat', sa.Float(), nullable=True))
        op.add_column('sites', sa.Column('lng', sa.Float(), nullable=True))
        op.add_column('sites', sa.Column('geofence_radius_m', sa.Float(), nullable=True, server_default='100.0'))
        op.add_column('sites', sa.Column('qr_code', sa.String(length=256), nullable=True))
    except Exception:
        # Columns may already exist
        pass
    
    # Add missing columns to attendance table
    try:
        op.add_column('attendance', sa.Column('shift', sa.String(length=32), nullable=True))
        op.add_column('attendance', sa.Column('is_overtime', sa.Boolean(), nullable=False, server_default='0'))
        op.add_column('attendance', sa.Column('is_backup', sa.Boolean(), nullable=False, server_default='0'))
    except Exception:
        # Columns may already exist
        pass


def downgrade() -> None:
    # Remove columns from attendance table
    try:
        op.drop_column('attendance', 'is_backup')
        op.drop_column('attendance', 'is_overtime')
        op.drop_column('attendance', 'shift')
    except Exception:
        pass
    
    # Remove columns from sites table
    try:
        op.drop_column('sites', 'qr_code')
        op.drop_column('sites', 'geofence_radius_m')
        op.drop_column('sites', 'lng')
        op.drop_column('sites', 'lat')
    except Exception:
        pass

