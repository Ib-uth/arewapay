"""invoice issue_date payment_terms po_number discount

Revision ID: 010
Revises: 009
Create Date: 2026-04-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "invoices",
        sa.Column("issue_date", sa.Date(), nullable=False, server_default=sa.text("CURRENT_DATE")),
    )
    op.add_column("invoices", sa.Column("payment_terms", sa.String(64), nullable=True))
    op.add_column("invoices", sa.Column("po_number", sa.String(64), nullable=True))
    op.add_column(
        "invoices",
        sa.Column("discount_rate", sa.Numeric(6, 4), nullable=False, server_default="0"),
    )
    op.add_column(
        "invoices",
        sa.Column("discount_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
    )
    op.alter_column("invoices", "issue_date", server_default=None)


def downgrade() -> None:
    op.drop_column("invoices", "discount_amount")
    op.drop_column("invoices", "discount_rate")
    op.drop_column("invoices", "po_number")
    op.drop_column("invoices", "payment_terms")
    op.drop_column("invoices", "issue_date")
