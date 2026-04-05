"""remove subscription and RevenueCat columns from users

Revision ID: 008
Revises: 007
Create Date: 2026-04-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "revenuecat_last_event_at")
    op.drop_column("users", "subscription_expires_at")
    op.drop_column("users", "subscription_tier")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("subscription_tier", sa.String(16), nullable=False, server_default="free"),
    )
    op.add_column("users", sa.Column("subscription_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("revenuecat_last_event_at", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("users", "subscription_tier", server_default=None)
