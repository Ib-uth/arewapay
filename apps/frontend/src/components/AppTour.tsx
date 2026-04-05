import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { UserPublic } from "../types";
import { Button } from "./ui/Button";

const STORAGE_KEY = "arewapay_tour_dismissed";

type Step = {
  title: string;
  body: string;
  /** data-tour attribute value on target element */
  target: string;
};

const STEPS: Step[] = [
  {
    target: "tour-sidebar",
    title: "Your sidebar",
    body: "Navigation lives here — switch between workspace areas anytime.",
  },
  {
    target: "tour-nav-dashboard",
    title: "Dashboard",
    body: "See cash-flow snapshots and what needs attention at a glance.",
  },
  {
    target: "tour-nav-clients",
    title: "Clients",
    body: "Keep contacts and billing details in one place for faster invoicing.",
  },
  {
    target: "tour-nav-invoices",
    title: "Invoices",
    body: "Create, track, and send invoices — your receivables home base.",
  },
  {
    target: "tour-nav-settings",
    title: "You're all set! 🎉",
    body: "Tune profile, organisation, and preferences under Settings. Skip anytime — you can explore freely.",
  },
];

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function AppTour({
  user,
  onOpenMobileSidebar,
}: {
  user: UserPublic;
  onOpenMobileSidebar?: () => void;
}) {
  const [dismissed, setDismissed] = useState(() => readDismissed());
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const openedMobileForTour = useRef(false);

  const active = Boolean(user.onboarding_completed_at) && !dismissed;
  const step = STEPS[stepIndex];

  const updateRect = useCallback(() => {
    if (!active || !step) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el || !(el instanceof HTMLElement)) {
      setRect(null);
      return;
    }
    setRect(el.getBoundingClientRect());
  }, [active, step]);

  useLayoutEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.innerWidth < 1024 && !openedMobileForTour.current) {
      openedMobileForTour.current = true;
      onOpenMobileSidebar?.();
    }
  }, [active, onOpenMobileSidebar]);

  useLayoutEffect(() => {
    if (!active) return;
    updateRect();
  }, [active, stepIndex, updateRect]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => updateRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, updateRect]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (!active || !step) {
    return null;
  }

  const pad = 10;

  return createPortal(
    <div className="fixed inset-0 z-[200]" aria-live="polite">
      {rect && rect.width > 0 && rect.height > 0 && (
        <div
          className="pointer-events-none fixed z-[201] rounded-xl shadow-[0_0_0_9999px_rgba(15,23,25,0.72)] transition-[top,left,width,height] duration-200 dark:shadow-[0_0_0_9999px_rgba(0,0,0,0.75)]"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[202] flex justify-center p-4 pb-6 sm:p-6">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-charcoal/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-charcoal">
          <p className="font-display text-xs uppercase tracking-wider text-charcoal/50 dark:text-white/50">
            Quick tour · {stepIndex + 1} / {STEPS.length}
          </p>
          <h2 className="font-display mt-2 text-xl uppercase tracking-tight text-charcoal dark:text-white">
            {step.title}
          </h2>
          <p className="font-sans mt-2 text-sm leading-relaxed text-charcoal/75 dark:text-white/75">
            {step.body}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="font-sans text-sm font-medium text-charcoal/60 underline-offset-2 hover:text-charcoal hover:underline dark:text-white/55 dark:hover:text-white"
              onClick={dismiss}
            >
              Skip
            </button>
            <div className="flex flex-wrap gap-2">
              {stepIndex > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="!rounded-lg"
                  onClick={() => setStepIndex((i) => i - 1)}
                >
                  Back
                </Button>
              )}
              {stepIndex < STEPS.length - 1 ? (
                <Button
                  type="button"
                  variant="dark"
                  className="!rounded-lg"
                  onClick={() => setStepIndex((i) => i + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button type="button" variant="dark" className="!rounded-lg" onClick={dismiss}>
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
