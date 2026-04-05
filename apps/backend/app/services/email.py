import base64
import html
import os
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID

import httpx

from app.config import settings

ACCENT = "#9b2915"
FOOTER = "#19231A"
CHARCOAL = "#171e19"
SAGE_MUTED = "#6b7a6e"

_last_test_otp: str | None = None


def _capture_otp_for_tests(otp: str) -> None:
    global _last_test_otp
    if os.environ.get("PYTEST_CURRENT_TEST"):
        _last_test_otp = otp


def consume_last_test_otp() -> str | None:
    """Used by tests after POST /auth/register/request."""
    global _last_test_otp
    v = _last_test_otp
    _last_test_otp = None
    return v


def _email_shell(
    title: str,
    inner_html: str,
    cta_label: str | None = None,
    cta_url: str | None = None,
    *,
    footer_html: str | None = None,
) -> str:
    cta_block = ""
    if cta_label and cta_url:
        cta_block = f"""
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
          <tr>
            <td style="border-radius:8px;background:{ACCENT};">
              <a href="{cta_url}" style="display:inline-block;padding:14px 28px;font-family:Georgia,serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                {cta_label}
              </a>
            </td>
          </tr>
        </table>
        """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f2ef;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f2ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(23,30,25,0.08);">
          <tr>
            <td style="padding:28px 32px 8px;background:{FOOTER};">
              <p style="margin:0;font-family:'Anton',Impact,Helvetica,sans-serif;font-size:28px;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;">
                ArewaPay<span style="color:{ACCENT};">.</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 36px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:{CHARCOAL};line-height:1.25;">
                {title}
              </h1>
              <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:{CHARCOAL};">
                {inner_html}
              </div>
              {cta_block}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#faf9f7;border-top:1px solid rgba(23,30,25,0.08);">
              <p style="margin:0;font-family:system-ui,sans-serif;font-size:12px;color:{SAGE_MUTED};line-height:1.5;">
                {footer_html if footer_html is not None else (
                    "You received this because someone signed up for ArewaPay with this address. "
                    "If that wasn&apos;t you, you can ignore this message."
                )}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _send_resend(
    subject: str,
    to_email: str,
    html: str,
    *,
    attachments: list[dict[str, str]] | None = None,
) -> bool:
    if not settings.resend_api_key:
        return False
    payload: dict[str, Any] = {
        "from": settings.email_from,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }
    if attachments:
        payload["attachments"] = attachments
    try:
        r = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30.0,
        )
        return r.is_success
    except Exception:
        return False


def _build_pdf_attachments(pdf_bytes: bytes | None, pdf_filename: str) -> list[dict[str, str]] | None:
    if not pdf_bytes:
        return None
    safe_name = pdf_filename.strip() or "invoice.pdf"
    if not safe_name.lower().endswith(".pdf"):
        safe_name = f"{safe_name}.pdf"
    return [
        {
            "filename": safe_name,
            "content": base64.b64encode(pdf_bytes).decode("ascii"),
        }
    ]


def _logo_bytes_from_uploads_path(logo_url: str) -> bytes | None:
    """Read logo from API-local uploads (Docker-friendly; avoids HTTP to frontend URL)."""
    u = logo_url.strip()
    if not u.startswith("/uploads/"):
        return None
    rel = u.removeprefix("/uploads/").lstrip("/")
    if not rel or ".." in rel.split("/"):
        return None
    base = Path("uploads").resolve()
    path = (base / rel).resolve()
    try:
        path.relative_to(base)
    except ValueError:
        return None
    if path.is_file() and path.stat().st_size <= 5_000_000:
        return path.read_bytes()
    return None


def fetch_logo_bytes(logo_url: str | None) -> bytes | None:
    """Load logo for PDF embedding: local file first, then HTTP (api_public_url or absolute)."""
    if not logo_url or not str(logo_url).strip():
        return None
    url = str(logo_url).strip()
    disk = _logo_bytes_from_uploads_path(url)
    if disk is not None:
        return disk
    if url.startswith("/"):
        url = f"{settings.api_public_url.rstrip('/')}{url}"
    if not url.startswith("http"):
        return None
    try:
        r = httpx.get(url, timeout=10.0, follow_redirects=True)
        if r.is_success and r.content and len(r.content) < 5_000_000:
            return r.content
    except Exception:
        pass
    return None


def send_verification_email(to_email: str, verify_url: str) -> bool:
    inner = f"""
      <p style="margin:0 0 12px;">Confirm your email so we know how to reach you.</p>
      <p style="margin:0;color:{SAGE_MUTED};font-size:14px;">The link below expires in 48 hours.</p>
    """
    html = _email_shell("Confirm your email", inner, "Verify email", verify_url)
    return _send_resend("Verify your ArewaPay account", to_email, html)


def send_invoice_email(
    *,
    to_email: str,
    sender_name: str,
    invoice_number: str,
    invoice_id: UUID,
    currency: str,
    total: Decimal,
    due_date: date,
    item_rows: list[tuple[str, str]],
    pdf_bytes: bytes | None = None,
    pdf_filename: str = "invoice.pdf",
) -> bool:
    """HTML invoice notification; returns False if Resend is not configured."""
    view_url = f"{settings.public_app_url.rstrip('/')}/invoices/{invoice_id}"
    total_s = f"{currency} {total.quantize(Decimal('0.01'))}"
    rows_html = "".join(
        f"<tr><td style='padding:8px;border-bottom:1px solid #e2e8f0;'>{desc}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;'>{amt}</td></tr>"
        for desc, amt in item_rows[:15]
    )
    pdf_note = (
        f"<p style='margin:0 0 12px;color:{SAGE_MUTED};font-size:14px;'>"
        f"A PDF copy is attached for your records.</p>"
        if pdf_bytes
        else ""
    )
    inner = f"""
      <p style="margin:0 0 16px;">Please find your invoice below.</p>
      {pdf_note}
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:{CHARCOAL};"><strong>Invoice</strong></td>
          <td style="padding:8px 0;text-align:right;font-size:14px;">{invoice_number}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:{SAGE_MUTED};">Due date</td>
          <td style="padding:8px 0;text-align:right;">{due_date.isoformat()}</td>
        </tr>
      </table>
      <p style="margin:20px 0 12px;font-size:22px;font-weight:700;color:{CHARCOAL};">Total due: {total_s}</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr>
            <th align="left" style="padding:8px;border-bottom:2px solid {CHARCOAL};font-size:12px;">Item</th>
            <th align="right" style="padding:8px;border-bottom:2px solid {CHARCOAL};font-size:12px;">Amount</th>
          </tr>
        </thead>
        <tbody>{rows_html}</tbody>
      </table>
    """
    client_footer = (
        f"You received this invoice through ArewaPay on behalf of {html.escape(sender_name)}."
    )
    email_html = _email_shell(
        f"Invoice {invoice_number} from {sender_name}",
        inner,
        "View Invoice",
        view_url,
        footer_html=client_footer,
    )
    attachments = _build_pdf_attachments(pdf_bytes, pdf_filename)
    return _send_resend(
        f"Invoice {invoice_number} from {sender_name}",
        to_email,
        email_html,
        attachments=attachments,
    )


def send_invoice_sender_copy_email(
    *,
    owner_email: str,
    client_email: str,
    invoice_number: str,
    invoice_id: UUID,
    currency: str,
    total: Decimal,
    due_date: date,
    pdf_bytes: bytes,
    pdf_filename: str,
) -> bool:
    """Notify the workspace user that an invoice was emailed; includes the same PDF attachment."""
    view_url = f"{settings.public_app_url.rstrip('/')}/invoices/{invoice_id}"
    total_s = f"{currency} {total.quantize(Decimal('0.01'))}"
    ce = html.escape(client_email)
    inner = f"""
      <p style="margin:0 0 16px;">We sent invoice <strong>{html.escape(invoice_number)}</strong> to
      <strong>{ce}</strong>.</p>
      <p style="margin:0 0 8px;">Total: <strong>{html.escape(total_s)}</strong></p>
      <p style="margin:0 0 16px;color:{SAGE_MUTED};font-size:14px;">Due date: {due_date.isoformat()}</p>
      <p style="margin:0;color:{SAGE_MUTED};font-size:14px;">The same PDF attached to your client&apos;s
      email is attached here for your records.</p>
    """
    sender_footer = (
        "This confirmation was sent because you emailed an invoice from your ArewaPay workspace."
    )
    shell = _email_shell(
        f"Invoice {invoice_number} sent",
        inner,
        "Open in ArewaPay",
        view_url,
        footer_html=sender_footer,
    )
    attachments = _build_pdf_attachments(pdf_bytes, pdf_filename)
    if not attachments:
        return False
    return _send_resend(
        f"Copy: Invoice {invoice_number} sent to {client_email}",
        owner_email,
        shell,
        attachments=attachments,
    )


def send_registration_otp_email(to_email: str, otp: str) -> bool:
    _capture_otp_for_tests(otp)
    inner = f"""
      <p style="margin:0 0 20px;">Use this one-time code to finish creating your workspace:</p>
      <div style="text-align:center;margin:24px 0;padding:20px 16px;background:#f4f2ef;border-radius:12px;border:1px solid rgba(155,41,21,0.2);">
        <span style="font-family:ui-monospace,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:0.25em;color:{ACCENT};">{otp}</span>
      </div>
      <p style="margin:0;color:{SAGE_MUTED};font-size:14px;">This code expires in 15 minutes. Never share it with anyone.</p>
    """
    html = _email_shell("Your ArewaPay sign-up code", inner)
    return _send_resend("Your ArewaPay verification code", to_email, html)
