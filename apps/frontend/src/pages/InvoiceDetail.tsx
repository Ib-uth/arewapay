import { pdf } from "@react-pdf/renderer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../api/client";
import { useNotifications } from "../components/NotificationProvider";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";
import { useMoneyFormat } from "../hooks/useMoneyFormat";
import { billToTextForInvoice } from "../lib/billToPreview";
import { logoDataUrlForPdf } from "../lib/logoForPdf";
import { userDisplayName } from "../lib/userDisplay";
import { InvoicePdfDoc } from "../pdf/InvoicePdf";
import type { Client, Invoice, UserPublic } from "../types";

const paySchema = z.object({
  amount: z.number().positive(),
  note: z.string().optional(),
});

type PayForm = z.infer<typeof paySchema>;

const inputClass =
  "font-sans w-full rounded-lg border border-charcoal/20 px-3 py-2.5 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white";

const statusBadge: Record<string, string> = {
  draft:
    "border border-charcoal/15 bg-sage/25 text-charcoal dark:border-white/15 dark:bg-sage/30 dark:text-white",
  sent: "border border-charcoal/20 bg-dark text-white dark:border-white/20",
  partial:
    "border border-accent/50 bg-accent/35 text-charcoal dark:border-accent/40 dark:bg-accent/25 dark:text-white",
  paid: "border border-charcoal/20 bg-charcoal text-white dark:border-white/20",
  overdue:
    "border border-red-200 bg-red-50 text-red-900 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-100",
};

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const { format } = useMoneyFormat();
  const { user } = useOutletContext<{ user: UserPublic }>();
  const canDelete = user.role === "owner";
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendBanner, setSendBanner] = useState<{ type: "ok" | "warn"; msg: string } | null>(null);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => apiFetch<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<Client[]>("/clients"),
  });

  const client = clients.find((c) => c.id === invoice?.client_id);
  const clientName = client?.name ?? "Client";

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
      toast("Payment recorded.", "success");
      addNotification({
        kind: "payment",
        title: "Payment recorded",
        body: `${data.invoice_number} — ${data.status}`,
      });
    },
  });

  useEffect(() => {
    if (!sendBanner) return;
    const t = window.setTimeout(() => setSendBanner(null), 6000);
    return () => window.clearTimeout(t);
  }, [sendBanner]);

  const sendMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
        credentials: "include",
      });
      const text = await res.text();
      const emailSent = res.headers.get("X-Email-Sent") === "true";
      const senderCopySent = res.headers.get("X-Sender-Copy-Sent");
      if (!res.ok) {
        let msg = res.statusText;
        try {
          const j = JSON.parse(text) as { detail?: string };
          if (typeof j.detail === "string") msg = j.detail;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = JSON.parse(text) as Invoice;
      return { data, emailSent, senderCopySent };
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["invoice", id] });
      const prev = qc.getQueryData<Invoice>(["invoice", id]);
      if (prev) {
        qc.setQueryData(["invoice", id], {
          ...prev,
          status: prev.status === "draft" ? "sent" : prev.status,
          times_sent: (prev.times_sent ?? 0) + 1,
        });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["invoice", id], ctx.prev);
      toast(e instanceof Error ? e.message : "Could not send invoice.", "error");
    },
    onSuccess: ({ data, emailSent, senderCopySent }) => {
      qc.setQueryData(["invoice", id], data);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setSendModalOpen(false);
      const em = clients.find((x) => x.id === data.client_id)?.email ?? "client";
      if (emailSent) {
        setSendBanner({ type: "ok", msg: `Invoice sent to ${em}` });
        toast(`Invoice emailed to ${em}.`, "success");
        if (senderCopySent === "false") {
          toast("We could not email a copy to your inbox. Check Resend or try again.", "info");
        }
      } else {
        setSendBanner({
          type: "warn",
          msg: "Invoice marked as sent, but email delivery is not configured",
        });
        toast("Invoice marked sent (email not configured).", "info");
      }
      addNotification({
        kind: "invoice_email",
        title: emailSent ? "Invoice emailed" : "Invoice marked sent",
        body: `${data.invoice_number} → ${em}`,
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => apiFetch(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast("Invoice deleted.");
      navigate("/app/invoices", { replace: true });
    },
    onError: (e) => {
      toast(e instanceof Error ? e.message : "Could not delete invoice.", "error");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayForm>({ resolver: zodResolver(paySchema) });

  async function downloadPdf() {
    if (!invoice) return;
    const billToText = billToTextForInvoice(invoice.bill_to_snapshot, client, clientName);
    const logoForPdf = await logoDataUrlForPdf(user.logo_url);
    const blob = await pdf(
      <InvoicePdfDoc
        invoice={invoice}
        clientName={clientName}
        billToText={billToText}
        logoUrl={logoForPdf}
        fromName={user.org_name?.trim() || userDisplayName(user)}
        fromEmail={user.email}
      />,
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
        <p className="font-sans text-charcoal/50 dark:text-white/50">Loading…</p>
      </div>
    );
  }

  const canSendToClient = invoice.status !== "paid" && Boolean(client?.email);
  const sendCount = invoice.times_sent ?? 0;
  const isResendToClient = sendCount > 0;
  const showPayForm = invoice.status !== "draft" && invoice.status !== "paid";
  const showSendBelowPayForm = canSendToClient && showPayForm;
  const showSendInHeader = canSendToClient && !showPayForm;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {sendBanner && (
        <div
          className={
            sendBanner.type === "ok"
              ? "rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-sans text-sm text-green-900 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-100"
              : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100"
          }
          role="status"
        >
          {sendBanner.msg}
        </div>
      )}

      {sendModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-invoice-title"
        >
          <div className="max-w-md rounded-2xl border border-charcoal/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-charcoal">
            <h2 id="send-invoice-title" className="font-display text-lg uppercase text-charcoal dark:text-white">
              {isResendToClient ? "Resend invoice" : "Send invoice"}
            </h2>
            <p className="font-sans mt-3 text-sm text-charcoal/75 dark:text-white/75">
              {isResendToClient ? "Resend" : "Send"} {invoice.invoice_number} to {client?.email ?? ""}?
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="!rounded-lg"
                disabled={sendMut.isPending}
                onClick={() => setSendModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="dark"
                className="!rounded-lg"
                disabled={sendMut.isPending}
                onClick={() => sendMut.mutate()}
              >
                {sendMut.isPending ? "Sending…" : isResendToClient ? "Resend" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <Link
            to="/app/invoices"
            className="font-sans text-sm font-medium text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline dark:text-white/70 dark:hover:text-white"
          >
            ← Invoices
          </Link>
          <h1 className="font-display mt-3 text-4xl uppercase leading-[0.95] tracking-tight text-charcoal dark:text-white md:text-5xl">
            {invoice.invoice_number}
          </h1>
          <p className="font-sans mt-2 text-charcoal/60 dark:text-white/65">
            {clientName} · Issued {invoice.issue_date} · Due {invoice.due_date}
          </p>
          {(invoice.payment_terms || invoice.po_number) && (
            <p className="font-sans mt-1 text-sm text-charcoal/55 dark:text-white/55">
              {invoice.payment_terms && <span>Terms: {invoice.payment_terms}</span>}
              {invoice.payment_terms && invoice.po_number && " · "}
              {invoice.po_number && <span>PO: {invoice.po_number}</span>}
            </p>
          )}
          <span
            className={`mt-3 inline-block rounded-full px-2.5 py-0.5 font-sans text-xs font-medium uppercase tracking-wide ${statusBadge[invoice.status] ?? ""}`}
          >
            {invoice.status}
          </span>
          {invoice.status !== "paid" && !client?.email && (
            <p className="font-sans mt-3 text-xs text-charcoal/50 dark:text-white/50">
              Add a client email to send this invoice.
            </p>
          )}
          {sendCount > 0 && (
            <p className="font-sans mt-2 text-xs text-charcoal/55 dark:text-white/55">
              Emailed to client {sendCount} {sendCount === 1 ? "time" : "times"}.
            </p>
          )}
        </div>
        <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {showSendInHeader && (
              <Button
                type="button"
                variant="primary"
                className="!rounded-lg"
                disabled={sendMut.isPending}
                onClick={() => setSendModalOpen(true)}
              >
                {isResendToClient ? "Resend to client" : "Send to client"}
              </Button>
            )}
            <Button type="button" variant="ghost" className="!rounded-lg" onClick={() => void downloadPdf()}>
              Download PDF
            </Button>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this invoice?")) deleteMut.mutate();
                }}
                className="font-sans rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800/60 dark:bg-charcoal dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-interactive overflow-hidden rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark/80">
        <table className="w-full font-sans text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-left text-charcoal/50 dark:border-white/10 dark:text-white/50">
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium">Qty</th>
              <th className="pb-3 text-right font-medium">Price</th>
              <th className="pb-3 text-right font-medium">Line</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id} className="border-b border-charcoal/5 last:border-0 dark:border-white/10">
                <td className="py-3 text-charcoal dark:text-white">{it.description}</td>
                <td className="py-3 tabular-nums text-charcoal/80 dark:text-white/80">{it.quantity}</td>
                <td className="py-3 text-right tabular-nums text-charcoal dark:text-white">
                  {format(it.unit_price, invoice.currency)}
                </td>
                <td className="py-3 text-right font-medium tabular-nums text-charcoal dark:text-white">
                  {format(it.line_total, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 space-y-1 border-t border-charcoal/10 pt-4 text-right font-sans text-sm text-charcoal/80 dark:border-white/10 dark:text-white/80">
          <p>Subtotal: {format(invoice.subtotal, invoice.currency)}</p>
          {Number(invoice.discount_amount) > 0 && (
            <p>
              Discount ({(Number(invoice.discount_rate) * 100).toFixed(1)}%): −
              {format(invoice.discount_amount, invoice.currency)}
            </p>
          )}
          <p>
            Tax ({(Number(invoice.tax_rate) * 100).toFixed(2)}%):{" "}
            {format(invoice.tax_amount, invoice.currency)}
          </p>
          <p className="font-display text-2xl uppercase tracking-tight text-charcoal dark:text-white">
            Total: {format(invoice.total, invoice.currency)}
          </p>
        </div>
      </div>

      {showPayForm && (
        <div className="space-y-4">
          <form
            onSubmit={handleSubmit((v) =>
              payMut.mutate({
                amount: String(v.amount),
                note: v.note || null,
              }),
            )}
            className="card-interactive space-y-4 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark/80"
          >
            <h2 className="font-display text-xl uppercase tracking-wide text-charcoal dark:text-white">
              Log amount received
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-sans text-sm font-medium text-charcoal dark:text-white">
                  Amount ({invoice.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  className={`${inputClass} mt-2`}
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
                )}
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-charcoal dark:text-white">Note</label>
                <input className={`${inputClass} mt-2`} {...register("note")} />
              </div>
            </div>
            <Button type="submit" disabled={payMut.isPending} variant="dark" className="!rounded-lg">
              {payMut.isPending ? "Saving…" : "Add to invoice"}
            </Button>
          </form>
          {showSendBelowPayForm && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                className="!rounded-lg"
                disabled={sendMut.isPending}
                onClick={() => setSendModalOpen(true)}
              >
                {isResendToClient ? "Resend to client" : "Send to client"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
