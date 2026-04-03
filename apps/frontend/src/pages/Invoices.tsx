import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";
import { downloadCsv } from "../lib/csvExport";
import { useMoneyFormat } from "../hooks/useMoneyFormat";
import type { Invoice } from "../types";

const statusBadge: Record<string, string> = {
  draft:
    "border border-charcoal/15 bg-sage/25 text-charcoal dark:border-white/15 dark:bg-white/10 dark:text-white",
  sent: "border border-charcoal/20 bg-dark text-white dark:border-white/20",
  partial:
    "border border-accent/50 bg-accent/35 text-charcoal dark:border-accent/40 dark:bg-accent/25 dark:text-white",
  paid: "border border-charcoal/20 bg-charcoal text-white dark:border-white/20 dark:bg-white/90 dark:text-charcoal",
  overdue:
    "border border-red-200 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-100",
};

export function Invoices() {
  const { format } = useMoneyFormat();
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiFetch<Invoice[]>("/invoices"),
  });

  function exportInvoices() {
    downloadCsv(
      `invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      invoices.map((inv) => ({
        invoice_number: inv.invoice_number,
        status: inv.status,
        due_date: inv.due_date,
        currency: inv.currency,
        total: inv.total,
        client_id: inv.client_id,
      })),
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="font-sans text-charcoal/50 dark:text-white/50">Loading invoices…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-charcoal dark:text-white md:text-5xl">
            Invoices
          </h1>
          <p className="font-sans mt-2 text-charcoal/60 dark:text-white/60">
            Track status and totals per invoice currency.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="ghost"
            className="!rounded-lg !py-3 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            onClick={exportInvoices}
            disabled={invoices.length === 0}
          >
            Export invoices
          </Button>
          <Button to="/app/invoices/new" variant="primary" className="!rounded-lg !py-3 !text-base">
            New invoice
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm dark:border-white/10 dark:bg-dark/80">
        <table className="min-w-full border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 bg-off/80 dark:border-white/10 dark:bg-white/5">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">
                Invoice #
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">Due</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-charcoal dark:text-white">
                Total
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-charcoal dark:text-white">
                View
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/10 dark:divide-white/10">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-off/60 dark:hover:bg-white/5">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-charcoal dark:text-white">
                  {inv.invoice_number}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-charcoal/75 dark:text-white/75">{inv.due_date}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 font-sans text-xs font-medium uppercase tracking-wide ${statusBadge[inv.status] ?? "bg-off text-charcoal dark:bg-white/10 dark:text-white"}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-charcoal dark:text-white">
                  {format(inv.total, inv.currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    to={`/app/invoices/${inv.id}`}
                    className="font-medium text-charcoal underline-offset-4 hover:underline dark:text-accent"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <p className="px-4 py-12 text-center font-sans text-sm text-charcoal/50 dark:text-white/50">
            No invoices yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
