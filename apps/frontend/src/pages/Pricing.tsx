import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";

const faqs = [
  {
    q: "What is ArewaPay?",
    a: "A workspace for African SMEs to manage clients, multi-currency invoices, balances, and cash-flow visibility — without juggling spreadsheets and chat threads.",
  },
  {
    q: "How is this different from a generic accounting suite?",
    a: "We focus on the day-to-day loop: who owes what, what is overdue, and what landed in your account — with PDF-friendly invoices and a dashboard tuned for operators, not accountants only.",
  },
  {
    q: "Which currencies do you support?",
    a: "You can work across African currencies plus common majors (USD, EUR, GBP). Set your default during onboarding and adjust in settings when you need to.",
  },
  {
    q: "Is my data secure?",
    a: "Sessions use industry-standard httpOnly cookies and encrypted transport in production. See our legal pages for how we handle information.",
  },
];

export function Pricing() {
  return (
    <div className="bg-white dark:bg-charcoal">
      <Section className="bg-grid-pattern border-b border-charcoal/10">
        <Container>
          <h1 className="font-display max-w-4xl text-5xl uppercase leading-[0.9] text-charcoal dark:text-white md:text-7xl">
            Questions &amp; contact
          </h1>
          <p className="font-sans mt-8 max-w-2xl text-lg text-charcoal/70 dark:text-white/70">
            No tiers or checkout here — just how we think about the product, and how to reach us if you want
            a walkthrough or a partnership conversation.
          </p>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wide text-charcoal dark:text-white">
                Frequently asked
              </h2>
              <ul className="mt-8 space-y-8">
                {faqs.map((item) => (
                  <li key={item.q}>
                    <p className="font-sans font-semibold text-charcoal dark:text-white">{item.q}</p>
                    <p className="font-sans mt-2 text-sm leading-relaxed text-charcoal/70 dark:text-white/70">
                      {item.a}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-charcoal/10 bg-off p-8 dark:border-white/10 dark:bg-dark">
              <h2 className="font-display text-2xl uppercase tracking-wide text-charcoal dark:text-white">
                Get in touch
              </h2>
              <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
                Tell us about your team, your markets, and what a great first week in ArewaPay would look
                like. We read every message.
              </p>
              <p className="font-sans mt-6 text-sm text-charcoal/60 dark:text-white/60">
                Email:{" "}
                <a className="font-medium text-accent underline underline-offset-4" href="mailto:hello@arewapay.app">
                  hello@arewapay.app
                </a>{" "}
                (placeholder — replace with your domain)
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button variant="dark" to="/register" className="!rounded-lg !py-3">
                  Create workspace
                </Button>
                <Button variant="ghost" to="/about" className="!rounded-lg !py-3">
                  About us
                </Button>
              </div>
            </div>
          </div>
          <p className="font-sans mt-14 text-center text-sm text-charcoal/50 dark:text-white/50">
            <Link to="/" className="underline">
              Home
            </Link>
            {" · "}
            <Link to="/features" className="underline">
              Features
            </Link>
            {" · "}
            <Link to="/login" className="underline">
              Log in
            </Link>
          </p>
        </Container>
      </Section>
    </div>
  );
}
