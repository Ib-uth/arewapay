from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class RegistrationPending(Base):
    """Holds signup data + OTP hash until email is verified."""

    __tablename__ = "registration_pending"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    otp_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    otp_send_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_otp_sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
