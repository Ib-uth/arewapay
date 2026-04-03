import { useContext } from "react";
import { AppThemeContext } from "../contexts/appThemeContext";

export function useAppIsDark(): boolean {
  return useContext(AppThemeContext);
}
