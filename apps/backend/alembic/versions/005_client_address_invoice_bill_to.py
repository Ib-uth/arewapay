"""client address fields + invoice bill_to_snapshot

Revision ID: 005
Revises: 004
Create Date: 2026-04-03

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("clients", sa.Column("address_line1", sa.String(255), nullable=True))
    op.add_column("clients", sa.Column("address_line2", sa.String(255), nullable=True))
    op.add_column("clients", sa.Column("city", sa.String(128), nullable=True))
    op.add_column("clients", sa.Column("region", sa.String(128), nullable=True))
    op.add_column("clients", sa.Column("postal_code", sa.String(32), nullable=True))
    op.add_column("clients", sa.Column("country_code", sa.String(2), nullable=True))
    op.add_column("invoices", sa.Column("bill_to_snapshot", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("invoices", "bill_to_snapshot")
    op.drop_column("clients", "country_code")
    op.drop_column("clients", "postal_code")
    op.drop_column("clients", "region")
    op.drop_column("clients", "city")
    op.drop_column("clients", "address_line2")
    op.drop_column("clients", "address_line1")
