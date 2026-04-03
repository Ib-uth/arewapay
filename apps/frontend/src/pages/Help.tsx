import { Link } from "react-router-dom";

export function Help() {
  return (
    <div>
      <h1 className="font-display text-4xl uppercase leading-[0.9] text-charcoal dark:text-white md:text-5xl">
        Help & support
      </h1>
      <p className="font-sans mt-4 text-charcoal/70 dark:text-white/70">
        Quick answers for teams running invoicing on ArewaPay.
      </p>
      <div className="mt-10 space-y-6">
          <div className="card-interactive rounded-2xl border border-charcoal/10 bg-white p-6 dark:border-white/10 dark:bg-dark">
            <h2 className="font-display text-xl uppercase text-charcoal dark:text-white">Getting started</h2>
            <ul className="font-sans mt-4 list-inside list-disc space-y-2 text-charcoal/80 dark:text-white/80">
              <li>Add clients under Clients — you&apos;ll need them before creating invoices.</li>
              <li>Create invoices from Invoices → New invoice; download PDF when ready.</li>
              <li>Record payments on an invoice to keep balances accurate.</li>
            </ul>
          </div>
          <div className="card-interactive rounded-2xl border border-charcoal/10 bg-white p-6 dark:border-white/10 dark:bg-dark">
            <h2 className="font-display text-xl uppercase text-charcoal dark:text-white">Currency & region</h2>
            <p className="font-sans mt-4 text-charcoal/80 dark:text-white/80">
              Your default currency is set during onboarding and in{" "}
              <Link to="/app/settings/profile" className="font-medium text-charcoal underline dark:text-accent">
                Settings → Profile
              </Link>
              . Each invoice stores its own currency.
            </p>
          </div>
          <div className="card-interactive rounded-2xl border border-charcoal/10 bg-white p-6 dark:border-white/10 dark:bg-dark">
            <h2 className="font-display text-xl uppercase text-charcoal dark:text-white">Contact</h2>
            <p className="font-sans mt-4 text-charcoal/80 dark:text-white/80">
              Enterprise support and SLAs are on the roadmap. For now, reach your team admin or use
              the email placeholder in the marketing footer.
            </p>
          </div>
        </div>
    </div>
  );
}
