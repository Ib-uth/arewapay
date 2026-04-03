import { Container } from "../ui/Container";
import { Section } from "../ui/Section";

const steps = [
  {
    title: "Add clients",
    body: "Store contacts, companies, and notes once — reuse on every invoice.",
  },
  {
    title: "Send invoices",
    body: "Line items, tax, due date, and a PDF your clients can trust.",
  },
  {
    title: "Track payments",
    body: "Record partials, mark paid, and see overdue before it hurts.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how" className="bg-off">
      <Container>
        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="md:sticky md:top-28 md:col-span-1 md:self-start">
            <h2 className="font-display text-5xl uppercase leading-[0.9] text-charcoal md:text-7xl">
              How it works
            </h2>
          </div>
          <div className="space-y-12 md:col-span-2">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="group border-b border-charcoal/10 pb-12 last:border-0 last:pb-0"
              >
                <span className="font-display block text-8xl leading-none text-accent/20 transition-colors duration-300 group-hover:text-accent md:text-9xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-4 text-3xl uppercase text-charcoal">{s.title}</h3>
                <p className="font-sans mt-3 max-w-lg text-lg text-charcoal/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
