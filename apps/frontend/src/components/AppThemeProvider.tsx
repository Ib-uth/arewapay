import { type ReactNode } from "react";
import { AppThemeContext } from "../contexts/appThemeContext";

export function AppThemeProvider({ isDark, children }: { isDark: boolean; children: ReactNode }) {
  return <AppThemeContext.Provider value={isDark}>{children}</AppThemeContext.Provider>;
}
