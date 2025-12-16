"""add role_id to users

Revision ID: add_role_id_to_users
Revises: fix_security_reports_division
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_role_id_to_users'
down_revision: Union[str, None] = 'fix_security_reports_division'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add role_id column to users table if it doesn't exist
    # Check if column exists first (for SQLite compatibility)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'role_id' not in columns:
        op.add_column('users', sa.Column('role_id', sa.Integer(), nullable=True))
        op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)
        # Add foreign key constraint if roles table exists
        try:
            roles_columns = [col['name'] for col in inspector.get_columns('roles')]
            if roles_columns:  # roles table exists
                op.create_foreign_key('fk_users_role_id', 'users', 'roles', ['role_id'], ['id'])
        except:
            # roles table doesn't exist, skip foreign key
            pass


def downgrade() -> None:
    # Remove role_id column from users table
    op.drop_index(op.f('ix_users_role_id'), table_name='users')
    try:
        op.drop_constraint('fk_users_role_id', 'users', type_='foreignkey')
    except:
        pass
    op.drop_column('users', 'role_id')

