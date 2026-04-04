import { IconCheck, IconX } from "../icons/AppIcons";

const problems = [
  "Invoices lost in spreadsheets",
  "No idea who still owes you",
  "Chasing clients across WhatsApp",
];

const solutions = [
  "One ledger for every client & invoice",
  "Outstanding & overdue at a glance",
  "Professional PDFs + settlement history",
];

export function ProblemSolution() {
  return (
    <div id="features" className="flex w-full flex-col md:flex-row">
      <div className="flex min-h-[420px] flex-1 flex-col justify-start bg-footer px-6 py-16 md:px-12 md:py-20">
        <p className="font-display text-4xl uppercase leading-[0.9] text-white md:text-5xl">
          The old way
        </p>
        <ul className="mt-10 space-y-5">
          {problems.map((p) => (
            <li
              key={p}
              className="font-sans flex items-start gap-3 text-lg text-sage/90"
            >
              <IconX className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-h-[420px] flex-1 flex-col justify-start border-l-4 border-accent bg-dark px-6 py-16 md:px-12 md:py-20">
        <p className="font-display text-4xl uppercase leading-[0.9] text-white md:text-5xl">
          The ArewaPay way
        </p>
        <ul className="mt-10 space-y-5">
          {solutions.map((s) => (
            <li key={s} className="font-sans flex items-start gap-3 text-lg text-white">
              <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
