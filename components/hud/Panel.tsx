import type { ReactNode } from "react";

const corner = "pointer-events-none absolute h-2.5 w-2.5 border-accent";

/** Glass HUD panel: dark translucent, thin cyan border, corner brackets, mono labels. */
export default function Panel({
  label,
  meta,
  action,
  children,
  className = "",
}: {
  label: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={label} className={`glass relative border border-accent/15 ${className}`}>
      {/* corner brackets */}
      <span aria-hidden className={`${corner} -left-px -top-px border-l border-t`} />
      <span aria-hidden className={`${corner} -right-px -top-px border-r border-t`} />
      <span aria-hidden className={`${corner} -bottom-px -left-px border-b border-l`} />
      <span aria-hidden className={`${corner} -bottom-px -right-px border-b border-r`} />

      <div className="flex items-center justify-between border-b border-accent/10 px-4 py-2.5">
        <h2 className="flex items-center gap-2 font-display text-[13px] font-medium uppercase tracking-[0.18em] text-ink/90">
          <span aria-hidden className="h-1 w-1 bg-accent shadow-[0_0_6px_var(--color-accent)]" />
          {label}
        </h2>
        <div className="flex items-center gap-3">
          {meta && <span className="hud-label text-dim">{meta}</span>}
          {action}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
