import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch, fetchOtpStatus, resendRegisterOtp, type OtpStatus } from "../api/client";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/Button";
import { clearRootDarkClass } from "../lib/clearRootDarkClass";

const schema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d+$/, "Digits only"),
});

type Form = z.infer<typeof schema>;

export function RegisterVerify() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; email_sent?: boolean } | null;
  const email = state?.email ?? "";
  const initialEmailSent = state?.email_sent ?? true;

  const [otpStatus, setOtpStatus] = useState<OtpStatus | null>(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!email) return;
    try {
      const s = await fetchOtpStatus(email);
      setOtpStatus(s);
    } catch {
      setOtpStatus(null);
    }
  }, [email]);

  useEffect(() => {
    clearRootDarkClass();
  }, []);

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    void loadStatus();
    const t = window.setInterval(() => void loadStatus(), 1000);
    return () => window.clearInterval(t);
  }, [loadStatus]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Form) {
    try {
      await apiFetch("/auth/register/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp: values.otp }),
      });
      toast("Account verified — you can sign in.");
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      toast(msg, "error");
      setError("root", { message: msg });
    }
  }

  async function onResend() {
    setResendNote(null);
    setResendBusy(true);
    try {
      const r = await resendRegisterOtp(email);
      setResendNote(
        r.email_sent
          ? "A new code was sent. Check your inbox and spam folder."
          : "We generated a new code, but email could not be sent (check server mail settings).",
      );
      toast(
        r.email_sent ? "New code sent — check your email." : "New code ready — email not sent.",
        "info",
      );
      await loadStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not resend code.";
      toast(msg, "error");
      setResendNote(msg);
    } finally {
      setResendBusy(false);
    }
  }

  const inputClass =
    "font-sans mt-2 w-full rounded-lg border border-charcoal/20 px-4 py-3 text-center text-2xl tracking-[0.35em] text-charcoal focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/20 dark:bg-charcoal dark:text-white";

  if (!email) {
    return null;
  }

  const statusReady = otpStatus !== null;
  const waitSec = otpStatus?.wait_seconds ?? 0;
  const canResend = statusReady && otpStatus.can_resend && !resendBusy;
  const exhausted = otpStatus?.exhausted === true;

  return (
    <div className="bg-grid-pattern flex min-h-screen flex-col justify-center bg-white px-6 py-12 text-charcoal">
      <Link
        to="/register"
        className="font-sans mx-auto mb-8 block w-full max-w-md text-sm font-medium text-charcoal/60 hover:text-charcoal"
      >
        ← Back to sign up
      </Link>
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-4xl uppercase leading-[0.9] md:text-5xl">Check your email</h1>
        <p className="font-sans mt-4 text-charcoal/70">
          We sent a 6-digit code to <span className="font-medium text-charcoal">{email}</span>. Enter it
          below to confirm your address, then log in.
        </p>
        {!initialEmailSent && (
          <p className="font-sans mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Email may not have left the server (missing API key or sender config). Use Resend when you can,
            or resend after the timer below once mail is fixed.
          </p>
        )}
        {otpStatus && !otpStatus.email_configured && (
          <p className="font-sans mt-4 rounded-lg border border-charcoal/15 bg-off px-4 py-3 text-sm text-charcoal/80">
            This environment has no Resend API key — codes are not emailed. Use local dev tools or configure{" "}
            <code className="rounded bg-charcoal/10 px-1">RESEND_API_KEY</code>.
          </p>
        )}
        <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="font-sans block text-sm font-medium text-charcoal">Verification code</label>
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              {...register("otp")}
            />
            {errors.otp && <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>}
          </div>
          {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
          <Button type="submit" disabled={isSubmitting} variant="dark" className="w-full rounded-lg py-4 text-base">
            {isSubmitting ? "Verifying…" : "Verify & continue"}
          </Button>
        </form>

        <div className="mt-8 border-t border-charcoal/10 pt-6">
          {exhausted ? (
            <p className="font-sans text-center text-sm text-red-600">
              Too many code requests. Wait a while or{" "}
              <Link to="/register" className="font-medium underline">
                start registration over
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={!canResend}
                onClick={() => void onResend()}
                className="font-sans text-sm font-medium text-accent underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-charcoal/40 disabled:no-underline"
              >
                {!statusReady
                  ? "Loading…"
                  : waitSec > 0
                    ? `Resend code in ${waitSec}s`
                    : resendBusy
                      ? "Sending…"
                      : "Resend code"}
              </button>
              {otpStatus && (
                <p className="font-sans text-xs text-charcoal/50">
                  {otpStatus.sends_used} of {otpStatus.max_sends} codes used for this sign-up
                </p>
              )}
            </div>
          )}
          {resendNote && (
            <p className="font-sans mt-3 text-center text-sm text-charcoal/70">{resendNote}</p>
          )}
        </div>

        <p className="font-sans mt-8 text-center text-sm text-charcoal/60">
          Wrong email?{" "}
          <Link className="font-medium text-charcoal underline underline-offset-4" to="/register">
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
