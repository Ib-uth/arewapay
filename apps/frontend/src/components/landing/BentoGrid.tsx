import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Section } from "../ui/Section";

function MiniAppShell() {
  const rows = [
    { id: "INV-1042", tag: "Settled" as const },
    { id: "INV-1041", tag: "Partial" as const },
    { id: "INV-1040", tag: "Overdue" as const },
  ];
  return (
    <div className="mt-8 flex gap-3 overflow-hidden rounded-xl border-2 border-charcoal/20 bg-white shadow-md">
      <div className="flex w-14 shrink-0 flex-col gap-2 border-r border-charcoal/15 bg-footer p-2">
        <div className="h-8 rounded-md bg-accent shadow-sm" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 rounded-md bg-white/10" />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-3 p-4">
        <div className="flex gap-2">
          <div className="h-8 flex-1 rounded-md bg-charcoal/10" />
          <div className="h-8 w-24 rounded-md bg-accent text-center font-sans text-xs font-semibold leading-8 text-white">
            New
          </div>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-charcoal/15 bg-off px-3 py-2.5 text-xs shadow-sm"
            >
              <span className="font-mono font-medium text-charcoal">{row.id}</span>
              {row.tag === "Settled" && (
                <span className="rounded bg-accent px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide text-white">
                  Settled
                </span>
              )}
              {row.tag === "Partial" && (
                <span className="rounded border border-charcoal/25 bg-white px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide text-charcoal">
                  Partial
                </span>
              )}
              {row.tag === "Overdue" && (
                <span className="rounded bg-charcoal px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide text-white">
                  Overdue
                </span>
              )}
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
          <Card dark className="border-2 border-white/20 bg-footer">
            <h3 className="font-display text-3xl uppercase text-white">Invoices & balances</h3>
            <p className="font-sans mt-4 text-white/85">
              Log what came in, see partials and totals, keep overdue visible across currencies.
            </p>
            <div className="mt-8 space-y-3 rounded-xl border border-white/15 bg-charcoal/40 p-4 font-mono text-sm">
              <div className="flex animate-pulse items-center justify-between border-b border-white/10 pb-2">
                <span className="text-white/70">Inflow (30d)</span>
                <span className="font-semibold text-white">KES 2.4M</span>
              </div>
              <div className="flex items-center justify-between text-white">
                <span className="text-white/65">NGN outstanding</span>
                <span className="font-semibold tabular-nums text-accent">12,450,000</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-white">
                <span className="text-white/65">ZAR collected</span>
                <span className="font-semibold tabular-nums">890,200</span>
              </div>
            </div>
          </Card>
          <Card dark className="border-2 border-white/20 bg-charcoal">
            <h3 className="font-display text-3xl uppercase text-white">Dashboard</h3>
            <p className="font-sans mt-4 text-white/85">
              Revenue by month, totals, recent activity — no spreadsheet exports.
            </p>
            <div className="mt-8 flex h-28 items-end gap-2 px-1">
              {[48, 72, 52, 88, 60, 78, 65].map((h, i) => (
                <div
                  key={i}
                  className="w-full origin-bottom rounded-t-md bg-accent shadow-sm transition-transform duration-500 hover:scale-y-105"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 70}ms`,
                  }}
                />
              ))}
            </div>
          </Card>
          <Card className="md:col-span-2 border-2 border-charcoal/15 bg-off/50">
            <h3 className="font-display text-3xl uppercase text-charcoal">Roles & access</h3>
            <p className="font-sans mt-4 max-w-lg text-charcoal/75">
              Owner and Accountant roles — share the books without sharing every key.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-charcoal/15 bg-white p-4 shadow-sm">
                <p className="font-display text-lg uppercase text-charcoal">Owner</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className={`aspect-square rounded-md ${n === 1 ? "bg-accent" : "bg-charcoal/15"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border-2 border-charcoal/15 bg-white p-4 shadow-sm">
                <p className="font-display text-lg uppercase text-charcoal">Accountant</p>
                <div className="mt-3 space-y-2.5">
                  {[0.85, 0.55, 0.7].map((w, i) => (
                    <div
                      key={i}
                      className="h-2.5 rounded-full bg-charcoal/20"
                      style={{ width: `${w * 100}%` }}
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
