import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";
import { AFRICAN_COUNTRIES, ISO_CURRENCIES } from "../lib/africanCountries";
import type { UserPublic } from "../types";

export function Onboarding() {
  const { user } = useOutletContext<{ user: UserPublic }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState(user.country_code ?? "NG");
  const [currency, setCurrency] = useState(
    user.currency_code ?? AFRICAN_COUNTRIES.find((c) => c.code === "NG")?.currency ?? "NGN",
  );
  const [businessType, setBusinessType] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [referral, setReferral] = useState("");

  const mut = useMutation({
    mutationFn: () => {
      const survey: Record<string, string> = {};
      if (businessType) survey.business_type = businessType;
      if (teamSize) survey.team_size = teamSize;
      if (primaryGoal) survey.primary_goal = primaryGoal;
      if (referral.trim()) survey.referral = referral.trim();
      return apiFetch<{ user: UserPublic }>("/users/me/onboarding", {
        method: "POST",
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          company_name: companyName.trim() || null,
          country_code: country,
          currency_code: currency,
          survey: Object.keys(survey).length ? survey : undefined,
        }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast("Workspace ready — welcome aboard.");
      navigate("/app", { replace: true });
    },
    onError: (e) => {
      toast(e instanceof Error ? e.message : "Could not complete setup.", "error");
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

  const selectClass =
    "font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-4xl uppercase leading-[0.9] text-charcoal dark:text-white md:text-5xl">
        Welcome to ArewaPay
      </h1>
      <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
        Tell us about your workspace so we use the right currency and can improve the product. You can change
        this anytime in settings.
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
            How should we greet you? (optional)
          </label>
          <input
            className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name or preferred label"
          />
        </div>
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            Company name (optional)
          </label>
          <input
            className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Trading Ltd"
          />
        </div>
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">Country</label>
          <select className={selectClass} value={country} onChange={(e) => onCountryChange(e.target.value)}>
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
            className={selectClass}
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
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            What best describes you? (optional)
          </label>
          <select
            className={selectClass}
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="freelancer">Freelancer / solo</option>
            <option value="sme">Small business</option>
            <option value="growing">Growing team</option>
            <option value="nonprofit">Nonprofit / NGO</option>
          </select>
        </div>
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            Team size (optional)
          </label>
          <select className={selectClass} value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
            <option value="">Prefer not to say</option>
            <option value="1">Just me</option>
            <option value="2-10">2–10</option>
            <option value="11-50">11–50</option>
            <option value="50+">50+</option>
          </select>
        </div>
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            Primary goal (optional)
          </label>
          <select
            className={selectClass}
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="visibility">See who owes what</option>
            <option value="speed">Get invoices out faster</option>
            <option value="reporting">Reporting for stakeholders</option>
            <option value="multi">Multi-currency clarity</option>
          </select>
        </div>
        <div>
          <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
            How did you hear about us? (optional)
          </label>
          <input
            className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white"
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            placeholder="Friend, social, search…"
          />
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
