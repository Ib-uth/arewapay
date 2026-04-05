from datetime import date
from decimal import Decimal
from uuid import uuid4

from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.services.invoice_pdf import _safe_invoice_filename, build_invoice_pdf_bytes


def test_build_invoice_pdf_bytes():
    inv = Invoice(
        id=uuid4(),
        owner_id=uuid4(),
        client_id=uuid4(),
        invoice_number="TST-2026-00001",
        status=InvoiceStatus.sent,
        currency="NGN",
        tax_rate=Decimal("0.075"),
        subtotal=Decimal("100000"),
        tax_amount=Decimal("7500"),
        discount_rate=Decimal("0"),
        discount_amount=Decimal("0"),
        total=Decimal("107500"),
        issue_date=date(2026, 4, 1),
        due_date=date(2026, 4, 15),
        payment_terms="Net 30",
        po_number="PO-1",
        bill_to_snapshot="Buyer Co",
        notes="Thanks.",
    )
    inv.items = [
        InvoiceItem(
            id=uuid4(),
            invoice_id=inv.id,
            description="Consulting",
            quantity=Decimal("2"),
            unit_price=Decimal("50000"),
            line_total=Decimal("100000"),
        )
    ]
    raw = build_invoice_pdf_bytes(
        invoice=inv,
        from_name="Seller LLC",
        from_email="seller@example.com",
        client_name="Buyer Co",
        bill_to_text="Buyer Co",
        logo_bytes=None,
    )
    assert raw.startswith(b"%PDF")
    assert len(raw) > 500


def test_safe_invoice_filename():
    assert _safe_invoice_filename("INV-2026-00001") == "INV-2026-00001"
    assert ".." not in _safe_invoice_filename('bad/name')
