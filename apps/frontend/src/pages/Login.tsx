import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../api/client";
import { Button } from "../components/ui/Button";
import { clearRootDarkClass } from "../lib/clearRootDarkClass";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Form = z.infer<typeof schema>;

export function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    clearRootDarkClass();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Form) {
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      navigate("/app");
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Login failed" });
    }
  }

  return (
    <div className="bg-grid-pattern flex min-h-screen bg-white text-charcoal">
      <div className="hidden w-1/2 flex-col justify-between bg-charcoal p-12 text-white lg:flex">
        <Link to="/" className="font-display text-2xl uppercase">
          ArewaPay<span className="text-accent">.</span>
        </Link>
        <div>
          <p className="font-display text-5xl uppercase leading-[0.9]">Welcome back</p>
          <p className="font-sans mt-6 max-w-sm text-sage/90">
            Your invoices and payments — one login away.
          </p>
        </div>
        <p className="font-sans text-sm text-sage/60">NGN-first · Built for African SMEs</p>
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <Link
          to="/"
          className="font-sans mb-8 text-sm font-medium text-charcoal/60 hover:text-charcoal lg:hidden"
        >
          ← Back home
        </Link>
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-4xl uppercase leading-[0.9] text-charcoal md:text-5xl">
            Log in
          </h1>
          <p className="font-sans mt-4 text-charcoal/70">Use the email and password for your workspace.</p>
          <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="font-sans block text-sm font-medium text-charcoal">Email</label>
              <input
                className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="font-sans block text-sm font-medium text-charcoal">Password</label>
              <input
                className="font-sans mt-2 w-full rounded-lg border border-charcoal/20 px-4 py-3 text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-red-600">{errors.root.message}</p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="dark"
              className="w-full rounded-lg py-4 text-base"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="font-sans mt-8 text-center text-sm text-charcoal/60">
            No account?{" "}
            <Link className="font-medium text-charcoal underline underline-offset-4" to="/register">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
