"""RevenueCat server-to-server webhooks."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.plans import SubscriptionTier
from app.db import get_db
from app.models.user import User

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _split_ids(csv: str) -> set[str]:
    return {s.strip() for s in csv.split(",") if s.strip()}


def _verify_authorization(request: Request) -> None:
    if not settings.revenuecat_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RevenueCat webhook not configured",
        )
    auth = request.headers.get("Authorization") or ""
    expected = f"Bearer {settings.revenuecat_webhook_secret}"
    if auth != expected and auth != settings.revenuecat_webhook_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def _extract_event(payload: dict[str, Any]) -> dict[str, Any]:
    ev = payload.get("event")
    if isinstance(ev, dict):
        return ev
    return payload


def _ms_to_dt(ms: int | None) -> datetime | None:
    if ms is None:
        return None
    return datetime.fromtimestamp(ms / 1000, tz=UTC)


def _tier_for_product(product_id: str | None) -> SubscriptionTier | None:
    if not product_id:
        return None
    if product_id in _split_ids(settings.revenuecat_unlimited_product_ids):
        return SubscriptionTier.unlimited
    if product_id in _split_ids(settings.revenuecat_premium_product_ids):
        return SubscriptionTier.premium
    return None


_PURCHASE_EVENTS = frozenset(
    {
        "INITIAL_PURCHASE",
        "RENEWAL",
        "NON_RENEWING_PURCHASE",
        "PRODUCT_CHANGE",
        "UNCANCELLATION",
    }
)


@router.post("/revenuecat")
async def revenuecat_webhook(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    _verify_authorization(request)
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON") from None

    event = _extract_event(payload)
    app_user_id = event.get("app_user_id") or event.get("original_app_user_id")
    if not app_user_id:
        return {"status": "ignored"}

    try:
        uid = UUID(str(app_user_id))
    except ValueError:
        return {"status": "ignored"}

    user = db.get(User, uid)
    if not user:
        return {"status": "ignored"}

    event_type = str(event.get("type") or "")
    product_id = event.get("product_id")
    if isinstance(product_id, str):
        pass
    else:
        product_id = None

    premium_ids = _split_ids(settings.revenuecat_premium_product_ids)

    now = datetime.now(UTC)
    user.revenuecat_last_event_at = now

    if event_type == "EXPIRATION":
        user.subscription_tier = SubscriptionTier.free.value
        user.subscription_expires_at = None
        db.commit()
        return {"status": "ok"}

    if event_type in (
        "CANCELLATION",
        "SUBSCRIPTION_PAUSED",
        "BILLING_ISSUE",
    ):
        if product_id and product_id in premium_ids:
            exp = _ms_to_dt(event.get("expiration_at_ms"))
            user.subscription_expires_at = exp
        db.commit()
        return {"status": "ok"}

    tier = _tier_for_product(product_id)
    if tier is None:
        ent = event.get("entitlement_ids") or event.get("entitlement_id")
        if isinstance(ent, list) and ent:
            for e in ent:
                if "unlimited" in str(e).lower():
                    tier = SubscriptionTier.unlimited
                    break
                if "premium" in str(e).lower():
                    tier = SubscriptionTier.premium
        elif isinstance(ent, str):
            if "unlimited" in ent.lower():
                tier = SubscriptionTier.unlimited
            elif "premium" in ent.lower():
                tier = SubscriptionTier.premium

    if tier is None:
        db.commit()
        return {"status": "ignored"}

    if event_type not in _PURCHASE_EVENTS:
        db.commit()
        return {"status": "ignored"}

    user.subscription_tier = tier.value
    if tier == SubscriptionTier.unlimited:
        user.subscription_expires_at = None
    elif tier == SubscriptionTier.premium:
        user.subscription_expires_at = _ms_to_dt(event.get("expiration_at_ms"))
    db.commit()
    return {"status": "ok"}
