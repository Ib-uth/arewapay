"""Subscription tier limits."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SubscriptionTier(str, Enum):
    free = "free"
    premium = "premium"
    unlimited = "unlimited"


@dataclass(frozen=True)
class TierLimits:
    max_clients: int | None  # None = unlimited
    max_invoices_per_30_days: int | None  # None = unlimited


def limits_for(tier: SubscriptionTier) -> TierLimits:
    if tier == SubscriptionTier.unlimited:
        return TierLimits(max_clients=None, max_invoices_per_30_days=None)
    if tier == SubscriptionTier.premium:
        return TierLimits(max_clients=100, max_invoices_per_30_days=2000)
    return TierLimits(max_clients=5, max_invoices_per_30_days=20)


def parse_tier(value: str | None) -> SubscriptionTier:
    if not value:
        return SubscriptionTier.free
    try:
        return SubscriptionTier(value)
    except ValueError:
        return SubscriptionTier.free
