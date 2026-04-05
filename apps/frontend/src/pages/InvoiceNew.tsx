import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../api/client";
import { useNotifications } from "../components/NotificationProvider";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";
import { LabelWithInfo } from "../components/ui/InfoTip";
import { formatBillToPreview } from "../lib/billToPreview";
import type { Client, UserPublic } from "../types";

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
});

function normalizePrefixInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

const schema = z
  .object({
    client_id: z.string().min(1),
    issue_date: z.string().min(1),
    due_date: z.string().min(1),
    tax_rate: z.number().min(0).max(1),
    discount_percent: z.number().min(0).max(100),
    invoice_number_prefix: z.string().optional(),
    payment_preset: z.enum([
      "Due on receipt",
      "Net 7",
      "Net 14",
      "Net 30",
      "Net 60",
      "custom",
    ]),
    payment_terms_custom: z.string().optional(),
    po_number: z.string().optional(),
    items: z.array(itemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const p = data.invoice_number_prefix?.trim();
    if (p && normalizePrefixInput(p).length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use exactly 3 letters A–Z",
        path: ["invoice_number_prefix"],
      });
    }
    if (data.payment_preset === "custom" && !(data.payment_terms_custom?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter custom payment terms",
        path: ["payment_terms_custom"],
      });
    }
  });

type Form = z.infer<typeof schema>;

const inputClass =
  "font-sans w-full rounded-lg border border-charcoal/20 px-3 py-2.5 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white";
const labelClass = "font-sans block text-sm font-medium text-charcoal dark:text-white";

function derivePlaceholderPrefix(u: UserPublic): string {
  const raw = (u.org_name?.trim() || u.display_name?.trim() || u.email.split("@")[0] || "INV").trim();
  const word = raw.split(/\s+/)[0] || "INV";
  const letters = word.toUpperCase().replace(/[^A-Z]/g, "");
  if (letters.length >= 3) return letters.slice(0, 3);
  return (letters + "XXX").slice(0, 3);
}

export function InvoiceNew() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const { user } = useOutletContext<{ user: UserPublic }>();
  const defaultCurrency = user.currency_code ?? "NGN";
  const placeholderPrefix = derivePlaceholderPrefix(user);
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<Client[]>("/clients"),
  });

  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{ id: string }>("/invoices", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast("Invoice created as draft.");
      addNotification({
        kind: "invoice",
        title: "Invoice created",
        body: "Draft saved — open to review or send.",
      });
      navigate(`/app/invoices/${res.id}`);
    },
    onError: (e) => {
      toast(e instanceof Error ? e.message : "Could not create invoice.", "error");
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      issue_date: today,
      due_date: today,
      tax_rate: 0.075,
      discount_percent: 0,
      payment_preset: "Net 30",
      payment_terms_custom: "",
      po_number: "",
      invoice_number_prefix: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const clientId = (useWatch({ control, name: "client_id" }) as string | undefined) ?? "";
  const issueDate = (useWatch({ control, name: "issue_date" }) as string | undefined) ?? today;
  const prefixWatch = (useWatch({ control, name: "invoice_number_prefix" }) as string | undefined) ?? "";
  const taxRate = (useWatch({ control, name: "tax_rate" }) as number | undefined) ?? 0;
  const discountPct = (useWatch({ control, name: "discount_percent" }) as number | undefined) ?? 0;
  const itemsWatch = useWatch({ control, name: "items" }) as Form["items"] | undefined;
  const paymentPreset = useWatch({ control, name: "payment_preset" }) as Form["payment_preset"];

  const selectedClient = clients.find((c) => c.id === clientId);
  const billPreview = formatBillToPreview(selectedClient);

  const effectivePrefix = useMemo(() => {
    const n = normalizePrefixInput(prefixWatch);
    return n.length === 3 ? n : placeholderPrefix;
  }, [prefixWatch, placeholderPrefix]);

  const previewYear = useMemo(() => {
    const d = new Date(issueDate + "T12:00:00");
    return Number.isFinite(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
  }, [issueDate]);

  const { subtotal, taxAmt, discAmt, totalPreview } = useMemo(() => {
    const items = itemsWatch ?? [];
    let sub = 0;
    for (const it of items) {
      if (it && typeof it.quantity === "number" && typeof it.unit_price === "number") {
        sub += it.quantity * it.unit_price;
      }
    }
    const dr = discountPct / 100;
    const ta = sub * taxRate;
    const da = sub * dr;
    const tot = sub + ta - da;
    return {
      subtotal: sub,
      taxAmt: ta,
      discAmt: da,
      totalPreview: tot,
    };
  }, [itemsWatch, taxRate, discountPct]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  function onSubmit(values: Form) {
    const prefixNorm = normalizePrefixInput(values.invoice_number_prefix ?? "");
    const paymentTerms =
      values.payment_preset === "custom"
        ? values.payment_terms_custom?.trim() || null
        : values.payment_preset;
    mut.mutate({
      client_id: values.client_id,
      issue_date: values.issue_date,
      due_date: values.due_date,
      tax_rate: String(values.tax_rate),
      discount_rate: String(values.discount_percent / 100),
      currency: defaultCurrency,
      status: "draft",
      payment_terms: paymentTerms,
      po_number: values.po_number?.trim() || null,
      invoice_number_prefix: prefixNorm.length === 3 ? prefixNorm : undefined,
      items: values.items.map((i) => ({
        description: i.description,
        quantity: String(i.quantity),
        unit_price: String(i.unit_price),
      })),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-charcoal dark:text-white md:text-5xl">
            New invoice
          </h1>
          <p className="font-sans mt-2 text-charcoal/60 dark:text-white/60">
            Line items, tax, discounts, and terms — in your workspace currency ({defaultCurrency}).
          </p>
        </div>
        <Link
          to="/app/invoices"
          className="font-sans text-sm font-medium text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline dark:text-white/70 dark:hover:text-white"
        >
          ← Back to invoices
        </Link>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card-interactive space-y-5 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark/80"
      >
        <div>
          <label className={labelClass}>Client</label>
          <select className={`${inputClass} mt-2`} {...register("client_id")}>
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.client_id && (
            <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
          )}
        </div>

        {clientId && (
          <div className="rounded-xl border border-charcoal/10 bg-off/50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-charcoal/60 dark:text-white/60">
              Bill to
            </p>
            {billPreview ? (
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-charcoal dark:text-white">
                {billPreview}
              </pre>
            ) : (
              <p className="mt-2 font-sans text-sm text-charcoal/55 dark:text-white/55">
                Add address details on the client record to show a full bill-to block.
              </p>
            )}
          </div>
        )}

        <div>
          <label className={labelClass}>Invoice prefix (3 letters)</label>
          <input
            className={`${inputClass} mt-2 uppercase`}
            maxLength={8}
            placeholder={placeholderPrefix}
            {...register("invoice_number_prefix", {
              onChange: (e) => {
                e.target.value = normalizePrefixInput(e.target.value);
              },
            })}
          />
          <p className="font-sans mt-1 text-xs text-charcoal/50 dark:text-white/50">
            Next number preview:{" "}
            <span className="font-medium text-charcoal dark:text-white">
              {effectivePrefix}-{previewYear}-#####
            </span>{" "}
            (sequence assigned when you save)
          </p>
          {errors.invoice_number_prefix && (
            <p className="mt-1 text-sm text-red-600">{errors.invoice_number_prefix.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Issue date</label>
            <input type="date" className={`${inputClass} mt-2`} {...register("issue_date")} />
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" className={`${inputClass} mt-2`} {...register("due_date")} />
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
            )}
          </div>
        </div>

        <div>
          <LabelWithInfo
            htmlFor="inv-payment-preset"
            label="Payment terms"
            labelClassName={labelClass}
            hint="When payment is due. For example, Net 30 means the client should pay within 30 days of the invoice date."
          />
          <select
            id="inv-payment-preset"
            className={`${inputClass} mt-2`}
            {...register("payment_preset")}
          >
            <option value="Due on receipt">Due on receipt</option>
            <option value="Net 7">Net 7</option>
            <option value="Net 14">Net 14</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 60">Net 60</option>
            <option value="custom">Custom…</option>
          </select>
          {paymentPreset === "custom" && (
            <input
              className={`${inputClass} mt-2`}
              placeholder="e.g. Net 45"
              {...register("payment_terms_custom")}
            />
          )}
          {errors.payment_terms_custom && (
            <p className="mt-1 text-sm text-red-600">{errors.payment_terms_custom.message}</p>
          )}
        </div>

        <div>
          <LabelWithInfo
            htmlFor="inv-po-number"
            label="PO / Reference number"
            labelClassName={labelClass}
            hint="Optional purchase order or reference your client uses internally (shown on the invoice)."
          />
          <input id="inv-po-number" className={`${inputClass} mt-2`} {...register("po_number")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Tax rate (0–1)</label>
            <input
              step="0.001"
              type="number"
              className={`${inputClass} mt-2`}
              {...register("tax_rate", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className={labelClass}>Discount (%)</label>
            <input
              step="0.1"
              type="number"
              className={`${inputClass} mt-2`}
              {...register("discount_percent", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="rounded-xl border border-charcoal/10 bg-off/40 p-4 font-sans text-sm text-charcoal dark:border-white/10 dark:bg-white/5 dark:text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50 dark:text-white/50">
            Totals preview
          </p>
          <p className="mt-2">Subtotal: {subtotal.toFixed(2)}</p>
          <p>Tax: {taxAmt.toFixed(2)}</p>
          {discountPct > 0 && <p>Discount: −{discAmt.toFixed(2)}</p>}
          <p className="mt-1 font-semibold">Total: {totalPreview.toFixed(2)} {defaultCurrency}</p>
        </div>

        <div>
          <p className={`${labelClass} mb-2`}>Line items</p>
          <div className="mb-2 hidden gap-2 px-1 font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50 sm:grid sm:grid-cols-12 dark:text-white/50">
            <div className="sm:col-span-5">Item</div>
            <div className="sm:col-span-2">Qty</div>
            <div className="sm:col-span-3">Price</div>
            <div className="sm:col-span-2" />
          </div>
          {fields.map((f, idx) => (
            <div
              key={f.id}
              className="mb-3 grid gap-2 rounded-xl border border-charcoal/10 bg-off/50 p-3 dark:border-white/10 dark:bg-white/5 sm:grid-cols-12"
            >
              <div className="sm:col-span-5">
                <input
                  className={`${inputClass} text-sm`}
                  placeholder="Description"
                  {...register(`items.${idx}.description` as const)}
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="any"
                  className={`${inputClass} text-sm`}
                  placeholder="Qty"
                  {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="number"
                  step="any"
                  className={`${inputClass} text-sm`}
                  placeholder="Unit price"
                  {...register(`items.${idx}.unit_price`, { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-center justify-end sm:col-span-2">
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="font-sans text-xs text-red-600 hover:underline dark:text-red-400"
                    onClick={() => remove(idx)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="mt-3 flex justify-end sm:justify-start">
            <button
              type="button"
              className="font-sans text-sm font-medium text-charcoal underline-offset-4 hover:underline dark:text-white"
              onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
            >
              + Add line
            </button>
          </div>
          {errors.items && (
            <p className="text-sm text-red-600">{errors.items.message || "Check line items"}</p>
          )}
        </div>
        <Button type="submit" disabled={mut.isPending} variant="dark" className="w-full !rounded-lg py-3">
          {mut.isPending ? "Saving…" : "Create invoice"}
        </Button>
      </form>
    </div>
  );
}
