"""A4 invoice PDF with ArewaPay brand styling (aligned with app + transactional email)."""

from __future__ import annotations

from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image as RLImage
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.invoice import Invoice

ACCENT = HexColor("#9b2915")
FOOTER = HexColor("#19231A")
CHARCOAL = HexColor("#171e19")
SAGE = HexColor("#6b7a6e")
PAPER = HexColor("#f4f2ef")
ROW_ALT = HexColor("#f1f5f9")
BORDER = HexColor("#e2e8f0")
WHITE = colors.white


def _esc(s: str) -> str:
    return (
        (s or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )


def _money(amount: Decimal, currency: str) -> str:
    q = amount.quantize(Decimal("0.01"))
    return f"{currency} {q:,.2f}"


def _safe_invoice_filename(invoice_number: str) -> str:
    bad = '\\/:*?"<>|'
    return "".join(c if c not in bad else "-" for c in invoice_number.strip()) or "invoice"


def build_invoice_pdf_bytes(
    *,
    invoice: Invoice,
    from_name: str,
    from_email: str,
    client_name: str,
    bill_to_text: str,
    logo_bytes: bytes | None = None,
) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=11 * mm,
        bottomMargin=14 * mm,
    )
    w = doc.width
    styles = getSampleStyleSheet()

    p_white_lg = ParagraphStyle(
        "whlg",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=WHITE,
        leading=16,
    )
    p_white_title = ParagraphStyle(
        "whtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=WHITE,
        leading=22,
        alignment=TA_RIGHT,
        spaceBefore=0,
    )
    p_muted_caps = ParagraphStyle(
        "mutcap",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        textColor=SAGE,
        leading=10,
        spaceAfter=4,
        letterSpacing=0.5,
    )
    p_body = ParagraphStyle(
        "body9",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=CHARCOAL,
        leading=12,
        alignment=TA_LEFT,
    )
    p_th = ParagraphStyle(
        "th",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        textColor=SAGE,
        leading=10,
        spaceAfter=2,
    )
    p_cell = ParagraphStyle(
        "cell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        textColor=CHARCOAL,
        leading=11,
    )
    p_cell_b = ParagraphStyle(
        "cellb",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        textColor=CHARCOAL,
        leading=11,
        alignment=TA_RIGHT,
    )

    story: list = []

    # —— Header band (matches email shell: dark strip + accent) ——
    brand_left = (
        '<font color="white" face="Helvetica-Bold" size="14">ArewaPay</font>'
        '<font color="#9b2915" face="Helvetica-Bold" size="14">.</font>'
    )
    if logo_bytes:
        try:
            bio = BytesIO(logo_bytes)
            im = RLImage(bio)
            iw, ih = im.imageWidth, im.imageHeight
            if iw and ih:
                max_w, max_h = 42 * mm, 16 * mm
                scale = min(max_w / iw, max_h / ih)
                im.drawWidth = iw * scale
                im.drawHeight = ih * scale
            left_cell = im
        except Exception:
            left_cell = Paragraph(brand_left, p_white_lg)
    else:
        left_cell = Paragraph(brand_left, p_white_lg)

    status_label = str(invoice.status.value if hasattr(invoice.status, "value") else invoice.status)
    right_block = (
        '<para align="right">'
        '<font color="white" face="Helvetica-Bold" size="18">INVOICE</font><br/>'
        f'<font color="#e2e8e0" size="9">{_esc(invoice.invoice_number)}</font><br/>'
        f'<font color="#e2e8e0" size="9">Issue {_esc(str(invoice.issue_date))} · Due '
        f'{_esc(str(invoice.due_date))}</font><br/>'
        f'<font color="#e2e8e0" size="8">{_esc(status_label.upper())}</font></para>'
    )
    right_cell = Paragraph(right_block, p_white_title)

    header_tbl = Table([[left_cell, right_cell]], colWidths=[w * 0.52, w * 0.48])
    header_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), FOOTER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(header_tbl)
    story.append(Spacer(1, 5 * mm))

    # —— From / Bill to ——
    bill_block = _esc((bill_to_text or "").strip() or client_name)
    from_block = _esc(f"{from_name}\n{from_email}")
    two = Table(
        [
            [
                Paragraph('<font color="#6b7a6e">FROM</font>', p_muted_caps),
                Paragraph('<font color="#6b7a6e">BILL TO</font>', p_muted_caps),
            ],
            [Paragraph(from_block, p_body), Paragraph(bill_block, p_body)],
        ],
        colWidths=[w * 0.5 - 4, w * 0.5 - 4],
    )
    two.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(two)
    story.append(Spacer(1, 4 * mm))

    # —— Terms / PO / currency strip ——
    detail_bits: list[str] = []
    if invoice.po_number:
        detail_bits.append(f"<b>PO:</b> {_esc(invoice.po_number)}")
    if invoice.payment_terms:
        detail_bits.append(f"<b>Terms:</b> {_esc(invoice.payment_terms)}")
    detail_bits.append(f"<b>Currency:</b> {_esc(invoice.currency)}")
    details_html = " &nbsp;|&nbsp; ".join(detail_bits)
    det_style = ParagraphStyle("det", parent=p_body, fontSize=8, textColor=SAGE)
    det = Table([[Paragraph(details_html, det_style)]], [w])
    det.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(det)
    story.append(Spacer(1, 5 * mm))

    # —— Line items ——
    cw_idx = 16
    cw_qty = 36
    cw_unit = 0.22 * w
    cw_amt = 0.22 * w
    cw_desc = w - cw_idx - cw_qty - cw_unit - cw_amt

    thead = [
        Paragraph("#", p_th),
        Paragraph("DESCRIPTION", p_th),
        Paragraph("QTY", ParagraphStyle("thc", parent=p_th, alignment=TA_RIGHT)),
        Paragraph("UNIT", ParagraphStyle("thc", parent=p_th, alignment=TA_RIGHT)),
        Paragraph("AMOUNT", ParagraphStyle("thc", parent=p_th, alignment=TA_RIGHT)),
    ]
    data = [thead]
    items_sorted = sorted(invoice.items, key=lambda x: x.id)
    for i, it in enumerate(items_sorted):
        data.append(
            [
                Paragraph(str(i + 1), p_cell),
                Paragraph(_esc(it.description), p_cell),
                Paragraph(
                    _esc(str(it.quantity)),
                    ParagraphStyle("pc", parent=p_cell, alignment=TA_RIGHT),
                ),
                Paragraph(_esc(_money(it.unit_price, invoice.currency)), p_cell),
                Paragraph(_esc(_money(it.line_total, invoice.currency)), p_cell_b),
            ]
        )

    items_tbl = Table(data, colWidths=[cw_idx, cw_desc, cw_qty, cw_unit, cw_amt], repeatRows=1)
    ts = [
        ("LINEBELOW", (0, 0), (-1, 0), 1.25, CHARCOAL),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    for r in range(1, len(data)):
        if r % 2 == 0:
            ts.append(("BACKGROUND", (0, r), (-1, r), ROW_ALT))
        ts.append(("TOPPADDING", (0, r), (-1, r), 6))
        ts.append(("BOTTOMPADDING", (0, r), (-1, r), 6))
        ts.append(("LINEBELOW", (0, r), (-1, r), 0.25, BORDER))
    items_tbl.setStyle(TableStyle(ts))
    story.append(items_tbl)
    story.append(Spacer(1, 6 * mm))

    # —— Totals ——
    tax_pct = (invoice.tax_rate * Decimal(100)).quantize(Decimal("0.1"))
    if tax_pct == tax_pct.to_integral():
        tax_pct_s = str(int(tax_pct))
    else:
        tax_pct_s = str(tax_pct).rstrip("0").rstrip(".")

    tot_rows = [
        ["Subtotal", _money(invoice.subtotal, invoice.currency)],
    ]
    if invoice.discount_amount and invoice.discount_amount > 0:
        tot_rows.append(["Discount", f"−{_money(invoice.discount_amount, invoice.currency)}"])
    tot_rows.append([f"Tax (VAT {tax_pct_s}%)", _money(invoice.tax_amount, invoice.currency)])
    tot_rows.append(["Total", _money(invoice.total, invoice.currency)])

    tw = w * 0.42
    tot_tbl_data = []
    for idx, (lab, val) in enumerate(tot_rows):
        is_grand = idx == len(tot_rows) - 1
        ls = ParagraphStyle(
            "grand" if is_grand else "tvr",
            parent=p_body,
            alignment=TA_RIGHT,
            fontSize=12 if is_grand else 9,
            fontName="Helvetica-Bold" if is_grand else "Helvetica",
            textColor=CHARCOAL if not is_grand else ACCENT,
            spaceBefore=6 if is_grand else 0,
        )
        vs = ParagraphStyle(
            "grandv" if is_grand else "tvv",
            parent=p_body,
            alignment=TA_RIGHT,
            fontSize=12 if is_grand else 9,
            fontName="Helvetica-Bold",
            textColor=ACCENT if is_grand else CHARCOAL,
        )
        tot_tbl_data.append([Paragraph(_esc(lab), ls), Paragraph(_esc(val), vs)])

    tot_tbl = Table(tot_tbl_data, colWidths=[tw * 0.45, tw * 0.55])
    tot_tbl.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("LINEABOVE", (0, -1), (-1, -1), 1.5, CHARCOAL),
                ("TOPPADDING", (0, -1), (-1, -1), 8),
            ]
        )
    )
    wrap = Table([[tot_tbl]], colWidths=[w], hAlign="RIGHT")
    wrap.setStyle(TableStyle([("ALIGN", (0, 0), (0, 0), "RIGHT")]))
    story.append(wrap)
    story.append(Spacer(1, 8 * mm))

    # —— Footer ——
    if invoice.notes:
        story.append(
            Table(
                [
                    [
                        Paragraph(
                            f'<b>Notes:</b> {_esc(invoice.notes)}',
                            ParagraphStyle("note", parent=p_body, fontSize=9),
                        )
                    ]
                ],
                [w],
            )
        )
        story.append(Spacer(1, 4 * mm))

    foot_style = ParagraphStyle(
        "ft", parent=styles["Normal"], alignment=TA_LEFT, fontSize=8, textColor=SAGE
    )
    foot = Paragraph(
        '<font color="#6b7a6e" size="9"><i>Thank you for your business.</i><br/>'
        "Invoice generated by ArewaPay</font>",
        foot_style,
    )
    story.append(foot)

    doc.build(story)
    return buf.getvalue()


__all__ = ["build_invoice_pdf_bytes", "_safe_invoice_filename"]
