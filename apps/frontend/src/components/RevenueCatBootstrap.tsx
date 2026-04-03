import { useEffect } from "react";
import { Purchases } from "@revenuecat/purchases-js";
import type { UserPublic } from "../types";

export function RevenueCatBootstrap({ user }: { user: UserPublic }) {
  useEffect(() => {
    const key = import.meta.env.VITE_REVENUECAT_API_KEY;
    if (!key) return;

    void (async () => {
      try {
        if (Purchases.isConfigured()) {
          await Purchases.getSharedInstance().changeUser(user.id);
        } else {
          Purchases.configure({ apiKey: key, appUserId: user.id });
        }
      } catch (e) {
        console.warn("RevenueCat configure failed", e);
      }
    })();
  }, [user.id]);

  return null;
}
