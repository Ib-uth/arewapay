import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiFetch, uploadLogo } from "../../api/client";
import { useToast } from "../../components/ToastProvider";
import { Button } from "../../components/ui/Button";
import { AFRICAN_COUNTRIES, ISO_CURRENCIES } from "../../lib/africanCountries";
import type { UserPublic } from "../../types";

function logoSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${window.location.origin}${url}`;
}

function ProfileForm({ user }: { user: UserPublic }) {
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const localLogoObjectUrlRef = useRef<string | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [orgName, setOrgName] = useState(user.org_name ?? "");
  const [country, setCountry] = useState(user.country_code ?? "NG");
  const [currency, setCurrency] = useState(user.currency_code ?? "NGN");

  useEffect(() => {
    return () => {
      if (localLogoObjectUrlRef.current) {
        URL.revokeObjectURL(localLogoObjectUrlRef.current);
        localLogoObjectUrlRef.current = null;
      }
    };
  }, []);

  const mut = useMutation({
    mutationFn: () =>
      apiFetch<{ user: UserPublic }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          org_name: orgName.trim() || null,
          country_code: country,
          currency_code: currency,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast("Profile saved.");
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : "Could not save profile.", "error");
    },
  });

  const logoMut = useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: () => {
      if (localLogoObjectUrlRef.current) {
        URL.revokeObjectURL(localLogoObjectUrlRef.current);
        localLogoObjectUrlRef.current = null;
      }
      setLocalLogoPreview(null);
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast("Logo uploaded successfully.");
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : "Could not upload logo.", "error");
    },
  });

  const removeLogoMut = useMutation({
    mutationFn: () =>
      apiFetch<{ user: UserPublic }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ logo_url: null }),
      }),
    onSuccess: () => {
      if (localLogoObjectUrlRef.current) {
        URL.revokeObjectURL(localLogoObjectUrlRef.current);
        localLogoObjectUrlRef.current = null;
      }
      setLocalLogoPreview(null);
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast("Logo removed.");
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : "Could not remove logo.", "error");
    },
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
          {user.email_verified ? "Verified" : "Verification pending"}
        </p>
      </div>
      <div>
        <label className="font-sans text-sm font-medium text-charcoal dark:text-white">Phone</label>
        <p className="font-sans mt-2 text-charcoal/80 dark:text-white/80">
          {user.phone ?? "—"}
        </p>
        <p className="font-sans mt-1 text-xs text-charcoal/50 dark:text-white/50">
          {user.phone_verified ? "Verified" : "Phone verification is not available yet"}
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

      <div className="border-t border-charcoal/10 pt-6 dark:border-white/10">
        <h3 className="font-display text-sm uppercase tracking-wide text-charcoal dark:text-white">
          Organisation
        </h3>
        <p className="font-sans mt-1 text-xs text-charcoal/55 dark:text-white/55">
          Shown on invoices and PDFs.
        </p>
        <div className="mt-4">
          <label className="font-sans text-sm font-medium text-charcoal dark:text-white">
            Business / Organisation name
          </label>
          <input
            className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal dark:border-white/20 dark:bg-charcoal dark:text-white"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Acme Ltd"
          />
        </div>
        <div className="mt-4">
          <label className="font-sans text-sm font-medium text-charcoal dark:text-white">Logo</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (localLogoObjectUrlRef.current) {
                URL.revokeObjectURL(localLogoObjectUrlRef.current);
                localLogoObjectUrlRef.current = null;
              }
              const url = URL.createObjectURL(f);
              localLogoObjectUrlRef.current = url;
              setLocalLogoPreview(url);
              logoMut.mutate(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={logoMut.isPending}
            className="font-sans mt-2 flex h-32 w-full max-w-xs flex-col items-center justify-center rounded-xl border-2 border-dashed border-charcoal/20 bg-off/50 text-sm text-charcoal/70 transition-colors hover:border-accent/50 hover:bg-off disabled:cursor-wait disabled:opacity-70 dark:border-white/20 dark:bg-white/5 dark:text-white/70"
          >
            {localLogoPreview || user.logo_url ? (
              <img
                src={localLogoPreview ?? logoSrc(user.logo_url) ?? ""}
                alt="Organisation logo"
                className="max-h-24 max-w-[90%] object-contain"
              />
            ) : (
              <span>Click to upload PNG or JPG (max 2MB)</span>
            )}
            {logoMut.isPending && (
              <span className="mt-2 text-xs text-charcoal/55 dark:text-white/55">Uploading…</span>
            )}
          </button>
          {user.logo_url && (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 !rounded-lg text-sm"
              disabled={removeLogoMut.isPending}
              onClick={() => removeLogoMut.mutate()}
            >
              {removeLogoMut.isPending ? "Removing…" : "Remove logo"}
            </Button>
          )}
        </div>
      </div>

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
        key={`${user.display_name ?? ""}|${user.org_name ?? ""}|${user.logo_url ?? ""}|${user.country_code}|${user.currency_code}`}
        user={user}
      />
    </div>
  );
}
