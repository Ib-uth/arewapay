from collections import defaultdict
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps.auth import CurrentUser
from app.models.client import Client
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.schemas.dashboard import DashboardSummary, RecentTransaction, TopClientRow

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> DashboardSummary:
    inv_rows = db.scalars(
        select(Invoice)
        .where(Invoice.owner_id == user.id)
        .options(selectinload(Invoice.payments))
    ).all()
    total_invoiced = sum((i.total for i in inv_rows), Decimal("0"))
    total_paid = Decimal("0")
    for inv in inv_rows:
        total_paid += sum((p.amount for p in inv.payments), Decimal("0"))
    outstanding = (total_invoiced - total_paid).quantize(Decimal("0.01"))
    overdue_count = 0
    today = datetime.now(UTC).date()
    for inv in inv_rows:
        if inv.status == InvoiceStatus.draft:
            continue
        paid_on_inv = sum((p.amount for p in inv.payments), Decimal("0"))
        if paid_on_inv >= inv.total:
            continue
        if inv.due_date < today and inv.status in (
            InvoiceStatus.sent,
            InvoiceStatus.partial,
            InvoiceStatus.overdue,
        ):
            overdue_count += 1

    pay_rows = db.scalars(
        select(Payment)
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .where(Invoice.owner_id == user.id)
        .options(selectinload(Payment.invoice))
        .order_by(Payment.paid_at.desc())
        .limit(10)
    ).all()
    recent: list[RecentTransaction] = []
    for p in pay_rows:
        inv_num = p.invoice.invoice_number if p.invoice else ""
        recent.append(
            RecentTransaction(
                id=p.id,
                type="payment",
                description=f"Payment — invoice {inv_num}",
                amount=str(p.amount),
                occurred_at=p.paid_at,
            )
        )

    return DashboardSummary(
        total_invoiced=str(total_invoiced.quantize(Decimal("0.01"))),
        total_paid=str(total_paid.quantize(Decimal("0.01"))),
        outstanding=str(outstanding),
        overdue_count=overdue_count,
        recent_transactions=recent,
    )


@router.get("/revenue-by-month")
def revenue_by_month(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    year: int = Query(..., ge=2000, le=2100),
) -> dict:
    rows = db.execute(
        select(
            func.extract("month", Payment.paid_at).label("m"),
            func.coalesce(func.sum(Payment.amount), 0),
        )
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .where(Invoice.owner_id == user.id, func.extract("year", Payment.paid_at) == year)
        .group_by(func.extract("month", Payment.paid_at))
        .order_by(func.extract("month", Payment.paid_at))
    ).all()
    by_month: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    for m, amt in rows:
        by_month[int(m)] = Decimal(str(amt))
    data = [
        {"month": m, "revenue": str(by_month[m].quantize(Decimal("0.01")))} for m in range(1, 13)
    ]
    return {"year": year, "months": data}


@router.get("/top-clients", response_model=list[TopClientRow])
def top_clients(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(5, ge=1, le=50),
) -> list[TopClientRow]:
    total = func.coalesce(func.sum(Payment.amount), 0).label("total_revenue")
    rows = db.execute(
        select(Client.id, Client.name, total)
        .join(Invoice, Invoice.client_id == Client.id)
        .join(Payment, Payment.invoice_id == Invoice.id)
        .where(Client.owner_id == user.id)
        .group_by(Client.id, Client.name)
        .order_by(total.desc())
        .limit(limit)
    ).all()
    return [
        TopClientRow(
            client_id=row.id,
            client_name=row.name,
            total_revenue=str(Decimal(str(row.total_revenue)).quantize(Decimal("0.01"))),
        )
        for row in rows
    ]
