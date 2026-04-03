import { useState } from "react";
import { Link } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { IconBell, IconMenu } from "./icons/AppIcons";
import { ThemeToggle } from "./ThemeToggle";
import { userDisplayName } from "../lib/userDisplay";
import type { UserPublic } from "../types";

export function AppTopBar({
  user,
  onOpenMobileMenu,
}: {
  user: UserPublic;
  onOpenMobileMenu: () => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-charcoal/10 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-charcoal/90 lg:left-64">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-charcoal/15 bg-off text-charcoal lg:hidden dark:border-white/20 dark:bg-charcoal dark:text-white"
          aria-label="Open menu"
          onClick={onOpenMobileMenu}
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <div className="min-w-0 shrink-0 font-display text-sm font-semibold uppercase tracking-wide text-charcoal dark:text-white sm:text-base">
          <Link to="/app" className="truncate hover:text-accent">
            {userDisplayName(user)}
          </Link>
        </div>

        <GlobalSearch />

        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/10 text-charcoal hover:bg-off dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              aria-expanded={notifOpen}
              aria-haspopup="true"
              onClick={() => setNotifOpen((o) => !o)}
              title="Notifications"
            >
              <IconBell className="h-5 w-5" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-charcoal/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-dark">
                <p className="font-sans text-sm text-charcoal/60 dark:text-white/60">No notifications yet.</p>
              </div>
            )}
          </div>
          <ThemeToggle user={user} />
        </div>
      </div>
    </header>
  );
}
