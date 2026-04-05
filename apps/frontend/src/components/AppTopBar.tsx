import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { IconBell, IconMenu } from "./icons/AppIcons";
import { useNotifications } from "./NotificationProvider";
import { ThemeToggle } from "./ThemeToggle";
import { userDisplayName } from "../lib/userDisplay";
import type { UserPublic } from "../types";

function NotificationBell() {
  const { items, unreadCount, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const badge =
    unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(Math.min(9, unreadCount))) : null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/10 text-charcoal hover:bg-off dark:border-white/15 dark:text-white dark:hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
      >
        <IconBell className="h-5 w-5" />
        {badge !== null && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-sans text-[10px] font-bold leading-none text-white">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-charcoal/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-charcoal">
          <div className="flex items-center justify-between gap-2 border-b border-charcoal/10 pb-2 dark:border-white/10">
            <p className="font-display text-xs uppercase tracking-wider text-charcoal dark:text-white">
              Notifications
            </p>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="font-sans text-xs font-medium text-accent hover:underline"
                  onClick={() => markAllRead()}
                >
                  Mark all read
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  className="font-sans text-xs text-charcoal/50 hover:text-charcoal dark:text-white/50 dark:hover:text-white"
                  onClick={() => clearAll()}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto pt-2">
            {items.length === 0 ? (
              <p className="font-sans px-1 py-4 text-center text-sm text-charcoal/60 dark:text-white/60">
                No notifications yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg border px-3 py-2 text-left ${
                      n.read
                        ? "border-charcoal/5 bg-off/40 dark:border-white/5 dark:bg-white/5"
                        : "border-accent/30 bg-accent/5 dark:border-accent/25 dark:bg-accent/10"
                    }`}
                  >
                    <p className="font-sans text-xs font-semibold text-charcoal dark:text-white">
                      {n.title}
                    </p>
                    <p className="font-sans mt-0.5 text-xs leading-snug text-charcoal/70 dark:text-white/70">
                      {n.body}
                    </p>
                    <p className="font-sans mt-1 text-[10px] text-charcoal/40 dark:text-white/40">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppTopBar({
  user,
  onOpenMobileMenu,
}: {
  user: UserPublic;
  onOpenMobileMenu: () => void;
}) {
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
            {user.org_name?.trim() || userDisplayName(user)}
          </Link>
        </div>

        <GlobalSearch />

        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          <NotificationBell />
          <ThemeToggle user={user} />
        </div>
      </div>
    </header>
  );
}
