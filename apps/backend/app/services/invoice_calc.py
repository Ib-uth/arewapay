from datetime import date
from decimal import Decimal

from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.schemas.invoice import InvoiceItemIn


def compute_line_total(qty: Decimal, unit: Decimal) -> Decimal:
    return (qty * unit).quantize(Decimal("0.01"))


def _apply_subtotal_tax_discount_total(invoice: Invoice) -> None:
    subtotal = invoice.subtotal
    invoice.tax_amount = (subtotal * invoice.tax_rate).quantize(Decimal("0.01"))
    invoice.discount_amount = (subtotal * invoice.discount_rate).quantize(Decimal("0.01"))
    invoice.total = (subtotal + invoice.tax_amount - invoice.discount_amount).quantize(Decimal("0.01"))


def apply_items_and_tax(
    invoice: Invoice,
    items: list[InvoiceItemIn],
) -> None:
    subtotal = Decimal("0")
    db_items: list[InvoiceItem] = []
    for row in items:
        line = compute_line_total(row.quantity, row.unit_price)
        subtotal += line
        db_items.append(
            InvoiceItem(
                description=row.description,
                quantity=row.quantity,
                unit_price=row.unit_price,
                line_total=line,
            )
        )
    invoice.items.clear()
    for it in db_items:
        invoice.items.append(it)
    invoice.subtotal = subtotal.quantize(Decimal("0.01"))
    _apply_subtotal_tax_discount_total(invoice)


def recompute_status_from_payments(invoice: Invoice) -> None:
    total_paid = sum((p.amount for p in invoice.payments), Decimal("0"))
    if invoice.status == InvoiceStatus.draft:
        return
    if total_paid >= invoice.total:
        invoice.status = InvoiceStatus.paid
    elif total_paid > 0:
        invoice.status = InvoiceStatus.partial
    else:
        if invoice.status not in (InvoiceStatus.draft, InvoiceStatus.sent):
            invoice.status = InvoiceStatus.sent


def recalculate_totals_from_db_items(invoice: Invoice) -> None:
    subtotal = sum((i.line_total for i in invoice.items), Decimal("0"))
    invoice.subtotal = subtotal.quantize(Decimal("0.01"))
    _apply_subtotal_tax_discount_total(invoice)


def apply_overdue(invoice: Invoice, today: date | None = None) -> None:
    from datetime import date as date_cls

    t = today or date_cls.today()
    if invoice.status in (InvoiceStatus.paid, InvoiceStatus.draft):
        return
    if invoice.due_date < t and invoice.status in (
        InvoiceStatus.sent,
        InvoiceStatus.partial,
    ):
        invoice.status = InvoiceStatus.overdue
