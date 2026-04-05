import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "arewapay_notifications_v1";
const MAX_ITEMS = 50;

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

type Ctx = {
  items: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string }) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

const NotificationContext = createContext<Ctx | null>(null);

function loadStored(): AppNotification[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is AppNotification =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as AppNotification).id === "string" &&
        typeof (x as AppNotification).title === "string",
    );
  } catch {
    return [];
  }
}

function saveStored(items: AppNotification[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore */
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStored(items);
  }, [items, hydrated]);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string }) => {
      const id = n.id ?? crypto.randomUUID();
      const row: AppNotification = {
        id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setItems((prev) => [row, ...prev].slice(0, MAX_ITEMS));
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, unreadCount, addNotification, markAllRead, clearAll }),
    [items, unreadCount, addNotification, markAllRead, clearAll],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications(): Ctx {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
