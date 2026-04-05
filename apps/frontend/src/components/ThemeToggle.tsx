import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import { useToast } from "./ToastProvider";
import type { ThemePreference, UserPublic } from "../types";

export function ThemeToggle({ user }: { user: UserPublic }) {
  const qc = useQueryClient();
  const toast = useToast();
  const active = user.theme ?? "system";

  const mut = useMutation({
    mutationFn: (t: ThemePreference) =>
      apiFetch<{ user: UserPublic }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ theme: t }),
      }),
    onSuccess: (_d, t) => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast(`Theme: ${t === "system" ? "Auto" : t}.`);
    },
    onError: (e) => {
      toast(e instanceof Error ? e.message : "Could not update theme.", "error");
    },
  });

  return (
    <div className="flex items-center gap-1 rounded-full border border-charcoal/15 bg-off/80 p-0.5 dark:border-white/15 dark:bg-charcoal/80">
      {(["light", "dark", "system"] as const).map((t) => (
        <button
          key={t}
          type="button"
          title={`Theme: ${t}`}
          onClick={() => mut.mutate(t)}
          className={`rounded-full px-2.5 py-1 font-sans text-xs capitalize transition-colors ${
            active === t
              ? "bg-white text-charcoal shadow-sm dark:bg-white/15 dark:text-white"
              : "text-charcoal/60 hover:text-charcoal dark:text-white/50 dark:hover:text-white"
          }`}
        >
          {t === "system" ? "Auto" : t}
        </button>
      ))}
    </div>
  );
}
