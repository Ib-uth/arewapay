import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useOutletContext } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";
import { downloadCsv } from "../lib/csvExport";
import type { Client, UserPublic } from "../types";

export function Clients() {
  const qc = useQueryClient();
  const { user } = useOutletContext<{ user: UserPublic }>();
  const canDelete = user.role === "owner";
  const clientCap = user.limits.max_clients;
  const atClientCap = clientCap != null && user.usage.clients >= clientCap;

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<Client[]>("/clients"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  function exportClients() {
    downloadCsv(
      `clients-${new Date().toISOString().slice(0, 10)}.csv`,
      clients.map((c) => ({
        name: c.name,
        company: c.company ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        city: c.city ?? "",
        region: c.region ?? "",
        postal_code: c.postal_code ?? "",
        country_code: c.country_code ?? "",
      })),
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="font-sans text-charcoal/50 dark:text-white/50">Loading clients…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-charcoal dark:text-white md:text-5xl">
            Clients
          </h1>
          <p className="font-sans mt-2 text-charcoal/60 dark:text-white/60">
            People and companies you invoice in NGN.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="ghost"
            className="!rounded-lg !py-3 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            onClick={exportClients}
            disabled={clients.length === 0}
          >
            Export clients
          </Button>
          <Button to="/app/clients/new" variant="primary" className="!rounded-lg !py-3 !text-base">
            Add client
          </Button>
        </div>
      </div>

      {atClientCap && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-sans text-sm text-charcoal dark:text-white">
          You&apos;re at your plan&apos;s client limit ({user.usage.clients}/{clientCap}).{" "}
          <Link to="/pricing" className="font-medium underline">
            Upgrade
          </Link>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm dark:border-white/10 dark:bg-dark/80">
        <table className="min-w-full border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 bg-off/80 dark:border-white/10 dark:bg-white/5">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">Name</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">Company</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">Email</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">Phone</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal dark:text-white">City</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-charcoal dark:text-white">
                {canDelete ? "Actions" : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/10 dark:divide-white/10">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-off/60 dark:hover:bg-white/5">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-charcoal dark:text-white">{c.name}</td>
                <td className="max-w-[10rem] truncate px-4 py-3 text-charcoal/75 dark:text-white/75">
                  {c.company ?? "—"}
                </td>
                <td className="max-w-[12rem] truncate px-4 py-3 text-charcoal/75 dark:text-white/75">
                  {c.email ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-charcoal/75 dark:text-white/75">
                  {c.phone ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-charcoal/75 dark:text-white/75">
                  {c.city ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {canDelete && (
                    <button
                      type="button"
                      className="font-sans text-sm text-red-600 hover:underline dark:text-red-400"
                      onClick={() => {
                        if (confirm("Delete this client?")) deleteMut.mutate(c.id);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <p className="px-4 py-12 text-center font-sans text-sm text-charcoal/50 dark:text-white/50">
            No clients yet. Add one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
