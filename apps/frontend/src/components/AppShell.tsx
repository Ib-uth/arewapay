import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppThemeProvider } from "./AppThemeProvider";
import { useMe } from "../hooks/useAuth";
import { useResolvedAppTheme } from "../hooks/useResolvedAppTheme";
import { apiFetch } from "../api/client";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
export function AppShell() {
  const { data, isLoading, isError } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOnboardingRoute = location.pathname === "/app/onboarding";
  const isSettingsRoute = location.pathname.startsWith("/app/settings");
  const isDark = useResolvedAppTheme(data?.user.theme);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (!isLoading && (isError || !data)) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isError, data, navigate]);

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    navigate("/login");
  }

  if (isLoading) {
    return (
      <AppThemeProvider isDark={isDark}>
        <div
          className={`bg-grid-pattern flex min-h-screen flex-col items-center justify-center gap-6 ${isDark ? "dark dark:bg-charcoal" : ""}`}
        >
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-charcoal/10 dark:border-white/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent border-r-accent" />
          </div>
          <div className="text-center">
            <p className="font-display text-xl uppercase tracking-wide text-charcoal dark:text-white">ArewaPay</p>
            <p className="font-sans mt-1 text-sm text-charcoal/50 dark:text-white/50">Loading your workspace…</p>
          </div>
        </div>
      </AppThemeProvider>
    );
  }

  if (isError || !data) {
    return null;
  }

  const u = data.user;

  if (!u.onboarding_completed_at && !isOnboardingRoute) {
    return <Navigate to="/app/onboarding" replace />;
  }

  const shellClass = `min-h-screen bg-grid-pattern ${isDark ? "dark dark:bg-charcoal" : "bg-off"}`;

  if (isOnboardingRoute) {
    return (
      <AppThemeProvider isDark={isDark}>
        <div className={shellClass}>
          <div className="border-b border-charcoal/10 bg-white/90 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-charcoal/90">
            <Link to="/" className="font-display text-xl uppercase text-charcoal dark:text-white">
              ArewaPay<span className="text-accent">.</span>
            </Link>
          </div>
          <Outlet context={{ user: u }} />
        </div>
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider isDark={isDark}>
      <div className={shellClass}>
        <AppSidebar
          user={u}
          onLogout={() => void logout()}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
        <AppTopBar user={u} onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="min-h-screen pl-0 pt-14 lg:pl-64">
          <div
            className={
              isSettingsRoute
                ? "min-h-[calc(100vh-3.5rem)] w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-8"
                : "mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-10"
            }
          >
            <Outlet context={{ user: u }} />
          </div>
        </main>
      </div>
    </AppThemeProvider>
  );
}
