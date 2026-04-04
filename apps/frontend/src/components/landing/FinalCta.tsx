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
        className="font-display pointer-events-none absolute -left-4 top-8 select-none text-[12rem] leading-none text-white/[0.12] md:text-[18rem]"
        aria-hidden
      >
        OWN
      </p>
      <p
        className="font-display pointer-events-none absolute -right-8 bottom-0 select-none text-[10rem] leading-none text-white/[0.12] md:text-[14rem]"
        aria-hidden
      >
        FLOW
      </p>
      <Container className="relative z-10 text-center">
        <h2 className="font-display text-5xl uppercase leading-[0.9] text-white md:text-8xl">
          Ready to own your cash flow?
        </h2>
        <p className="font-sans mx-auto mt-6 max-w-2xl text-2xl text-white/90">
          Join African SMEs who invoice with clarity — multi-currency, clear records.
        </p>
        <form
          onSubmit={submit}
          className="mx-auto mt-12 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-sans flex-1 rounded-lg border border-white/30 bg-white px-6 py-4 text-charcoal placeholder:text-charcoal/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <Button type="submit" variant="onAccent" className="shrink-0 sm:min-w-[200px]">
            Create account
          </Button>
        </form>
      </Container>
    </section>
  );
}
