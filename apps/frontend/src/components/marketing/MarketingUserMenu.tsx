import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { userDisplayName } from "../../lib/userDisplay";
import type { UserPublic } from "../../types";

function initials(user: UserPublic): string {
  const name = userDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

export function MarketingUserMenu({ user }: { user: UserPublic }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function logout() {
    setOpen(false);
    await apiFetch("/auth/logout", { method: "POST" });
    await qc.invalidateQueries({ queryKey: ["me"] });
    navigate("/");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 bg-charcoal text-sm font-semibold text-white shadow-sm transition hover:border-charcoal/25 hover:brightness-110"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">Account menu</span>
        {initials(user)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[12rem] rounded-xl border border-charcoal/10 bg-white py-1 shadow-lg"
        >
          <p className="px-3 py-2 font-sans text-xs text-charcoal/55">{userDisplayName(user)}</p>
          <p className="font-sans truncate px-3 pb-2 text-xs text-charcoal/55">{user.email}</p>
          <div className="border-t border-charcoal/10" />
          <Link
            role="menuitem"
            to="/app"
            className="block px-3 py-2 font-sans text-sm text-charcoal hover:bg-off"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            role="menuitem"
            to="/app/settings/profile"
            className="block px-3 py-2 font-sans text-sm text-charcoal hover:bg-off"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left font-sans text-sm text-charcoal hover:bg-off"
            onClick={() => void logout()}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
