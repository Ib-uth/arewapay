import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorCode, Purchases } from "@revenuecat/purchases-js";
import type { Offering, Package } from "@revenuecat/purchases-js";

function pickPackage(offering: Offering): Package | null {
  return (
    offering.monthly ??
    offering.annual ??
    offering.lifetime ??
    offering.availablePackages[0] ??
    null
  );
}

export function useRevenueCat() {
  const qc = useQueryClient();
  const hasKey = Boolean(import.meta.env.VITE_REVENUECAT_API_KEY);

  const purchaseUpgrade = useCallback(async () => {
    if (!hasKey || !Purchases.isConfigured()) {
      throw new Error("Billing isn’t available in this environment yet.");
    }
    const instance = Purchases.getSharedInstance();
    const offerings = await instance.getOfferings();
    const current = offerings.current;
    if (!current) {
      throw new Error("No subscription plans are available right now. Try again later.");
    }
    const pkg = pickPackage(current);
    if (!pkg) {
      throw new Error("No packages are available to purchase right now.");
    }
    try {
      await instance.purchasePackage(pkg);
    } catch (e: unknown) {
      const err = e as { errorCode?: ErrorCode };
      if (err?.errorCode === ErrorCode.UserCancelledError) {
        return;
      }
      throw e;
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
  }, [hasKey, qc]);

  return { purchaseUpgrade, hasKey };
}
