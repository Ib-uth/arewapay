import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "dark" | "ghost" | "link" | "onAccent";

const base =
  "inline-flex items-center justify-center font-sans font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "rounded-lg bg-accent px-8 py-3 font-display text-xl uppercase tracking-wide text-white hover:brightness-110",
  dark: "rounded-full bg-charcoal px-6 py-2.5 text-sm text-white hover:bg-charcoal/90",
  ghost: "rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm text-charcoal hover:bg-off",
  link: "text-sm font-medium text-charcoal underline-offset-4 hover:underline",
  onAccent:
    "rounded-lg bg-white px-8 py-3 font-display text-xl uppercase tracking-wide text-accent hover:bg-white/90",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  to,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  to?: string;
  className?: string;
}) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}
