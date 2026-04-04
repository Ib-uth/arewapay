import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";

export function Features() {
  return (
    <div className="bg-white">
      <Section className="bg-grid-pattern border-b border-charcoal/10">
        <Container>
          <h1 className="font-display max-w-4xl text-5xl uppercase leading-[0.9] text-charcoal md:text-7xl lg:text-8xl">
            Everything receivables in one workspace
          </h1>
          <p className="font-sans mt-8 max-w-2xl text-lg text-charcoal/70">
            ArewaPay helps African SMEs issue invoices, track balances, and see who owes what —
            without spreadsheets or scattered WhatsApp threads.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button variant="primary" to="/register">
              Get started
            </Button>
            <Button variant="ghost" to="/pricing">
              FAQ &amp; contact
            </Button>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-12 md:grid-cols-3">
            {[
              {
                title: "Clients & invoices",
                body: "Line items, taxes, due dates, PDF export — in your default currency.",
              },
              {
                title: "Balances & status",
                body: "Log partial or full settlements; overdue and outstanding stay visible.",
              },
              {
                title: "Dashboard & insight",
                body: "Revenue by month, top clients, recent activity — built for operators.",
              },
            ].map((f) => (
              <div key={f.title} className="card-interactive rounded-2xl border border-charcoal/10 bg-off p-8">
                <h2 className="font-display text-2xl uppercase text-charcoal">{f.title}</h2>
                <p className="font-sans mt-4 text-charcoal/70">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <Section className="bg-charcoal text-white">
        <Container className="text-center">
          <p className="font-display text-4xl uppercase leading-[0.9] md:text-5xl">
            Ready to run receivables like an enterprise?
          </p>
          <Link
            to="/register"
            className="font-sans mt-8 inline-block rounded-full border border-white/30 px-8 py-3 text-sm font-medium hover:bg-white/10"
          >
            Create your account
          </Link>
        </Container>
      </Section>
    </div>
  );
}
