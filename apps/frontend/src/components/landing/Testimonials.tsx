import { Container } from "../ui/Container";
import { Section } from "../ui/Section";

const items = [
  {
    quote:
      "We finally know who owes what. ArewaPay replaced three spreadsheets and a WhatsApp thread.",
    name: "Halima Yusuf",
    role: "Retail · Kano",
    dark: false,
  },
  {
    quote:
      "PDF invoices in NGN look professional. Clients pay faster when you look like a real business.",
    name: "Chidi Okafor",
    role: "Agency · Lagos",
    dark: true,
  },
  {
    quote:
      "Our accountant logs in as Accountant — I stay Owner. Permissions just make sense.",
    name: "Amina Bello",
    role: "Services · Abuja",
    dark: false,
  },
];

export function Testimonials() {
  return (
    <Section id="stories" className="bg-white">
      <Container>
        <h2 className="font-display mb-12 text-center text-4xl uppercase leading-[0.9] text-charcoal md:text-6xl">
          Teams shipping invoices with confidence
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <div
              key={t.name}
              className={`card-interactive rounded-2xl border p-8 ${
                t.dark
                  ? "border-dark z-10 translate-y-4 bg-charcoal text-white md:translate-y-4"
                  : "border-light bg-white"
              }`}
            >
              <div className="flex gap-1 text-accent">
                {"★★★★★".split("").map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="font-sans mt-6 text-lg font-medium leading-relaxed">{t.quote}</p>
              <div className="mt-8 flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-full bg-charcoal/20 grayscale ${t.dark ? "bg-white/20" : ""}`}
                />
                <div>
                  <p className="font-display text-sm uppercase tracking-wide">{t.name}</p>
                  <p className={`font-sans text-sm ${t.dark ? "text-sage" : "text-charcoal/60"}`}>
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
