import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`card-interactive rounded-2xl p-6 ${
        dark
          ? "border-dark bg-charcoal text-white"
          : "border-light bg-off"
      } ${className}`}
    >
      {children}
    </div>
  );
}
