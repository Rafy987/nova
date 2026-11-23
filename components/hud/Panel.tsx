import type { ReactNode } from "react";

/** Thin-bordered HUD panel with a small header label and corner notches. */
export default function Panel({
  label,
  meta,
  children,
  className = "",
}: {
  label: string;
  meta?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={`relative border border-line-soft bg-deep/60 backdrop-blur-sm ${className}`}
    >
      {/* corner notches */}
      <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-accent/70" />
      <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-accent/70" />

      <div className="flex items-center justify-between border-b border-line-soft px-4 py-2">
        <h2 className="hud-label text-ink/70">{label}</h2>
        {meta && <span className="hud-label text-dim">{meta}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
