import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import type { Client, Invoice } from "../types";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 200);
  const ref = useRef<HTMLDivElement>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<Client[]>("/clients"),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiFetch<Invoice[]>("/invoices"),
  });

  const needle = debounced.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return { clients: [] as Client[], invoices: [] as Invoice[] };
    const c = clients.filter(
      (cl) =>
        cl.name.toLowerCase().includes(needle) ||
        (cl.email?.toLowerCase().includes(needle) ?? false) ||
        (cl.company?.toLowerCase().includes(needle) ?? false),
    );
    const inv = invoices.filter(
      (i) =>
        i.invoice_number.toLowerCase().includes(needle) ||
        i.notes?.toLowerCase().includes(needle),
    );
    return { clients: c.slice(0, 6), invoices: inv.slice(0, 6) };
  }, [clients, invoices, needle]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hasResults =
    needle.length > 0 && (results.clients.length > 0 || results.invoices.length > 0);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-md flex-1 px-2">
      <label className="sr-only" htmlFor="global-search">
        Search clients and invoices
      </label>
      <input
        id="global-search"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search clients & invoices…"
        className="font-sans w-full rounded-full border border-charcoal/15 bg-white/90 px-4 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-charcoal/30 focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-white/15 dark:bg-charcoal/80 dark:text-white dark:placeholder:text-white/40"
      />
      {open && needle && (
        <div className="absolute left-2 right-2 top-full z-50 mt-2 max-h-80 overflow-auto rounded-xl border border-charcoal/10 bg-white py-2 shadow-lg dark:border-white/10 dark:bg-dark">
          {!hasResults && (
            <p className="font-sans px-4 py-3 text-sm text-charcoal/50 dark:text-white/50">
              No matches for &ldquo;{needle}&rdquo;
            </p>
          )}
          {results.clients.length > 0 && (
            <div className="border-b border-charcoal/5 px-2 pb-2 dark:border-white/5">
              <p className="font-sans px-2 py-1 text-xs font-medium uppercase tracking-wide text-charcoal/50 dark:text-white/50">
                Clients
              </p>
              <ul>
                {results.clients.map((cl) => (
                  <li key={cl.id}>
                    <Link
                      to="/app/clients"
                      className="font-sans block rounded-lg px-2 py-2 text-sm text-charcoal hover:bg-off dark:text-white dark:hover:bg-white/10"
                      onClick={() => setOpen(false)}
                    >
                      {cl.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.invoices.length > 0 && (
            <div className="px-2 pt-2">
              <p className="font-sans px-2 py-1 text-xs font-medium uppercase tracking-wide text-charcoal/50 dark:text-white/50">
                Invoices
              </p>
              <ul>
                {results.invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      to={`/app/invoices/${inv.id}`}
                      className="font-sans block rounded-lg px-2 py-2 text-sm text-charcoal hover:bg-off dark:text-white dark:hover:bg-white/10"
                      onClick={() => setOpen(false)}
                    >
                      {inv.invoice_number}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
