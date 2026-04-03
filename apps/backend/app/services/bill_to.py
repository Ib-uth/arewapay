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
    if client.email:
        lines.append(client.email)
    if client.phone:
        lines.append(client.phone)
    text = "\n".join(lines).strip()
    return text or None
