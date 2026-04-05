import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = { id: string; message: string; variant: ToastVariant };

const ToastContext = createContext<
  (message: string, variant?: ToastVariant) => void
>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const shell =
  "pointer-events-auto max-w-sm rounded-xl border px-4 py-3 font-sans text-sm shadow-lg backdrop-blur-sm";

const variantClass: Record<ToastVariant, string> = {
  success:
    `${shell} border-green-200/90 bg-green-50/95 text-green-950 dark:border-green-800/70 dark:bg-green-950/90 dark:text-green-50`,
  error:
    `${shell} border-red-200/90 bg-red-50/95 text-red-950 dark:border-red-800/70 dark:bg-red-950/90 dark:text-red-50`,
  info: `${shell} border-charcoal/15 bg-white/95 text-charcoal dark:border-white/15 dark:bg-charcoal/95 dark:text-white`,
};

const accentBar: Record<ToastVariant, string> = {
  success: "bg-green-500 dark:bg-green-400",
  error: "bg-red-500 dark:bg-red-400",
  info: "bg-accent",
};

const MAX_VISIBLE = 3;
const DISMISS_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }].slice(-MAX_VISIBLE));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <div
            className="pointer-events-none fixed bottom-6 right-6 left-6 z-[300] flex flex-col items-end gap-2 sm:left-auto"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`flex w-full max-w-sm overflow-hidden rounded-xl ${variantClass[t.variant]}`}
                role="status"
                aria-live="polite"
              >
                <span
                  className={`w-1 shrink-0 self-stretch ${accentBar[t.variant]}`}
                  aria-hidden
                />
                <p className="min-w-0 flex-1 py-0.5 pl-3 leading-snug">{t.message}</p>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
