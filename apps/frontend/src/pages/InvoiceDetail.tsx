import { pdf } from "@react-pdf/renderer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";
import { useMoneyFormat } from "../hooks/useMoneyFormat";
import { InvoicePdfDoc } from "../pdf/InvoicePdf";
import type { Client, Invoice, UserPublic } from "../types";

const paySchema = z.object({
  amount: z.number().positive(),
  note: z.string().optional(),
});

type PayForm = z.infer<typeof paySchema>;

const inputClass =
  "font-sans w-full rounded-lg border border-charcoal/20 px-3 py-2.5 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40";

const statusBadge: Record<string, string> = {
  draft: "border border-charcoal/15 bg-sage/25 text-charcoal",
  sent: "border border-charcoal/20 bg-dark text-white",
  partial: "border border-accent/50 bg-accent/35 text-charcoal",
  paid: "border border-charcoal/20 bg-charcoal text-white",
  overdue: "border border-red-200 bg-red-50 text-red-900",
};

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { format } = useMoneyFormat();
  const { user } = useOutletContext<{ user: UserPublic }>();
  const canDelete = user.role === "owner";

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => apiFetch<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<Client[]>("/clients"),
  });

  const clientName =
    clients.find((c) => c.id === invoice?.client_id)?.name ?? "Client";

  const payMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Invoice>(`/invoices/${id}/payments`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["invoice", id] });
    },
    onSuccess: (data) => {
      qc.setQueryData(["invoice", id], data);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => apiFetch(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      window.location.href = "/app/invoices";
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayForm>({ resolver: zodResolver(paySchema) });

  async function downloadPdf() {
    if (!invoice) return;
    const blob = await pdf(
      <InvoicePdfDoc invoice={invoice} clientName={clientName} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || !invoice) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="font-sans text-charcoal/50">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/app/invoices"
            className="font-sans text-sm font-medium text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline"
          >
            ← Invoices
          </Link>
          <h1 className="font-display mt-3 text-4xl uppercase leading-[0.95] tracking-tight text-charcoal md:text-5xl">
            {invoice.invoice_number}
          </h1>
          <p className="font-sans mt-2 text-charcoal/60">
            {clientName} · Due {invoice.due_date}
          </p>
          <span
            className={`mt-3 inline-block rounded-full px-2.5 py-0.5 font-sans text-xs font-medium uppercase tracking-wide ${statusBadge[invoice.status] ?? ""}`}
          >
            {invoice.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="!rounded-lg" onClick={() => void downloadPdf()}>
            Download PDF
          </Button>
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this invoice?")) deleteMut.mutate();
              }}
              className="font-sans rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="card-interactive overflow-hidden rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <table className="w-full font-sans text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-left text-charcoal/50">
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium">Qty</th>
              <th className="pb-3 text-right font-medium">Price</th>
              <th className="pb-3 text-right font-medium">Line</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id} className="border-b border-charcoal/5 last:border-0">
                <td className="py-3 text-charcoal">{it.description}</td>
                <td className="py-3 tabular-nums text-charcoal/80">{it.quantity}</td>
                <td className="py-3 text-right tabular-nums text-charcoal">
                  {format(it.unit_price, invoice.currency)}
                </td>
                <td className="py-3 text-right font-medium tabular-nums text-charcoal">
                  {format(it.line_total, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 space-y-1 border-t border-charcoal/10 pt-4 text-right font-sans text-sm text-charcoal/80">
          <p>Subtotal: {format(invoice.subtotal, invoice.currency)}</p>
          <p>Tax: {format(invoice.tax_amount, invoice.currency)}</p>
          <p className="font-display text-2xl uppercase tracking-tight text-charcoal">
            Total: {format(invoice.total, invoice.currency)}
          </p>
        </div>
      </div>

      {invoice.status !== "draft" && invoice.status !== "paid" && (
        <form
          onSubmit={handleSubmit((v) =>
            payMut.mutate({
              amount: String(v.amount),
              note: v.note || null,
            }),
          )}
          className="card-interactive space-y-4 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm"
        >
          <h2 className="font-display text-xl uppercase tracking-wide text-charcoal">Log amount received</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-sans text-sm font-medium text-charcoal">
                Amount ({invoice.currency})
              </label>
              <input
                type="number"
                step="any"
                className={`${inputClass} mt-2`}
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-charcoal">Note</label>
              <input className={`${inputClass} mt-2`} {...register("note")} />
            </div>
          </div>
          <Button type="submit" disabled={payMut.isPending} variant="dark" className="!rounded-lg">
            {payMut.isPending ? "Saving…" : "Add to invoice"}
          </Button>
        </form>
      )}
    </div>
  );
}
