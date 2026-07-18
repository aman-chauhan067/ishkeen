"""Add ml_results to skin_analyses

Revision ID: 72cae1ae29ec
Revises: c024e9635afa
Create Date: 2026-07-11 13:05:24.607881

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '72cae1ae29ec'
down_revision: Union[str, Sequence[str], None] = 'c024e9635afa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('skin_analyses', sa.Column('ml_results', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('skin_analyses', 'ml_results')
