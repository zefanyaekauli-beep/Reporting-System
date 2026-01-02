"""add_assets_table

Revision ID: ddc2fb76e0fb
Revises: create_incident_tables
Create Date: 2025-12-26 20:36:50.229172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ddc2fb76e0fb'
down_revision: Union[str, None] = 'create_incident_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create assets table
    op.create_table('assets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('company_id', sa.Integer(), nullable=False),
    sa.Column('site_id', sa.Integer(), nullable=False),
    sa.Column('asset_name', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
    sa.Column('category', sa.String(length=100), nullable=True),
    sa.Column('condition', sa.String(length=50), nullable=True),
    sa.Column('detail', sa.Text(), nullable=True),
    sa.Column('remark', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ),
    sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assets_asset_name'), 'assets', ['asset_name'], unique=False)
    op.create_index(op.f('ix_assets_category'), 'assets', ['category'], unique=False)
    op.create_index(op.f('ix_assets_company_id'), 'assets', ['company_id'], unique=False)
    op.create_index(op.f('ix_assets_condition'), 'assets', ['condition'], unique=False)
    op.create_index(op.f('ix_assets_id'), 'assets', ['id'], unique=False)
    op.create_index(op.f('ix_assets_site_id'), 'assets', ['site_id'], unique=False)
    
    # Add zone_name column to cctv_cameras
    # Use raw SQL to avoid batch mode issues
    try:
        op.execute('ALTER TABLE cctv_cameras ADD COLUMN zone_name VARCHAR(255)')
    except Exception:
        # Column might already exist
        pass
    
    try:
        op.create_index(op.f('ix_cctv_cameras_zone_name'), 'cctv_cameras', ['zone_name'], unique=False)
    except Exception:
        # Index might already exist
        pass


def downgrade() -> None:
    # Drop assets table
    op.drop_index(op.f('ix_assets_site_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_condition'), table_name='assets')
    op.drop_index(op.f('ix_assets_company_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_category'), table_name='assets')
    op.drop_index(op.f('ix_assets_asset_name'), table_name='assets')
    op.drop_table('assets')
    
    # Remove zone_name column from cctv_cameras
    # SQLite doesn't support DROP COLUMN easily, so we skip it
    # In production, you'd need to recreate the table without the column
    pass
