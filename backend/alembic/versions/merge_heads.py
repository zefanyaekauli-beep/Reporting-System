"""merge multiple heads

Revision ID: merge_heads
Revises: add_role_id_to_users, add_comprehensive_features
Create Date: 2025-01-15 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'merge_heads'
down_revision: Union[str, Sequence[str], None] = ('add_role_id_to_users', 'add_comprehensive_features')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is a merge migration - no schema changes needed
    # Both heads are already applied, this just merges the branches
    pass


def downgrade() -> None:
    # This is a merge migration - no schema changes needed
    pass
