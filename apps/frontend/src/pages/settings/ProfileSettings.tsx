import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { AFRICAN_COUNTRIES, ISO_CURRENCIES } from "../../lib/africanCountries";
import type { UserPublic } from "../../types";

function ProfileForm({ user }: { user: UserPublic }) {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [country, setCountry] = useState(user.country_code ?? "NG");
  const [currency, setCurrency] = useState(user.currency_code ?? "NGN");

  const mut = useMutation({
    mutationFn: () =>
      apiFetch<{ user: UserPublic }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          country_code: country,
          currency_code: currency,
        }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["me"] }),
  });

  return (
    <form
      className="card-interactive mt-8 w-full max-w-none space-y-6 rounded-2xl border border-charcoal/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-dark"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <div>
        <label className="font-sans text-sm font-medium text-charcoal dark:text-white">Email</label>
        <p className="font-sans mt-2 text-charcoal/80 dark:text-white/80">{user.email}</p>
        <p className="font-sans mt-1 text-xs text-charcoal/50 dark:text-white/50">
          {user.email_verified ? "Verified" : "Verification pending (demo)"}
        </p>
      </div>
      <div>
        <label className="font-sans text-sm font-medium text-charcoal dark:text-white">Phone</label>
        <p className="font-sans mt-2 text-charcoal/80 dark:text-white/80">
          {user.phone ?? "—"}
        </p>
        <p className="font-sans mt-1 text-xs text-charcoal/50 dark:text-white/50">
          {user.phone_verified ? "Verified" : "SMS verification coming soon (demo)"}
        </p>
      </div>
      <div>
        <label className="font-sans text-sm font-medium text-charcoal dark:text-white">
          Display name
        </label>
        <input
          className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal dark:border-white/20 dark:bg-charcoal dark:text-white"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="font-sans text-sm font-medium text-charcoal dark:text-white">Country</label>
        <select
          className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal dark:border-white/20 dark:bg-charcoal dark:text-white"
          value={country}
          onChange={(e) => {
            const code = e.target.value;
            setCountry(code);
            const row = AFRICAN_COUNTRIES.find((c) => c.code === code);
            if (row) setCurrency(row.currency);
          }}
        >
          {AFRICAN_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="font-sans text-sm font-medium text-charcoal dark:text-white">
          Default currency
        </label>
        <select
          className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal dark:border-white/20 dark:bg-charcoal dark:text-white"
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
      {mut.isSuccess && (
        <p className="font-sans text-sm text-green-700 dark:text-green-400">Saved.</p>
      )}
      {mut.isError && (
        <p className="text-sm text-red-600">{String((mut.error as Error).message)}</p>
      )}
      <Button type="submit" variant="dark" disabled={mut.isPending} className="!rounded-lg">
        {mut.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function ProfileSettings() {
  const { user } = useOutletContext<{ user: UserPublic }>();

  return (
    <div>
      <h2 className="font-display text-2xl uppercase leading-[0.95] text-charcoal dark:text-white md:text-3xl">
        Profile
      </h2>
      <p className="font-sans mt-2 text-charcoal/70 dark:text-white/70">
        Updates apply to new invoices and dashboard formatting.
      </p>
      <ProfileForm
        key={`${user.display_name ?? ""}|${user.country_code}|${user.currency_code}`}
        user={user}
      />
    </div>
  );
}
