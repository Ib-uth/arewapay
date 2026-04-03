import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { UpgradePlanModal } from "./UpgradePlanModal";
import type { UserPublic } from "../types";
import { userDisplayName } from "../lib/userDisplay";
import {
  IconNavClients,
  IconNavDashboard,
  IconNavHelp,
  IconNavInvoice,
  IconNavSettings,
} from "./icons/AppIcons";

const navItems: {
  to: string;
  label: string;
  end?: boolean;
  Icon: typeof IconNavDashboard;
}[] = [
  { to: "/app", label: "Dashboard", end: true, Icon: IconNavDashboard },
  { to: "/app/clients", label: "Clients", Icon: IconNavClients },
  { to: "/app/invoices", label: "Invoices", Icon: IconNavInvoice },
  { to: "/app/settings", label: "Settings", Icon: IconNavSettings },
  { to: "/app/help", label: "Help", Icon: IconNavHelp },
];

function planCopy(tier: string): { title: string; blurb: string } {
  const t = tier.toLowerCase();
  if (t === "free") return { title: "Starter", blurb: "Core invoicing for getting started." };
  if (t === "premium") return { title: "Premium", blurb: "Higher limits and room to grow." };
  if (t === "unlimited") return { title: "Unlimited", blurb: "No caps — built for busy teams." };
  return { title: tier || "Plan", blurb: "Your subscription benefits." };
}

export function AppSidebar({
  user,
  onLogout,
  mobileOpen,
  onMobileOpenChange,
}: {
  user: UserPublic;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const plan = planCopy(user.subscription_tier);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-sans flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-accent/30 text-charcoal dark:bg-accent/20 dark:text-white"
        : "text-charcoal/70 hover:bg-charcoal/5 dark:text-white/70 dark:hover:bg-white/10"
    }`;

  const upgradeBtnClass =
    "font-sans relative mt-3 w-full overflow-hidden rounded-lg bg-charcoal py-2.5 text-sm font-medium text-white shadow-sm transition-colors before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.06] before:[background-image:repeating-linear-gradient(-12deg,transparent,transparent_3px,rgba(255,255,255,0.9)_3px,rgba(255,255,255,0.9)_4px)] hover:bg-accent hover:text-charcoal dark:bg-accent dark:text-charcoal before:dark:opacity-[0.08] before:dark:[background-image:repeating-linear-gradient(-12deg,transparent,transparent_3px,rgba(23,30,25,0.35)_3px,rgba(23,30,25,0.35)_4px)] dark:hover:bg-white dark:hover:text-charcoal";

  const nav = (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            onClick={() => onMobileOpenChange(false)}
          >
            <item.Icon className="h-5 w-5 shrink-0 opacity-80" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-charcoal/10 p-4 dark:border-white/10">
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 dark:border-accent/30 dark:bg-accent/5">
          <p className="font-display text-xs uppercase tracking-wider text-charcoal/70 dark:text-white/70">
            Current plan
          </p>
          <p className="font-sans mt-1 text-sm font-semibold text-charcoal dark:text-white">{plan.title}</p>
          <p className="font-sans mt-1 text-xs leading-snug text-charcoal/65 dark:text-white/65">{plan.blurb}</p>
          <button
            type="button"
            className={upgradeBtnClass}
            onClick={() => {
              setUpgradeOpen(true);
              onMobileOpenChange(false);
            }}
          >
            Upgrade plan
          </button>
        </div>
        <p className="mt-4 truncate font-sans text-sm font-bold text-charcoal dark:text-white">
          {userDisplayName(user)}
        </p>
        <p className="truncate font-sans text-xs text-charcoal/55 dark:text-white/55">{user.email}</p>
        <p className="font-sans text-xs capitalize text-charcoal/40 dark:text-white/40">{user.role}</p>
        <button
          type="button"
          className="font-sans mt-3 w-full rounded-lg border border-charcoal/20 bg-transparent py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5 dark:border-white/25 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
      <UpgradePlanModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-charcoal/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => onMobileOpenChange(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-charcoal/10 bg-white transition-transform dark:border-white/10 dark:bg-charcoal ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="border-b border-charcoal/10 p-4 dark:border-white/10">
          <Link
            to="/app"
            className="font-display text-xl uppercase tracking-wide text-charcoal dark:text-white"
            onClick={() => onMobileOpenChange(false)}
          >
            ArewaPay<span className="text-accent">.</span>
          </Link>
        </div>
        {nav}
      </aside>
    </>
  );
}
