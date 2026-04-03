import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { LandingNav } from "../components/landing/LandingNav";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { clearRootDarkClass } from "../lib/clearRootDarkClass";

export function MarketingLayout() {
  useEffect(() => {
    clearRootDarkClass();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main className="pt-20">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
