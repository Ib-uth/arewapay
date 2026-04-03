import { useEffect, useMemo, useState } from "react";
import type { ThemePreference } from "../types";

/**
 * Resolves user theme preference for the dashboard shell only (not document root).
 */
export function useResolvedAppTheme(theme: ThemePreference | null | undefined): boolean {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return useMemo(() => {
    const t = theme ?? "system";
    if (t === "dark") return true;
    if (t === "light") return false;
    return systemDark;
  }, [theme, systemDark]);
}
