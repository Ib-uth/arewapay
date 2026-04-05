"""Format client details for invoice bill-to snapshot."""
from __future__ import annotations

from app.models.client import Client


def format_bill_to_snapshot(client: Client) -> str | None:
    lines: list[str] = []
    if client.name:
        lines.append(client.name)
    if client.company:
        lines.append(client.company)
    addr: list[str] = []
    if client.address_line1:
        addr.append(client.address_line1)
    if client.address_line2:
        addr.append(client.address_line2)
    city_line_parts: list[str] = []
    if client.city:
        city_line_parts.append(client.city)
    if client.region:
        city_line_parts.append(client.region)
    if client.postal_code:
        city_line_parts.append(client.postal_code)
    if city_line_parts:
        addr.append(", ".join(city_line_parts))
    if client.country_code:
        addr.append(client.country_code.upper())
    lines.extend(addr)
    text = "\n".join(lines).strip()
    return text or None


def strip_contact_lines_from_bill_to(
    text: str | None,
    *,
    email: str | None,
    phone: str | None,
) -> str:
    """Drop lines matching client email or phone (legacy snapshots may still include them)."""
    if not text or not str(text).strip():
        return ""
    em = (email or "").strip().lower()
    ph = (phone or "").strip()
    ph_digits = "".join(c for c in ph if c.isdigit()) if ph else ""

    def drop_line(raw: str) -> bool:
        t = raw.strip()
        if not t:
            return True
        if em and t.lower() == em:
            return True
        if ph and t == ph:
            return True
        if len(ph_digits) >= 7 and "".join(c for c in t if c.isdigit()) == ph_digits:
            return True
        return False

    kept = [ln for ln in text.splitlines() if not drop_line(ln)]
    return "\n".join(kept).strip()


def bill_to_for_invoice_pdf(
    snapshot: str | None,
    *,
    client_name: str,
    email: str | None,
    phone: str | None,
) -> str:
    """Bill-to block for PDFs: no email/phone; cleans stored snapshot."""
    cleaned = strip_contact_lines_from_bill_to(snapshot, email=email, phone=phone)
    return cleaned or client_name
