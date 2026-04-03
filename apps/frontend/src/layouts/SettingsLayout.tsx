import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import type { UserPublic } from "../types";

export function SettingsLayout() {
  const { user } = useOutletContext<{ user: UserPublic }>();
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-5 py-2 font-sans text-sm font-medium transition-colors ${
      isActive
        ? "bg-white text-charcoal shadow-sm dark:bg-white/10 dark:text-white"
        : "text-charcoal/60 hover:text-charcoal dark:text-white/50 dark:hover:text-white"
    }`;

  return (
    <div className="w-full max-w-none">
      <h1 className="font-display text-4xl uppercase leading-[0.9] text-charcoal dark:text-white md:text-5xl">
        Settings
      </h1>
      <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
        Manage your workspace preferences and account.
      </p>
      <div
        className="mt-8 inline-flex rounded-full border border-charcoal/15 bg-off p-1 dark:border-white/15 dark:bg-charcoal/80"
        role="tablist"
        aria-label="Settings sections"
      >
        <NavLink to="/app/settings/profile" className={tabClass} role="tab">
          Profile
        </NavLink>
        <NavLink to="/app/settings/account" className={tabClass} role="tab">
          Account
        </NavLink>
      </div>
      <div className="mt-10">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}
