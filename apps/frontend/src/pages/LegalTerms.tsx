import { Link } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";

export function LegalTerms() {
  return (
    <div className="bg-white dark:bg-charcoal">
      <Section className="border-b border-charcoal/10">
        <Container className="max-w-3xl py-12">
          <Link to="/" className="font-sans text-sm text-charcoal/60 hover:text-charcoal dark:text-white/60">
            ← Home
          </Link>
          <h1 className="font-display mt-6 text-4xl uppercase text-charcoal dark:text-white md:text-5xl">
            Terms of service
          </h1>
          <p className="font-sans mt-4 text-sm text-charcoal/55 dark:text-white/55">
            Last updated: April 3, 2026. These terms are a template — have them reviewed by counsel before
            production use.
          </p>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-3xl space-y-10 pb-20 font-sans text-charcoal/80 dark:text-white/80">
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              1. Agreement
            </h2>
            <p className="mt-3 leading-relaxed">
              By accessing or using ArewaPay (&quot;Service&quot;), you agree to these Terms. If you disagree,
              do not use the Service. We may update these Terms; continued use after changes constitutes
              acceptance of the revised Terms.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              2. The Service
            </h2>
            <p className="mt-3 leading-relaxed">
              ArewaPay provides tools to manage clients, invoices, balances, and related workspace data. We
              do not guarantee uninterrupted availability. Features may change as we improve the product.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              3. Your account
            </h2>
            <p className="mt-3 leading-relaxed">
              You are responsible for safeguarding your credentials and for activity under your account. You
              must provide accurate registration information and keep it current. You may delete your
              account subject to our retention practices described in the Privacy Policy.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              4. Acceptable use
            </h2>
            <p className="mt-3 leading-relaxed">
              You will not misuse the Service, including attempting unauthorized access, interfering with
              other users, distributing malware, or using the Service for unlawful purposes. We may suspend or
              terminate access for violations.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              5. Data &amp; content
            </h2>
            <p className="mt-3 leading-relaxed">
              You retain rights to data you submit. You grant us a limited licence to host, process, and
              display that data solely to operate the Service. You are responsible for the legality of your
              content and for obtaining any consents required for personal data you upload.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              6. Disclaimers
            </h2>
            <p className="mt-3 leading-relaxed">
              The Service is provided &quot;as is&quot; without warranties of any kind, express or implied,
              including merchantability or fitness for a particular purpose. We are not a bank, money
              transmitter, or legal/tax advisor; outputs are for your operational use only.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              7. Limitation of liability
            </h2>
            <p className="mt-3 leading-relaxed">
              To the fullest extent permitted by law, ArewaPay and its suppliers will not be liable for
              indirect, incidental, special, consequential, or punitive damages, or loss of profits or data.
              Our aggregate liability arising out of the Service will not exceed the greater of amounts you
              paid us in the twelve months before the claim or fifty US dollars.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              8. Governing law
            </h2>
            <p className="mt-3 leading-relaxed">
              These Terms are governed by the laws you designate with your legal counsel (placeholder). Courts
              in that jurisdiction will have exclusive venue, subject to mandatory consumer protections
              where applicable.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              9. Contact
            </h2>
            <p className="mt-3 leading-relaxed">
              Questions:{" "}
              <a className="text-accent underline" href="mailto:hello@arewapay.app">
                hello@arewapay.app
              </a>
              .
            </p>
          </section>
        </Container>
      </Section>
    </div>
  );
}
