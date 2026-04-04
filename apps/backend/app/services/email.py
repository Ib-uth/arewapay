import os
from typing import Any

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


def _email_shell(title: str, inner_html: str, cta_label: str | None = None, cta_url: str | None = None) -> str:
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
                You received this because someone signed up for ArewaPay with this address.
                If that wasn&apos;t you, you can ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _send_resend(subject: str, to_email: str, html: str) -> bool:
    if not settings.resend_api_key:
        return False
    payload: dict[str, Any] = {
        "from": settings.email_from,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }
    try:
        r = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15.0,
        )
        return r.is_success
    except Exception:
        return False


def send_verification_email(to_email: str, verify_url: str) -> bool:
    inner = f"""
      <p style="margin:0 0 12px;">Confirm your email so we know how to reach you.</p>
      <p style="margin:0;color:{SAGE_MUTED};font-size:14px;">The link below expires in 48 hours.</p>
    """
    html = _email_shell("Confirm your email", inner, "Verify email", verify_url)
    return _send_resend("Verify your ArewaPay account", to_email, html)


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
