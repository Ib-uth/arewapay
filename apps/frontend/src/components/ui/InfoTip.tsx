import { useId } from "react";

/** Compact “i” control; explanation in a themed popover on hover or keyboard focus. */
export function InfoTip({ text }: { text: string }) {
  const id = useId();
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-charcoal/25 text-[10px] font-bold leading-none text-charcoal/45 transition-colors hover:border-charcoal/40 hover:text-charcoal/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/25 dark:text-white/45 dark:hover:border-white/40 dark:hover:text-white/70"
        aria-describedby={id}
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-charcoal/15 bg-white px-2.5 py-2 text-left text-xs font-normal font-sans leading-snug text-charcoal shadow-md opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-white/15 dark:bg-charcoal dark:text-white"
      >
        {text}
      </span>
    </span>
  );
}

export function LabelWithInfo({
  label,
  hint,
  htmlFor,
  labelClassName,
}: {
  label: string;
  hint: string;
  htmlFor?: string;
  labelClassName: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </label>
      <InfoTip text={hint} />
    </div>
  );
}
