import { AbstractMockup } from "./AbstractMockup";
import { Container } from "../ui/Container";
import { Section } from "../ui/Section";

export function ProductPreviewSection() {
  return (
    <Section className="border-y border-charcoal/10 bg-off">
      <Container>
        <p className="font-display text-sm uppercase tracking-widest text-charcoal/50">Product preview</p>
        <h2 className="font-display mt-4 max-w-3xl text-4xl uppercase leading-[0.9] text-charcoal md:text-5xl">
          The workspace your team actually uses
        </h2>
        <p className="font-sans mt-6 max-w-2xl text-lg text-charcoal/70">
          Sidebar navigation, canvas, and properties — the same structure you get after sign-in.
        </p>
        <div className="mt-12 max-w-4xl">
          <AbstractMockup />
        </div>
      </Container>
    </Section>
  );
}
