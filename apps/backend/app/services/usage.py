from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.invoice import Invoice


def count_clients_for_owner(db: Session, owner_id: UUID) -> int:
    q = select(func.count()).select_from(Client).where(Client.owner_id == owner_id)
    return int(db.scalar(q) or 0)


def count_invoices_last_30_days(db: Session, owner_id: UUID) -> int:
    since = datetime.now(UTC) - timedelta(days=30)
    q = (
        select(func.count())
        .select_from(Invoice)
        .where(Invoice.owner_id == owner_id, Invoice.created_at >= since)
    )
    return int(db.scalar(q) or 0)
