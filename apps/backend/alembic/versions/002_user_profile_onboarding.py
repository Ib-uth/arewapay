"""user profile fields and onboarding

Revision ID: 002
Revises: 001
Create Date: 2026-04-03

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("display_name", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("country_code", sa.String(2), nullable=True))
    op.add_column("users", sa.Column("currency_code", sa.String(3), nullable=True))
    op.add_column("users", sa.Column("theme", sa.String(16), nullable=True))
    op.add_column(
        "users",
        sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed_at")
    op.drop_column("users", "theme")
    op.drop_column("users", "currency_code")
    op.drop_column("users", "country_code")
    op.drop_column("users", "display_name")
