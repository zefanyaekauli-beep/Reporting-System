"""fix security_reports division column default

Revision ID: fix_security_reports_division
Revises: 69a665706138
Create Date: 2025-12-12 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text


# revision identifiers, used by Alembic.
revision: str = 'fix_security_reports_division'
down_revision: Union[str, None] = 'fix_checklist_division'  # Chain after checklist fix
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add default value to division column in security_reports if needed."""
    # Get connection
    conn = op.get_bind()
    
    # Check if column exists
    inspector = inspect(conn)
    try:
        columns = [col['name'] for col in inspector.get_columns('security_reports')]
    except Exception:
        # Table might not exist yet, skip
        print("Table 'security_reports' does not exist, skipping migration")
        return
    
    if 'division' in columns:
        # Update existing rows that have NULL division to 'SECURITY' (for backward compatibility)
        conn.execute(text("UPDATE security_reports SET division = 'SECURITY' WHERE division IS NULL OR division = ''"))
        
        # Try to add server default (SQLite doesn't support ALTER COLUMN, so we'll just update existing rows)
        # For PostgreSQL/MySQL, we could add a default, but SQLite limitation means we handle it in code
        print("Updated existing security_reports rows with NULL division to 'SECURITY'")
    else:
        print("Column 'division' does not exist in security_reports table")


def downgrade() -> None:
    """No downgrade needed - we're just setting default values."""
    pass
