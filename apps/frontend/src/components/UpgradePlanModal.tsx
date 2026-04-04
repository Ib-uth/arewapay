import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorCode, Purchases } from "@revenuecat/purchases-js";
import type { Package } from "@revenuecat/purchases-js";

export function UpgradePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pkgs, setPkgs] = useState<Package[]>([]);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (!import.meta.env.VITE_REVENUECAT_API_KEY) {
      setErr("Plans couldn’t load — billing isn’t configured for this build.");
      setPkgs([]);
      return;
    }
    const load = async () => {
      if (!Purchases.isConfigured()) {
        setErr("Billing is still connecting. Close and try again in a moment.");
        setPkgs([]);
        return;
      }
      setLoading(true);
      try {
        const offerings = await Purchases.getSharedInstance().getOfferings();
        const cur = offerings.current;
        setPkgs(cur?.availablePackages ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load plans.");
        setPkgs([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open]);

  async function buy(pkg: Package) {
    setErr(null);
    setBusyId(pkg.identifier);
    try {
      await Purchases.getSharedInstance().purchasePackage(pkg);
      await qc.invalidateQueries({ queryKey: ["me"] });
      onClose();
    } catch (e: unknown) {
      const er = e as { errorCode?: ErrorCode };
      if (er?.errorCode === ErrorCode.UserCancelledError) {
        return;
      }
      setErr(e instanceof Error ? e.message : "Purchase failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/60 dark:bg-black/70"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-charcoal/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-dark"
      >
        <h2 id="upgrade-title" className="font-display text-2xl uppercase text-charcoal dark:text-white">
          Choose a plan
        </h2>
        <p className="font-sans mt-2 text-sm text-charcoal/60 dark:text-white/60">
          Monthly, yearly, or lifetime — pick what fits your business.
        </p>
        {loading && (
          <p className="font-sans mt-6 text-sm text-charcoal/50 dark:text-white/50">Loading offerings…</p>
        )}
        {err && <p className="font-sans mt-4 text-sm text-red-600 dark:text-red-400">{err}</p>}
        <ul className="mt-6 space-y-3">
          {pkgs.map((pkg) => {
            const product = pkg.webBillingProduct;
            const title = product.title || pkg.identifier;
            const price = product.price?.formattedPrice ?? pkg.identifier;
            return (
              <li
                key={pkg.identifier}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-charcoal/10 bg-off/80 px-4 py-3 dark:border-white/10 dark:bg-charcoal/50"
              >
                <div>
                  <p className="font-sans font-medium text-charcoal dark:text-white">{title}</p>
                  <p className="font-sans text-sm text-charcoal/60 dark:text-white/60">{price}</p>
                </div>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void buy(pkg)}
                  className="font-sans rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal/90 disabled:opacity-50 dark:bg-accent dark:text-white dark:hover:brightness-110"
                >
                  {busyId === pkg.identifier ? "Processing…" : "Select"}
                </button>
              </li>
            );
          })}
        </ul>
        {!loading && pkgs.length === 0 && !err && (
          <p className="font-sans mt-4 text-sm text-charcoal/50 dark:text-white/50">
            No plans are available yet. Check back soon or contact support if this persists.
          </p>
        )}
        <button
          type="button"
          className="font-sans mt-6 w-full rounded-lg border border-charcoal/15 py-2 text-sm text-charcoal hover:bg-off dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
