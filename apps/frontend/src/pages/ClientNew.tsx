import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";
import type { Client, UserPublic } from "../types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.union([z.literal(""), z.string().email("Enter a valid email address")]),
  phone: z.string().optional(),
  company: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country_code: z
    .string()
    .optional()
    .refine((v) => !v || v.trim().length === 0 || v.trim().length === 2, "Use a 2-letter country code"),
});

type Form = z.infer<typeof schema>;

const inputClass =
  "font-sans w-full rounded-lg border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-charcoal/40 focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white dark:placeholder:text-white/40";
const labelClass = "font-sans block text-sm font-medium text-charcoal dark:text-white";

export function ClientNew() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useOutletContext<{ user: UserPublic }>();
  const clientCap = user.limits.max_clients;
  const atClientCap = clientCap != null && user.usage.clients >= clientCap;

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      navigate("/app/clients");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address_line1: "",
      address_line2: "",
      city: "",
      region: "",
      postal_code: "",
      country_code: "",
    },
  });

  function onSubmit(values: Form) {
    const cc = values.country_code?.trim().toUpperCase();
    createMut.mutate({
      name: values.name,
      email: values.email || null,
      phone: values.phone?.trim() || null,
      company: values.company?.trim() || null,
      address_line1: values.address_line1?.trim() || null,
      address_line2: values.address_line2?.trim() || null,
      city: values.city?.trim() || null,
      region: values.region?.trim() || null,
      postal_code: values.postal_code?.trim() || null,
      country_code: cc && cc.length === 2 ? cc : null,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-charcoal dark:text-white md:text-5xl">
            New client
          </h1>
          <p className="font-sans mt-2 text-charcoal/60 dark:text-white/60">
            Contact details and billing address for invoices.
          </p>
        </div>
        <Link
          to="/app/clients"
          className="font-sans text-sm font-medium text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline dark:text-white/70 dark:hover:text-white"
        >
          ← Back to clients
        </Link>
      </div>

      {atClientCap && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-sans text-sm text-charcoal dark:text-white">
          You&apos;ve reached the client limit for your workspace ({user.usage.clients}/{clientCap}).{" "}
          <Link to="/app/help" className="font-medium underline">
            Help center
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card-interactive space-y-5 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark/80"
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input className={`${inputClass} mt-2`} {...register("name")} />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={`${inputClass} mt-2`} {...register("email")} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={`${inputClass} mt-2`} {...register("phone")} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input className={`${inputClass} mt-2`} {...register("company")} />
        </div>
        <div className="border-t border-charcoal/10 pt-5 dark:border-white/10">
          <p className="font-display text-sm uppercase tracking-wide text-charcoal/80 dark:text-white/80">
            Address
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass}>Line 1</label>
              <input className={`${inputClass} mt-2`} {...register("address_line1")} />
            </div>
            <div>
              <label className={labelClass}>Line 2</label>
              <input className={`${inputClass} mt-2`} {...register("address_line2")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>City</label>
                <input className={`${inputClass} mt-2`} {...register("city")} />
              </div>
              <div>
                <label className={labelClass}>Region / state</label>
                <input className={`${inputClass} mt-2`} {...register("region")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Postal code</label>
                <input className={`${inputClass} mt-2`} {...register("postal_code")} />
              </div>
              <div>
                <label className={labelClass}>Country (ISO)</label>
                <input
                  className={`${inputClass} mt-2 uppercase`}
                  placeholder="NG"
                  maxLength={2}
                  {...register("country_code")}
                />
                {errors.country_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.country_code.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        {createMut.isError && (
          <p className="text-sm text-red-600">{(createMut.error as Error).message}</p>
        )}
        <Button type="submit" disabled={createMut.isPending || atClientCap} variant="dark" className="w-full !rounded-lg py-3">
          {createMut.isPending ? "Saving…" : "Create client"}
        </Button>
      </form>
    </div>
  );
}
