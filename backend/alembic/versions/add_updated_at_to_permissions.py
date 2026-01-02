"""add updated_at to permissions

Revision ID: add_updated_at_permissions
Revises: merge_heads
Create Date: 2025-12-16 09:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = 'add_updated_at_permissions'
down_revision: Union[str, None] = 'merge_heads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name, column_name):
    """Check if column exists in table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except:
        return False


def upgrade() -> None:
    # Check if permissions table exists and if updated_at column is missing
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = inspector.get_table_names()
    
    if 'permissions' in tables:
        if not column_exists('permissions', 'updated_at'):
            # Add updated_at column with default value
            op.add_column('permissions', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
            
            # Update existing rows to have updated_at = created_at
            conn = bind.connect()
            try:
                conn.execute(text("UPDATE permissions SET updated_at = created_at WHERE updated_at IS NULL"))
                conn.commit()
            except Exception as e:
                print(f"Warning: Could not update existing permissions: {e}")
                conn.rollback()
            finally:
                conn.close()
        else:
            print("Column 'updated_at' already exists in permissions table")


def downgrade() -> None:
    # Remove updated_at column if it exists
    if column_exists('permissions', 'updated_at'):
        op.drop_column('permissions', 'updated_at')
