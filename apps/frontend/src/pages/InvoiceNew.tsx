import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";
import { formatBillToPreview } from "../lib/billToPreview";
import type { Client, UserPublic } from "../types";

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
});

const schema = z.object({
  client_id: z.string().min(1),
  due_date: z.string(),
  tax_rate: z.number().min(0).max(1),
  status: z.enum(["draft", "sent"]),
  items: z.array(itemSchema).min(1),
});

type Form = z.infer<typeof schema>;

const inputClass =
  "font-sans w-full rounded-lg border border-charcoal/20 px-3 py-2.5 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white";
const labelClass = "font-sans block text-sm font-medium text-charcoal dark:text-white";

export function InvoiceNew() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useOutletContext<{ user: UserPublic }>();
  const defaultCurrency = user.currency_code ?? "NGN";
  const invCap = user.limits.max_invoices_per_30_days;
  const atInvoiceCap = invCap != null && user.usage.invoices_last_30_days >= invCap;
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<Client[]>("/clients"),
  });

  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{ id: string }>("/invoices", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      navigate(`/app/invoices/${res.id}`);
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      due_date: new Date().toISOString().slice(0, 10),
      tax_rate: 0.075,
      status: "sent",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const clientId = (useWatch({ control, name: "client_id" }) as string | undefined) ?? "";
  const selectedClient = clients.find((c) => c.id === clientId);
  const billPreview = formatBillToPreview(selectedClient);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  function onSubmit(values: Form) {
    mut.mutate({
      client_id: values.client_id,
      due_date: values.due_date,
      tax_rate: String(values.tax_rate),
      currency: defaultCurrency,
      status: values.status,
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
            Line items, tax, and due date — all in NGN.
          </p>
        </div>
        <Link
          to="/app/invoices"
          className="font-sans text-sm font-medium text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline dark:text-white/70 dark:hover:text-white"
        >
          ← Back to invoices
        </Link>
      </div>

      {atInvoiceCap && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-sans text-sm text-charcoal dark:text-white">
          You&apos;ve reached the invoice limit for the last 30 days ({user.usage.invoices_last_30_days}/{invCap}
          ).{" "}
          <Link to="/app/help" className="font-medium underline">
            Help center
          </Link>{" "}
          explains how rolling limits work.
        </div>
      )}

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" className={`${inputClass} mt-2`} {...register("due_date")} />
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Tax rate (0–1)</label>
            <input
              step="0.001"
              type="number"
              className={`${inputClass} mt-2`}
              {...register("tax_rate", { valueAsNumber: true })}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select className={`${inputClass} mt-2`} {...register("status")}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
          </select>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className={labelClass}>Line items</span>
            <button
              type="button"
              className="font-sans text-sm font-medium text-charcoal underline-offset-4 hover:underline dark:text-white"
              onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
            >
              + Add line
            </button>
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
          {errors.items && (
            <p className="text-sm text-red-600">{errors.items.message || "Check line items"}</p>
          )}
        </div>
        {mut.isError && (
          <p className="text-sm text-red-600">{String((mut.error as Error).message)}</p>
        )}
        <Button type="submit" disabled={mut.isPending} variant="dark" className="w-full !rounded-lg py-3">
          {mut.isPending ? "Saving…" : "Create invoice"}
        </Button>
      </form>
    </div>
  );
}
