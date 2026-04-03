import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";

export function LandingHero() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  function goRegister(e: React.FormEvent) {
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    navigate(`/register${q}`);
  }

  return (
    <div className="bg-grid-pattern pt-28 pb-20 md:pt-32 md:pb-28">
      <Container className="text-center">
        <Badge>Built for African SMEs</Badge>
        <h1 className="font-display mt-8 text-5xl uppercase leading-[0.9] tracking-normal text-charcoal sm:text-7xl md:text-8xl lg:text-9xl">
          Invoices that
          <br />
          <span className="highlight-bar">actually get paid</span>
        </h1>
        <p className="font-sans mx-auto mt-8 max-w-xl text-lg font-normal text-charcoal/70">
          Stop chasing payments on WhatsApp. ArewaPay brings clients, multi-currency invoices, and
          cash flow into one brutalist-clear workspace.
        </p>
        <form
          onSubmit={goRegister}
          className="mx-auto mt-12 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          <input
            type="email"
            name="email"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-sans flex-1 rounded-lg border border-charcoal/20 bg-white px-6 py-4 text-charcoal placeholder:text-charcoal/40 focus:border-charcoal/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <Button type="submit" variant="primary" className="shrink-0 sm:min-w-[200px]">
            Start free
          </Button>
        </form>
        <p className="font-sans mt-4 text-sm text-charcoal/50">
          No card required · Email verification on signup
        </p>
      </Container>
    </div>
  );
}
