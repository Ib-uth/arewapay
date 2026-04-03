import httpx

from app.config import settings


def send_verification_email(to_email: str, verify_url: str) -> bool:
    if not settings.resend_api_key:
        return False
    payload = {
        "from": settings.email_from,
        "to": [to_email],
        "subject": "Verify your ArewaPay account",
        "html": f'<p>Click to verify your email:</p><p><a href="{verify_url}">Verify email</a></p>',
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
