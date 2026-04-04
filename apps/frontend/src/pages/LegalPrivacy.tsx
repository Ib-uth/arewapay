import { Link } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";

export function LegalPrivacy() {
  return (
    <div className="bg-white dark:bg-charcoal">
      <Section className="border-b border-charcoal/10">
        <Container className="max-w-3xl py-12">
          <Link to="/" className="font-sans text-sm text-charcoal/60 hover:text-charcoal dark:text-white/60">
            ← Home
          </Link>
          <h1 className="font-display mt-6 text-4xl uppercase text-charcoal dark:text-white md:text-5xl">
            Privacy policy
          </h1>
          <p className="font-sans mt-4 text-sm text-charcoal/55 dark:text-white/55">
            Last updated: April 3, 2026. This policy is a template — align it with your actual processing
            activities and jurisdiction before launch.
          </p>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-3xl space-y-10 pb-20 font-sans text-charcoal/80 dark:text-white/80">
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              1. Who we are
            </h2>
            <p className="mt-3 leading-relaxed">
              ArewaPay (&quot;we&quot;, &quot;us&quot;) operates the ArewaPay web application. This policy
              explains how we collect, use, and share personal data when you use the Service.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              2. Data we collect
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                <strong className="text-charcoal dark:text-white">Account data:</strong> email, name, phone
                (if provided), password hash, preferences such as theme and currency.
              </li>
              <li>
                <strong className="text-charcoal dark:text-white">Workspace data:</strong> clients, invoice
                content, amounts, notes, and similar information you choose to store.
              </li>
              <li>
                <strong className="text-charcoal dark:text-white">Technical data:</strong> IP address,
                browser type, cookies or similar identifiers used for security and session management.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              3. How we use data
            </h2>
            <p className="mt-3 leading-relaxed">
              We use data to provide and secure the Service, authenticate users, send transactional emails
              (such as verification codes), improve reliability, and comply with law. We do not sell your
              personal data.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              4. Legal bases (EEA/UK-style framing)
            </h2>
            <p className="mt-3 leading-relaxed">
              Where required, we rely on contract (to deliver the Service), legitimate interests (security,
              product improvement), consent (where applicable), and legal obligation.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              5. Sharing
            </h2>
            <p className="mt-3 leading-relaxed">
              We use infrastructure and email providers (e.g. hosting, transactional email) that process
              data on our behalf under agreements. We may disclose information if required by law or to
              protect rights and safety.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              6. Retention
            </h2>
            <p className="mt-3 leading-relaxed">
              We retain account and workspace data while your account is active and for a reasonable period
              afterward for backups, disputes, and legal compliance. You may request deletion subject to
              statutory retention needs.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              7. Security
            </h2>
            <p className="mt-3 leading-relaxed">
              We use industry-standard measures such as encrypted transport (HTTPS), hashed passwords, and
              restricted access to production systems. No method of transmission or storage is 100% secure.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              8. Your rights
            </h2>
            <p className="mt-3 leading-relaxed">
              Depending on your location, you may have rights to access, correct, delete, or export your
              data, and to object to or restrict certain processing. Contact us to exercise these rights. You
              may also lodge a complaint with a supervisory authority.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              9. International transfers
            </h2>
            <p className="mt-3 leading-relaxed">
              If we transfer personal data across borders, we use appropriate safeguards such as standard
              contractual clauses where required.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              10. Children
            </h2>
            <p className="mt-3 leading-relaxed">
              The Service is not directed at children under 16. We do not knowingly collect their personal
              data.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide text-charcoal dark:text-white">
              11. Contact
            </h2>
            <p className="mt-3 leading-relaxed">
              Privacy questions:{" "}
              <a className="text-accent underline" href="mailto:privacy@arewapay.app">
                privacy@arewapay.app
              </a>
              .
            </p>
          </section>
        </Container>
      </Section>
    </div>
  );
}
