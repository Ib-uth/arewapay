"""user org_name and logo_url

Revision ID: 009
Revises: 008
Create Date: 2026-04-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("org_name", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("logo_url", sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "logo_url")
    op.drop_column("users", "org_name")
