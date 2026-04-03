import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";
import { AFRICAN_COUNTRIES, ISO_CURRENCIES } from "../lib/africanCountries";
import type { UserPublic } from "../types";

export function Onboarding() {
  const { user } = useOutletContext<{ user: UserPublic }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [country, setCountry] = useState(user.country_code ?? "NG");
  const [currency, setCurrency] = useState(
    user.currency_code ?? AFRICAN_COUNTRIES.find((c) => c.code === "NG")?.currency ?? "NGN",
  );

  const mut = useMutation({
    mutationFn: () =>
      apiFetch<{ user: UserPublic }>("/users/me/onboarding", {
        method: "POST",
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          country_code: country,
          currency_code: currency,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      navigate("/app", { replace: true });
    },
  });

  if (user.onboarding_completed_at) {
    return <Navigate to="/app" replace />;
  }

  function onCountryChange(code: string) {
    setCountry(code);
    const row = AFRICAN_COUNTRIES.find((c) => c.code === code);
    if (row) setCurrency(row.currency);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-4xl uppercase leading-[0.9] text-charcoal dark:text-white md:text-5xl">
        Welcome to ArewaPay
      </h1>
      <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
        Tell us a bit about your business so we can use the right currency and personalize your
        workspace. You can change this anytime in settings.
      </p>
      <form
        className="mt-10 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            Business or display name (optional)
          </label>
          <input
            className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Acme Trading Ltd"
          />
        </div>
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            Country
          </label>
          <select
            className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
          >
            {AFRICAN_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            Default currency
          </label>
          <select
            className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {ISO_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {mut.isError && (
          <p className="text-sm text-red-600">{String((mut.error as Error).message)}</p>
        )}
        <Button type="submit" variant="dark" disabled={mut.isPending} className="w-full !rounded-lg py-4">
          {mut.isPending ? "Saving…" : "Continue to dashboard"}
        </Button>
      </form>
    </div>
  );
}
