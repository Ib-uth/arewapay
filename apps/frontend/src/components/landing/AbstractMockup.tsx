import { IconMenu, IconSpark } from "../icons/AppIcons";

export function AbstractMockup() {
  return (
    <div className="border-light overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex items-center gap-2 border-b border-charcoal/10 bg-off px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-green-400/80" />
        <span className="font-sans flex-1 text-center text-xs font-medium text-charcoal/50">
          ArewaPay — Invoices
        </span>
      </div>
      <div className="grid min-h-[220px] grid-cols-12 gap-0 bg-charcoal p-4">
        <aside className="col-span-3 hidden border-r border-white/10 pr-3 sm:block">
          <div className="space-y-2">
            <div className="h-2 w-3/4 rounded bg-white/20" />
            <div className="h-2 w-1/2 rounded bg-white/10" />
            <div className="h-2 w-2/3 rounded bg-white/10" />
          </div>
        </aside>
        <main className="col-span-12 flex flex-col items-center justify-center sm:col-span-6">
          <div className="relative w-full max-w-[200px] rounded-lg bg-white p-4 shadow-lg">
            <p className="font-display text-center text-lg uppercase text-charcoal">INV-2026-001</p>
            <div className="mt-3 h-2 w-full rounded bg-charcoal/10" />
            <div className="mt-2 h-2 w-4/5 rounded bg-charcoal/5" />
            <div className="absolute -right-2 -bottom-2 flex items-center gap-1 rounded-full border border-charcoal/10 bg-accent px-2 py-1 text-[10px] font-medium text-charcoal shadow">
              <IconSpark className="h-3 w-3" /> Paid
            </div>
          </div>
        </main>
        <aside className="col-span-3 hidden border-l border-white/10 pl-3 sm:block">
          <p className="font-display mb-2 text-xs uppercase tracking-wide text-white/60">Properties</p>
          <div className="mb-2 flex gap-1">
            <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-white/80">
              A
            </span>
            <span className="inline-flex rounded border border-white/20 p-0.5 text-white/80">
              <IconMenu className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded border border-white/20 bg-[#FFE17C]" />
            <span className="font-mono text-[10px] text-white/70">#FFE17C</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
