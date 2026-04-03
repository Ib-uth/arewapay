from datetime import date as date_cls
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.rbac import require_owner
from app.db import get_db
from app.deps.auth import CurrentUser
from app.models.client import Client
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceItemOut,
    InvoiceOut,
    InvoiceUpdate,
    PaymentCreate,
)
from app.services.invoice_calc import (
    apply_items_and_tax,
    apply_overdue,
    recalculate_totals_from_db_items,
    recompute_status_from_payments,
)
from app.services.bill_to import format_bill_to_snapshot
from app.services.plan_enforcement import assert_can_create_invoice

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _next_invoice_number(db: Session, owner_id: UUID) -> str:
    q = select(func.count()).select_from(Invoice).where(Invoice.owner_id == owner_id)
    n = db.scalar(q) or 0
    year = date_cls.today().year
    return f"INV-{year}-{(n + 1):05d}"


def _invoice_to_out(inv: Invoice) -> InvoiceOut:
    items = [
        InvoiceItemOut(
            id=i.id,
            description=i.description,
            quantity=i.quantity,
            unit_price=i.unit_price,
            line_total=i.line_total,
        )
        for i in inv.items
    ]
    return InvoiceOut(
        id=inv.id,
        owner_id=inv.owner_id,
        client_id=inv.client_id,
        invoice_number=inv.invoice_number,
        status=inv.status,
        currency=inv.currency,
        tax_rate=inv.tax_rate,
        subtotal=inv.subtotal,
        tax_amount=inv.tax_amount,
        total=inv.total,
        due_date=inv.due_date,
        bill_to_snapshot=inv.bill_to_snapshot,
        notes=inv.notes,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        items=items,
    )


@router.get("", response_model=list[InvoiceOut])
def list_invoices(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[InvoiceOut]:
    rows = db.scalars(
        select(Invoice)
        .where(Invoice.owner_id == user.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
        .order_by(Invoice.created_at.desc())
    ).all()
    return [_invoice_to_out(inv) for inv in rows]


@router.post("", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    body: InvoiceCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> InvoiceOut:
    client = db.get(Client, body.client_id)
    if not client or client.owner_id != user.id:
        raise HTTPException(status_code=400, detail="Invalid client")
    assert_can_create_invoice(db, user)
    inv = Invoice(
        owner_id=user.id,
        client_id=body.client_id,
        invoice_number=_next_invoice_number(db, user.id),
        status=body.status,
        currency=body.currency,
        tax_rate=body.tax_rate,
        due_date=body.due_date,
        bill_to_snapshot=format_bill_to_snapshot(client),
        notes=body.notes,
    )
    apply_items_and_tax(inv, body.items)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == inv.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    assert inv
    return _invoice_to_out(inv)


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: UUID,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> InvoiceOut:
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == invoice_id, Invoice.owner_id == user.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _invoice_to_out(inv)


@router.patch("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(
    invoice_id: UUID,
    body: InvoiceUpdate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> InvoiceOut:
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == invoice_id, Invoice.owner_id == user.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    data = body.model_dump(exclude_unset=True)
    if "due_date" in data and data["due_date"] is not None:
        inv.due_date = data["due_date"]
    if "tax_rate" in data and data["tax_rate"] is not None:
        inv.tax_rate = data["tax_rate"]
    if "notes" in data:
        inv.notes = data["notes"]
    if "status" in data and data["status"] is not None:
        inv.status = data["status"]
    if body.items is not None:
        apply_items_and_tax(inv, body.items)
    else:
        recalculate_totals_from_db_items(inv)
    recompute_status_from_payments(inv)
    apply_overdue(inv)
    db.commit()
    db.refresh(inv)
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == inv.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    assert inv
    return _invoice_to_out(inv)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: UUID,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    require_owner(user)
    inv = db.scalar(select(Invoice).where(Invoice.id == invoice_id, Invoice.owner_id == user.id))
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv)
    db.commit()


@router.post("/{invoice_id}/payments", response_model=InvoiceOut)
def add_payment(
    invoice_id: UUID,
    body: PaymentCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> InvoiceOut:
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == invoice_id, Invoice.owner_id == user.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv.status == InvoiceStatus.draft:
        raise HTTPException(status_code=400, detail="Send invoice before recording payment")
    paid = sum((p.amount for p in inv.payments), Decimal("0"))
    outstanding = inv.total - paid
    if body.amount > outstanding:
        raise HTTPException(status_code=400, detail="Amount exceeds outstanding balance")
    p = Payment(
        invoice_id=inv.id,
        amount=body.amount,
        note=body.note,
        reference=body.reference,
    )
    inv.payments.append(p)
    recompute_status_from_payments(inv)
    apply_overdue(inv)
    db.commit()
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == inv.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    assert inv
    return _invoice_to_out(inv)
