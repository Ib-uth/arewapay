"""OTP send limits and escalating cooldowns for registration."""

from datetime import UTC, datetime

from app.models.registration_pending import RegistrationPending

# After send #1, wait 30s before send #2; then 60s, 120s, 180s before further sends.
RESEND_INTERVALS_SEC = (30, 60, 120, 180)
MAX_OTP_SENDS = 5


def _naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def cooldown_seconds_required(current_send_count: int) -> int | None:
    """Seconds required since last send before another OTP; None if no further sends allowed."""
    if current_send_count < 1 or current_send_count >= MAX_OTP_SENDS:
        return None
    idx = current_send_count - 1
    if idx >= len(RESEND_INTERVALS_SEC):
        return RESEND_INTERVALS_SEC[-1]
    return RESEND_INTERVALS_SEC[idx]


def seconds_until_can_resend(row: RegistrationPending, now: datetime | None = None) -> int:
    """0 if user may request another OTP now; else seconds to wait."""
    now = now or datetime.now(UTC)
    if row.otp_send_count >= MAX_OTP_SENDS:
        return 0
    need = cooldown_seconds_required(row.otp_send_count)
    if need is None:
        return 0
    last = _naive_utc(row.last_otp_sent_at)
    elapsed = (now - last).total_seconds()
    return max(0, int(need - elapsed))


def is_resend_exhausted(row: RegistrationPending) -> bool:
    return row.otp_send_count >= MAX_OTP_SENDS


def assert_can_resend_now(row: RegistrationPending, now: datetime) -> None:
    from fastapi import HTTPException, status

    if is_resend_exhausted(row):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Too many code requests. Try again later or start registration over.",
                "exhausted": True,
            },
        )
    wait = seconds_until_can_resend(row, now)
    if wait > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": f"Please wait {wait} seconds before requesting another code.",
                "wait_seconds": wait,
            },
        )
