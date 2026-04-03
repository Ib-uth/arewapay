import { useAppIsDark } from "./useAppIsDark";

/** Dashboard-only dark flag (chart ticks, etc.). */
export function useIsDarkMode(): boolean {
  return useAppIsDark();
}
