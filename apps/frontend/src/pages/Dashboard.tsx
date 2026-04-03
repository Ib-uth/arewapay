import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../api/client";
import { useIsDarkMode } from "../hooks/useIsDarkMode";
import { useMoneyFormat } from "../hooks/useMoneyFormat";
import type { DashboardSummary, TopClientRow } from "../types";

export function Dashboard() {
  const isDark = useIsDarkMode();
  const tickFill = isDark ? "#e2e8f0" : "#171e19";
  const gridStroke = isDark ? "rgb(226 232 240 / 0.12)" : "rgb(23 30 25 / 0.08)";
  const { format } = useMoneyFormat();
  const year = new Date().getFullYear();
  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  });
  const { data: revenue } = useQuery({
    queryKey: ["dashboard", "revenue", year],
    queryFn: () =>
      apiFetch<{ year: number; months: { month: number; revenue: string }[] }>(
        `/dashboard/revenue-by-month?year=${year}`,
      ),
  });
  const { data: topClients } = useQuery({
    queryKey: ["dashboard", "top-clients"],
    queryFn: () => apiFetch<TopClientRow[]>("/dashboard/top-clients"),
  });

  const chartData =
    revenue?.months.map((m) => ({
      name: monthName(m.month),
      revenue: Number(m.revenue),
    })) ?? [];

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-charcoal/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent border-r-accent" />
        </div>
        <p className="font-sans text-sm text-charcoal/50 dark:text-white/50">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-charcoal dark:text-white md:text-5xl">
          Dashboard
        </h1>
        <p className="font-sans mt-2 text-charcoal/60 dark:text-white/60">
          Revenue, payments, and who pays you most — at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total invoiced" value={format(summary.total_invoiced)} variant="light" />
        <StatCard label="Total paid" value={format(summary.total_paid)} variant="light" />
        <StatCard label="Outstanding" value={format(summary.outstanding)} variant="soft" />
        <StatCard label="Overdue invoices" value={String(summary.overdue_count)} variant="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-interactive rounded-2xl border border-charcoal/10 bg-off/80 p-6 shadow-sm dark:border-white/10 dark:bg-dark/80 lg:col-span-2">
          <h2 className="font-display text-xl uppercase tracking-wide text-charcoal dark:text-white">
            Monthly revenue ({year})
          </h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickFill }} />
                <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: isDark
                      ? "1px solid rgb(255 255 255 / 0.12)"
                      : "1px solid rgb(23 30 25 / 0.1)",
                    backgroundColor: isDark ? "#272727" : "#ffffff",
                    color: isDark ? "#f8f9fa" : "#171e19",
                    fontFamily: "Satoshi, system-ui, sans-serif",
                  }}
                  formatter={(v) =>
                    v === undefined ? ["", ""] : [format(String(v)), "Revenue"]
                  }
                />
                <Bar dataKey="revenue" fill="#ffe17c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-interactive rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark">
          <h2 className="font-display text-xl uppercase tracking-wide text-charcoal dark:text-white">Top clients</h2>
          <p className="font-sans mt-1 text-sm text-charcoal/55 dark:text-white/55">By payment revenue</p>
          <ul className="mt-6 space-y-4">
            {!topClients?.length && (
              <li className="font-sans text-sm text-charcoal/50 dark:text-white/50">
                No payments yet — add invoices and record payments.
              </li>
            )}
            {topClients?.map((row, i) => (
              <li
                key={row.client_id}
                className="flex items-center justify-between gap-2 border-b border-charcoal/5 pb-4 last:border-0 last:pb-0 dark:border-white/10"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-display text-2xl text-accent/50">{i + 1}</span>
                  <Link
                    to={`/app/clients`}
                    className="font-sans truncate font-medium text-charcoal hover:text-accent dark:text-white dark:hover:text-accent"
                    title={row.client_name}
                  >
                    {row.client_name}
                  </Link>
                </div>
                <span className="font-sans shrink-0 text-sm font-medium tabular-nums text-charcoal dark:text-accent">
                  {format(row.total_revenue)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card-interactive overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm dark:border-white/10 dark:bg-dark">
        <div className="border-b border-charcoal/10 px-6 py-4 dark:border-white/10">
          <h2 className="font-display text-xl uppercase tracking-wide text-charcoal dark:text-white">Recent payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 bg-off/80 text-charcoal/60 dark:border-white/10 dark:bg-charcoal/50 dark:text-white/50">
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">When</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent_transactions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-charcoal/50 dark:text-white/50">
                    No payments yet.
                  </td>
                </tr>
              )}
              {summary.recent_transactions.map((t) => (
                <tr key={t.id} className="border-b border-charcoal/5 last:border-0 hover:bg-off/50 dark:border-white/5 dark:hover:bg-white/5">
                  <td className="px-6 py-4 text-charcoal dark:text-white">{t.description}</td>
                  <td className="px-6 py-4 text-charcoal/60 dark:text-white/60">
                    {new Date(t.occurred_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium tabular-nums text-charcoal dark:text-white">
                    {format(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function monthName(m: number) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    m - 1
  ];
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "light" | "soft" | "accent";
}) {
  const styles = {
    light:
      "border-charcoal/10 bg-white text-charcoal dark:border-white/10 dark:bg-charcoal dark:text-white",
    soft: "border-charcoal/10 bg-off text-charcoal dark:border-white/10 dark:bg-dark dark:text-white",
    accent: "border-accent/40 bg-accent/15 text-charcoal dark:border-accent/50 dark:bg-accent/20 dark:text-white",
  }[variant];

  return (
    <div
      className={`card-interactive rounded-2xl border p-5 shadow-sm ${styles}`}
    >
      <p
        className={`font-sans text-xs font-medium uppercase tracking-wider ${
          variant === "accent" ? "text-charcoal/55 dark:text-white/60" : "text-charcoal/50 dark:text-white/50"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 font-display text-3xl tabular-nums tracking-tight md:text-4xl">{value}</p>
    </div>
  );
}
