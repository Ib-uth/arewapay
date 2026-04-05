import { Link } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";

export function About() {
  return (
    <div className="bg-white">
      <Section className="bg-grid-pattern border-b border-charcoal/10">
        <Container>
          <h1 className="font-display max-w-4xl text-5xl uppercase leading-[0.9] text-charcoal md:text-7xl lg:text-8xl">
            Built for African SMEs
          </h1>
          <p className="font-sans mt-8 max-w-2xl text-lg text-charcoal/70">
            ArewaPay exists so owners and finance teams can run invoicing and collections with
            clarity — from Lagos to Nairobi to Johannesburg. We care about multi-currency reality,
            local context, and tools that feel serious without enterprise bloat.
          </p>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-3xl space-y-8">
          <div>
            <h2 className="font-display text-3xl uppercase text-charcoal">Mission</h2>
            <p className="font-sans mt-4 text-charcoal/75">
              Give every growing business a single place for clients, invoices, and receivables — so
              cash flow is visible and chasing stops being the default mode of work.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl uppercase text-charcoal">Principles</h2>
            <ul className="font-sans mt-4 list-inside list-disc space-y-2 text-charcoal/75">
              <li>Defaults that respect your country and currency</li>
              <li>Honest UX — transparent flows without dark patterns</li>
              <li>Security-minded auth and session handling</li>
            </ul>
          </div>
          <p className="font-sans text-sm text-charcoal/50">
            <Link to="/register" className="font-medium text-charcoal underline">
              Create an account
            </Link>{" "}
            to personalize your workspace.
          </p>
        </Container>
      </Section>
    </div>
  );
}
