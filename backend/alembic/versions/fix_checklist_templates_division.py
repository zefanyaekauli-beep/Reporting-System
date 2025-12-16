"""fix checklist_templates division column

Revision ID: fix_checklist_division
Revises: 038e8b3bbc26
Create Date: 2025-12-10 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text


# revision identifiers, used by Alembic.
revision: str = 'fix_checklist_division'
down_revision: Union[str, None] = '038e8b3bbc26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add division column to checklist_templates if it doesn't exist."""
    # Get connection
    conn = op.get_bind()
    
    # Check if column exists (SQLite specific)
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('checklist_templates')]
    
    if 'division' not in columns:
        # Add the column with a default value for existing rows
        # SQLite doesn't support adding NOT NULL columns directly, so we:
        # 1. Add column as nullable first
        # 2. Update existing rows
        # 3. Make it NOT NULL (SQLite limitation - we'll just add it as nullable)
        op.add_column('checklist_templates', 
                     sa.Column('division', sa.String(length=32), nullable=True, server_default='SECURITY'))
        
        # Update existing rows to have 'SECURITY' as default
        conn.execute(text("UPDATE checklist_templates SET division = 'SECURITY' WHERE division IS NULL"))
        
        # Create index
        op.create_index(op.f('ix_checklist_templates_division'), 'checklist_templates', ['division'], unique=False)
        print("Added 'division' column to checklist_templates table")
    else:
        print("Column 'division' already exists in checklist_templates table")


def downgrade() -> None:
    """Remove division column from checklist_templates."""
    # Get connection
    conn = op.get_bind()
    
    # Check if column exists
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('checklist_templates')]
    
    if 'division' in columns:
        op.drop_index(op.f('ix_checklist_templates_division'), table_name='checklist_templates')
        op.drop_column('checklist_templates', 'division')
        print("Removed 'division' column from checklist_templates table")

