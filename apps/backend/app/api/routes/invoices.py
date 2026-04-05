import re
from datetime import date as date_cls
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.rbac import require_owner
from app.db import get_db
from app.deps.auth import CurrentUser
from app.models.client import Client
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.models.user import User
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceItemOut,
    InvoiceOut,
    InvoiceUpdate,
    PaymentCreate,
)
from app.services.bill_to import bill_to_for_invoice_pdf, format_bill_to_snapshot
from app.services.email import (
    fetch_logo_bytes,
    send_invoice_email,
    send_invoice_sender_copy_email,
)
from app.services.invoice_calc import (
    apply_items_and_tax,
    apply_overdue,
    recalculate_totals_from_db_items,
    recompute_status_from_payments,
)
from app.services.invoice_pdf import _safe_invoice_filename, build_invoice_pdf_bytes

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _derive_invoice_prefix(user: User) -> str:
    """First word from org_name, display_name, or email local-part → 3 A–Z letters, pad with X."""
    raw = (user.org_name or "").strip() or (user.display_name or "").strip()
    if not raw and user.email:
        raw = user.email.split("@", 1)[0]
    raw = raw or "INV"
    word = re.split(r"\s+", raw)[0] if raw else "INV"
    letters = "".join(c for c in word.upper() if c.isalpha())
    if len(letters) >= 3:
        return letters[:3]
    return (letters + "XXX")[:3]


def _next_invoice_number(db: Session, owner_id: UUID, prefix: str, year: int) -> str:
    pref = prefix.upper()
    pattern = re.compile(rf"^{re.escape(pref)}-{year}-(\d{{5}})$")
    rows = db.scalars(select(Invoice.invoice_number).where(Invoice.owner_id == owner_id)).all()
    max_n = 0
    for num in rows:
        m = pattern.match(num)
        if m:
            max_n = max(max_n, int(m.group(1)))
    return f"{pref}-{year}-{max_n + 1:05d}"


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
        discount_rate=inv.discount_rate,
        discount_amount=inv.discount_amount,
        total=inv.total,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        payment_terms=inv.payment_terms,
        po_number=inv.po_number,
        bill_to_snapshot=inv.bill_to_snapshot,
        notes=inv.notes,
        times_sent=inv.times_sent,
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
    issue_date = body.issue_date or date_cls.today()
    prefix = body.invoice_number_prefix or _derive_invoice_prefix(user)
    inv_num = _next_invoice_number(db, user.id, prefix, issue_date.year)
    inv = Invoice(
        owner_id=user.id,
        client_id=body.client_id,
        invoice_number=inv_num,
        status=InvoiceStatus.draft,
        currency=body.currency,
        tax_rate=body.tax_rate,
        discount_rate=body.discount_rate,
        issue_date=issue_date,
        due_date=body.due_date,
        payment_terms=body.payment_terms,
        po_number=body.po_number,
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
    if "issue_date" in data and data["issue_date"] is not None:
        inv.issue_date = data["issue_date"]
    if "tax_rate" in data and data["tax_rate"] is not None:
        inv.tax_rate = data["tax_rate"]
    if "discount_rate" in data and data["discount_rate"] is not None:
        inv.discount_rate = data["discount_rate"]
    if "payment_terms" in data:
        inv.payment_terms = data["payment_terms"]
    if "po_number" in data:
        inv.po_number = data["po_number"]
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


@router.post("/{invoice_id}/send")
def send_invoice_to_client(
    invoice_id: UUID,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> JSONResponse:
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == invoice_id, Invoice.owner_id == user.id)
        .options(
            selectinload(Invoice.items),
            selectinload(Invoice.payments),
            selectinload(Invoice.client),
        )
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client = inv.client
    if not client or not client.email:
        raise HTTPException(status_code=400, detail="Client has no email address")
    sender = (
        (user.org_name or "").strip()
        or (user.display_name or "").strip()
        or user.email.split("@", 1)[0]
    )
    item_rows = [
        (
            (it.description[:80] + "…") if len(it.description) > 80 else it.description,
            f"{inv.currency} {it.line_total.quantize(Decimal('0.01'))}",
        )
        for it in inv.items
    ]
    bill_to = bill_to_for_invoice_pdf(
        inv.bill_to_snapshot,
        client_name=client.name,
        email=client.email,
        phone=client.phone,
    )
    logo_bytes = fetch_logo_bytes(user.logo_url)
    pdf_bytes = build_invoice_pdf_bytes(
        invoice=inv,
        from_name=sender,
        from_email=user.email,
        client_name=client.name,
        bill_to_text=bill_to,
        logo_bytes=logo_bytes,
    )
    pdf_filename = f"{_safe_invoice_filename(inv.invoice_number)}.pdf"
    ok_client = send_invoice_email(
        to_email=client.email,
        sender_name=sender,
        invoice_number=inv.invoice_number,
        invoice_id=inv.id,
        currency=inv.currency,
        total=inv.total,
        due_date=inv.due_date,
        item_rows=item_rows,
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
    )
    owner_em = (user.email or "").strip().lower()
    client_em = (client.email or "").strip().lower()
    if owner_em and owner_em != client_em:
        ok_sender_copy = send_invoice_sender_copy_email(
            owner_email=user.email.strip(),
            client_email=client.email.strip(),
            invoice_number=inv.invoice_number,
            invoice_id=inv.id,
            currency=inv.currency,
            total=inv.total,
            due_date=inv.due_date,
            pdf_bytes=pdf_bytes,
            pdf_filename=pdf_filename,
        )
    else:
        ok_sender_copy = None
    inv.times_sent = int(inv.times_sent or 0) + 1
    if inv.status == InvoiceStatus.draft:
        inv.status = InvoiceStatus.sent
    db.commit()
    inv = db.scalar(
        select(Invoice)
        .where(Invoice.id == inv.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.payments))
    )
    assert inv
    payload = _invoice_to_out(inv).model_dump(mode="json")
    hdrs: dict[str, str] = {"X-Email-Sent": "true" if ok_client else "false"}
    if ok_sender_copy is None:
        hdrs["X-Sender-Copy-Sent"] = "skipped"
    else:
        hdrs["X-Sender-Copy-Sent"] = "true" if ok_sender_copy else "false"
    return JSONResponse(content=payload, headers=hdrs)


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
        raise HTTPException(
            status_code=400,
            detail="Send the invoice before logging amounts received.",
        )
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
