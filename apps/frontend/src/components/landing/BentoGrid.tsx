import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Section } from "../ui/Section";

function MiniAppShell() {
  return (
    <div className="mt-8 flex gap-3 overflow-hidden rounded-xl border border-charcoal/10 bg-off">
      <div className="flex w-14 shrink-0 flex-col gap-2 border-r border-charcoal/10 bg-charcoal/5 p-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 rounded-md bg-charcoal/10"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-3 p-4">
        <div className="flex gap-2">
          <div className="h-8 flex-1 animate-pulse rounded-md bg-accent/30" />
          <div className="h-8 w-20 rounded-md bg-charcoal/15" />
        </div>
        <div className="space-y-2">
          {["INV-1042", "INV-1041", "INV-1040"].map((id, i) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg border border-charcoal/5 bg-white px-3 py-2 text-xs"
              style={{ animationDelay: `${200 + i * 120}ms` }}
            >
              <span className="font-mono text-charcoal/70">{id}</span>
              <span className="font-mono text-accent">● Paid</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BentoGrid() {
  return (
    <Section id="features" className="bg-white">
      <Container>
        <h2 className="font-display mb-12 max-w-3xl text-4xl uppercase leading-[0.9] text-charcoal md:text-6xl">
          Everything you need to run receivables
        </h2>
        <div className="grid auto-rows-[minmax(280px,400px)] grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <h3 className="font-display text-3xl uppercase text-charcoal">Clients & invoices</h3>
            <p className="font-sans mt-4 max-w-md text-charcoal/70">
              Line items, tax, due dates, and PDF export — in your default currency.
            </p>
            <MiniAppShell />
          </Card>
          <Card dark>
            <h3 className="font-display text-3xl uppercase">Payments</h3>
            <p className="font-sans mt-4 text-white/70">
              Partial payments, full marks as paid, overdue visibility.
            </p>
            <div className="mt-8 space-y-2 rounded-lg bg-white/5 p-4 font-mono text-xs text-sage">
              <div className="flex animate-pulse justify-between">
                <span className="text-white/60">Inflow</span>
                <span className="text-accent">KES 2.4M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">NGN</span>
                <span className="text-white/90">12,450,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">ZAR</span>
                <span className="text-white/90">890,200.00</span>
              </div>
            </div>
          </Card>
          <Card dark>
            <h3 className="font-display text-3xl uppercase">Dashboard</h3>
            <p className="font-sans mt-4 text-white/70">
              Revenue by month, totals, recent activity — no spreadsheet exports.
            </p>
            <div className="mt-8 flex items-end gap-1">
              {[40, 65, 45, 80, 55, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-full origin-bottom rounded-t bg-accent/60 transition-transform duration-500 hover:scale-y-110"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="font-display text-3xl uppercase text-charcoal">Roles & access</h3>
            <p className="font-sans mt-4 max-w-lg text-charcoal/70">
              Owner and Accountant roles — share the books without sharing every key.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-charcoal/10 bg-off p-4">
                <p className="font-display text-lg uppercase text-charcoal">Owner</p>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="aspect-square rounded bg-charcoal/10"
                      style={{ animationDelay: `${n * 50}ms` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-charcoal/10 bg-off p-4">
                <p className="font-display text-lg uppercase text-charcoal">Accountant</p>
                <div className="mt-3 space-y-2">
                  {[0.3, 0.6, 0.45].map((o, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full bg-charcoal/10"
                      style={{ width: `${o * 100}%`, opacity: o }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
