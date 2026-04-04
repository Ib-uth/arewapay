from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.plans import SubscriptionTier, limits_for, parse_tier
from app.models.user import User
from app.services.usage import count_clients_for_owner, count_invoices_last_30_days


def effective_tier(user: User) -> SubscriptionTier:
    tier = parse_tier(user.subscription_tier)
    if tier != SubscriptionTier.premium:
        return tier
    exp = user.subscription_expires_at
    if exp is None:
        return tier
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=UTC)
    if exp < datetime.now(UTC):
        return SubscriptionTier.free
    return tier


def assert_can_add_client(db: Session, user: User) -> None:
    tier = effective_tier(user)
    lim = limits_for(tier).max_clients
    if lim is None:
        return
    n = count_clients_for_owner(db, user.id)
    if n >= lim:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Client limit reached ({lim}). Remove a client or contact support "
                "if you need more capacity."
            ),
        )


def assert_can_create_invoice(db: Session, user: User) -> None:
    tier = effective_tier(user)
    lim = limits_for(tier).max_invoices_per_30_days
    if lim is None:
        return
    n = count_invoices_last_30_days(db, user.id)
    if n >= lim:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Invoice limit reached ({lim} per rolling 30 days). "
                "Try again next month or contact support."
            ),
        )
