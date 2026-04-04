import { useEffect, useMemo } from "react";
import { clearRootDarkClass } from "../lib/clearRootDarkClass";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";

function strengthMeta(pw: string): { pct: number; label: "Weak" | "Fair" | "Strong" } {
  let pts = 0;
  if (pw.length >= 8) pts += 1;
  if (pw.length >= 12) pts += 1;
  if (/[a-z]/.test(pw)) pts += 1;
  if (/[A-Z]/.test(pw)) pts += 1;
  if (/[0-9]/.test(pw)) pts += 1;
  if (/[^A-Za-z0-9]/.test(pw)) pts += 1;
  const pct = Math.min(100, Math.round((pts / 6) * 100));
  const label: "Weak" | "Fair" | "Strong" = pts <= 2 ? "Weak" : pts <= 4 ? "Fair" : "Strong";
  return { pct, label };
}

const schema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(8, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.confirm_password.length > 0 && data.confirm_password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters",
        path: ["confirm_password"],
      });
    }
    if (data.password.length >= 8 && data.confirm_password.length >= 8 && data.password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords must match",
        path: ["confirm_password"],
      });
    }
  });

type Form = z.infer<typeof schema>;

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailParam,
      first_name: "",
      last_name: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
  });

  const passwordVal = (useWatch({ control, name: "password" }) as string | undefined) ?? "";
  const strength = useMemo(() => strengthMeta(passwordVal), [passwordVal]);

  useEffect(() => {
    clearRootDarkClass();
  }, []);

  useEffect(() => {
    if (emailParam) {
      reset((prev) => ({ ...prev, email: emailParam }));
    }
  }, [emailParam, reset]);

  async function onSubmit(values: Form) {
    try {
      const res = await apiFetch<{ message: string; email_sent: boolean }>("/auth/register/request", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          confirm_password: values.confirm_password,
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          phone: values.phone.trim(),
        }),
      });
      navigate("/register/verify", {
        state: { email: values.email, email_sent: res.email_sent },
      });
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Registration failed" });
    }
  }

  const inputClass =
    "font-sans mt-2 w-full rounded-lg border border-charcoal/20 px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white";

  const barColor =
    strength.label === "Weak"
      ? "bg-red-500"
      : strength.label === "Fair"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="bg-grid-pattern flex min-h-screen bg-white text-charcoal">
      <div className="hidden w-1/2 flex-col justify-between bg-dark p-12 text-white lg:flex">
        <Link to="/" className="font-display text-2xl uppercase">
          ArewaPay<span className="text-accent">.</span>
        </Link>
        <div>
          <p className="font-display text-5xl uppercase leading-[0.9]">Create your workspace</p>
          <p className="font-sans mt-6 max-w-sm text-sage/90">
            Clients, invoices, and receivables — multi-currency · built for African SMEs.
          </p>
        </div>
        <div aria-hidden className="h-px w-16 bg-white/10" />
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <Link
          to="/"
          className="font-sans mb-8 text-sm font-medium text-charcoal/60 hover:text-charcoal dark:text-white/60 dark:hover:text-white lg:hidden"
        >
          ← Back home
        </Link>
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-4xl uppercase leading-[0.9] text-charcoal dark:text-white md:text-5xl">
            Sign up
          </h1>
          <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
            Create an account to manage clients and invoices in one place.
          </p>
          <form className="mt-10 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
                  First name
                </label>
                <input className={inputClass} autoComplete="given-name" {...register("first_name")} />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
                  Last name
                </label>
                <input className={inputClass} autoComplete="family-name" {...register("last_name")} />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">Email</label>
              <input
                className={inputClass}
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">Phone</label>
              <input
                className={inputClass}
                type="tel"
                autoComplete="tel"
                placeholder="+234…"
                {...register("phone")}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">Password</label>
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              {passwordVal.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between font-sans text-xs text-charcoal/60 dark:text-white/60">
                    <span>Strength</span>
                    <span className="font-medium text-charcoal dark:text-white">{strength.label}</span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-charcoal/10 dark:bg-white/15">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="font-sans block text-sm font-medium text-charcoal dark:text-white">
                Confirm password
              </label>
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>
            {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="dark"
              className="w-full rounded-lg py-4 text-base"
            >
              {isSubmitting ? "Sending code…" : "Continue with email code"}
            </Button>
          </form>
          <p className="font-sans mt-8 text-center text-sm text-charcoal/60 dark:text-white/60">
            Already have an account?{" "}
            <Link
              className="font-medium text-charcoal underline underline-offset-4 dark:text-white"
              to="/login"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
