import { useCallback } from "react";
import { useMe } from "./useAuth";

export function useMoneyFormat() {
  const { data } = useMe();
  const currency = data?.user.currency_code ?? "USD";

  const format = useCallback(
    (amount: string | number, currencyOverride?: string) => {
      const code = currencyOverride ?? currency;
      const n = Number(amount);
      if (Number.isNaN(n)) return String(amount);
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: code,
          maximumFractionDigits: 2,
        }).format(n);
      } catch {
        return `${code} ${n.toLocaleString()}`;
      }
    },
    [currency],
  );

  return { format, currency };
}
