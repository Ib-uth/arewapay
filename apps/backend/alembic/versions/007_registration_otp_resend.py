"""registration_pending OTP resend tracking

Revision ID: 007
Revises: 006
Create Date: 2026-04-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "registration_pending",
        sa.Column("otp_send_count", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "registration_pending",
        sa.Column("last_otp_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        sa.text(
            "UPDATE registration_pending SET last_otp_sent_at = created_at "
            "WHERE last_otp_sent_at IS NULL"
        )
    )
    op.alter_column(
        "registration_pending",
        "last_otp_sent_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column("registration_pending", "last_otp_sent_at")
    op.drop_column("registration_pending", "otp_send_count")
