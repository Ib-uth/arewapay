import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";

export function FinalCta() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    navigate(`/register${q}`);
  }

  return (
    <section className="relative overflow-hidden bg-accent py-24 md:py-32">
      <p
        className="font-display pointer-events-none absolute -left-4 top-8 select-none text-[12rem] leading-none text-charcoal/[0.07] md:text-[18rem]"
        aria-hidden
      >
        PAY
      </p>
      <p
        className="font-display pointer-events-none absolute -right-8 bottom-0 select-none text-[10rem] leading-none text-charcoal/[0.07] md:text-[14rem]"
        aria-hidden
      >
        FAST
      </p>
      <Container className="relative z-10 text-center">
        <h2 className="font-display text-5xl uppercase leading-[0.9] text-charcoal md:text-8xl">
          Ready to own your cash flow?
        </h2>
        <p className="font-sans mx-auto mt-6 max-w-2xl text-2xl text-charcoal/80">
          Join African SMEs who invoice with clarity — multi-currency, with receipts.
        </p>
        <form
          onSubmit={submit}
          className="mx-auto mt-12 flex max-w-lg flex-col gap-4 sm:flex-row sm:items-center"
        >
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-sans flex-1 rounded-xl border-2 border-charcoal/10 bg-white px-6 py-4 text-charcoal shadow-xl placeholder:text-charcoal/40 focus:border-charcoal/30 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          />
          <Button
            type="submit"
            variant="dark"
            className="shadow-xl transition-transform hover:scale-105"
          >
            Create account
          </Button>
        </form>
      </Container>
    </section>
  );
}
