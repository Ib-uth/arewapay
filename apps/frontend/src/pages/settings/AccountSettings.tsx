import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { Button } from "../../components/ui/Button";
import type { ThemePreference, UserPublic } from "../../types";

export function AccountSettings() {
  const { user } = useOutletContext<{ user: UserPublic }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const activeTheme = user.theme ?? "system";
  const [password, setPassword] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");

  const themeMut = useMutation({
    mutationFn: (t: ThemePreference) =>
      apiFetch<{ user: UserPublic }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ theme: t }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["me"] }),
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      apiFetch("/users/me", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      }),
    onSuccess: async () => {
      try {
        await apiFetch("/auth/logout", { method: "POST" });
      } catch {
        /* session may already be invalid */
      }
      void qc.clear();
      navigate("/login", { replace: true });
    },
  });

  return (
    <div>
      <h2 className="font-display text-2xl uppercase leading-[0.95] text-charcoal dark:text-white md:text-3xl">
        Account
      </h2>
      <p className="font-sans mt-2 text-charcoal/70 dark:text-white/70">
        Theme and account security.
      </p>
      <div className="card-interactive mt-8 w-full max-w-none space-y-6 rounded-2xl border border-charcoal/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-dark">
        <div>
          <h2 className="font-display text-xl uppercase text-charcoal dark:text-white">Theme</h2>
          <p className="font-sans mt-2 text-sm text-charcoal/60 dark:text-white/60">
            Choose how ArewaPay looks on this device.
          </p>
          <div className="font-sans mt-4 flex flex-wrap gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => themeMut.mutate(t)}
                className={`rounded-full border px-4 py-2 text-sm capitalize ${
                  activeTheme === t
                    ? "border-charcoal bg-charcoal text-white dark:border-accent dark:bg-accent dark:text-charcoal"
                    : "border-charcoal/20 text-charcoal hover:bg-off dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-interactive mt-8 w-full max-w-none space-y-4 rounded-2xl border border-red-200 bg-red-50/50 p-6 sm:p-8 dark:border-red-900/50 dark:bg-red-950/30">
        <h2 className="font-display text-xl uppercase text-red-900 dark:text-red-300">Delete account</h2>
        <p className="font-sans text-sm text-red-900/80 dark:text-red-200/80">
          Permanently delete your account and associated data. Type DELETE below and enter your password
          to confirm.
        </p>
        <input
          className="font-sans w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal dark:border-white/20 dark:bg-charcoal dark:text-white"
          placeholder="Type DELETE to confirm"
          value={confirmPhrase}
          onChange={(e) => setConfirmPhrase(e.target.value)}
        />
        <input
          type="password"
          className="font-sans w-full rounded-lg border border-charcoal/20 bg-white px-4 py-3 text-charcoal dark:border-white/20 dark:bg-charcoal dark:text-white"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {deleteMut.isError && (
          <p className="text-sm text-red-600">{String((deleteMut.error as Error).message)}</p>
        )}
        <Button
          type="button"
          variant="ghost"
          className="!border-red-300 !text-red-800 hover:!bg-red-100 dark:!border-red-800 dark:!text-red-200"
          disabled={
            confirmPhrase !== "DELETE" || password.length < 1 || deleteMut.isPending
          }
          onClick={() => deleteMut.mutate()}
        >
          {deleteMut.isPending ? "Deleting…" : "Delete my account"}
        </Button>
      </div>
    </div>
  );
}
