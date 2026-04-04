"""registration_pending + user company + onboarding survey

Revision ID: 006
Revises: 005
Create Date: 2026-04-03

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "registration_pending",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("otp_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("email"),
    )
    op.add_column("users", sa.Column("company_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("onboarding_survey", sa.JSON(), nullable=True))
    op.execute(
        sa.text(
            "UPDATE users SET email_verified_at = COALESCE(email_verified_at, created_at) "
            "WHERE email_verified_at IS NULL"
        )
    )


def downgrade() -> None:
    op.drop_column("users", "onboarding_survey")
    op.drop_column("users", "company_name")
    op.drop_table("registration_pending")
