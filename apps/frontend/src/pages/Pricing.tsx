import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";
import { useRevenueCat } from "../hooks/useRevenueCat";
import { useMe } from "../hooks/useAuth";

export function Pricing() {
  const navigate = useNavigate();
  const { data: me, isError: meError } = useMe();
  const { purchaseUpgrade, hasKey } = useRevenueCat();
  const [msg, setMsg] = useState<string | null>(null);
  const loggedIn = Boolean(me && !meError);

  async function onUpgrade() {
    setMsg(null);
    if (!loggedIn) {
      navigate("/register");
      return;
    }
    if (!hasKey) {
      setMsg("Billing is not configured for this environment yet.");
      return;
    }
    try {
      await purchaseUpgrade();
      setMsg("Thanks — your plan will update in a moment after payment.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="bg-white dark:bg-charcoal">
      <Section className="bg-grid-pattern border-b border-charcoal/10">
        <Container>
          <h1 className="font-display max-w-4xl text-5xl uppercase leading-[0.9] text-charcoal dark:text-white md:text-7xl">
            Pricing that fits African SMEs
          </h1>
          <p className="font-sans mt-8 max-w-2xl text-lg text-charcoal/70 dark:text-white/70">
            Start free, upgrade when you grow. Premium unlocks higher client and invoice limits; Unlimited is a
            one-time lifetime option.
          </p>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="card-interactive flex flex-col rounded-2xl border border-charcoal/10 bg-off p-8 shadow-sm dark:border-white/10 dark:bg-dark">
              <p className="font-display text-xs uppercase tracking-widest text-charcoal/50 dark:text-white/50">
                Starter
              </p>
              <p className="font-display mt-4 text-4xl uppercase text-charcoal dark:text-white">Free</p>
              <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
                Core invoicing for getting started — fair limits on clients and invoices per 30 days.
              </p>
              <ul className="font-sans mt-8 flex-1 space-y-3 text-sm text-charcoal/80 dark:text-white/80">
                <li>Up to 5 clients</li>
                <li>Up to 20 invoices / rolling 30 days</li>
                <li>Dashboard & PDF-friendly flows</li>
              </ul>
              <Button variant="ghost" to="/register" className="mt-10 w-full !rounded-lg !py-4">
                Get started
              </Button>
            </div>

            <div className="card-interactive relative flex flex-col rounded-2xl border-2 border-accent bg-white p-8 shadow-lg dark:bg-dark">
              <span className="absolute right-4 top-4 rounded-full bg-accent/25 px-3 py-1 font-sans text-xs font-medium text-charcoal">
                Popular
              </span>
              <p className="font-display text-xs uppercase tracking-widest text-charcoal/50 dark:text-white/50">
                Premium
              </p>
              <p className="font-display mt-4 text-4xl uppercase text-charcoal dark:text-white">
                $5<span className="font-sans text-lg font-normal text-charcoal/60 dark:text-white/60">/mo</span>
              </p>
              <p className="font-sans mt-2 text-sm text-charcoal/60 dark:text-white/60">
                ~$48/year billed annually (about $4/mo)
              </p>
              <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
                Higher limits for growing teams: 100 clients and 2,000 invoices per 30 days.
              </p>
              <ul className="font-sans mt-8 flex-1 space-y-3 text-sm text-charcoal/80 dark:text-white/80">
                <li>100 clients</li>
                <li>2,000 invoices / rolling 30 days</li>
                <li>Same product experience — more headroom</li>
              </ul>
              <Button
                variant="dark"
                type="button"
                className="mt-10 w-full !rounded-lg !py-4"
                onClick={() => void onUpgrade()}
              >
                {loggedIn ? "Upgrade" : "Create account & upgrade"}
              </Button>
            </div>

            <div className="card-interactive flex flex-col rounded-2xl border border-charcoal/10 bg-off p-8 shadow-sm dark:border-white/10 dark:bg-dark">
              <p className="font-display text-xs uppercase tracking-widest text-charcoal/50 dark:text-white/50">
                Unlimited
              </p>
              <p className="font-display mt-4 text-4xl uppercase text-charcoal dark:text-white">$149</p>
              <p className="font-sans mt-2 text-sm text-charcoal/60 dark:text-white/60">One-time lifetime</p>
              <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
                No client or invoice caps — best if you want to pay once and move fast.
              </p>
              <ul className="font-sans mt-8 flex-1 space-y-3 text-sm text-charcoal/80 dark:text-white/80">
                <li>Unlimited clients</li>
                <li>Unlimited invoices (fair use)</li>
                <li>Long-term peace of mind</li>
              </ul>
              <Button
                variant="primary"
                type="button"
                className="mt-10 w-full !rounded-lg !py-4"
                onClick={() => void onUpgrade()}
              >
                {loggedIn ? "Buy lifetime" : "Create account & buy"}
              </Button>
            </div>
          </div>
          {msg && (
            <p className="font-sans mt-8 text-center text-sm text-charcoal/70 dark:text-white/70">{msg}</p>
          )}
          <p className="font-sans mt-10 text-center text-sm text-charcoal/50 dark:text-white/50">
            When you&apos;re signed in, purchases are tied to your workspace so your plan updates
            automatically.{" "}
            <Link to="/app" className="underline">
              Open app
            </Link>{" "}
            ·{" "}
            <Link to="/about" className="underline">
              About
            </Link>
          </p>
        </Container>
      </Section>
    </div>
  );
}
