import type { NovaState } from "@/lib/novaState";

const COPY: Record<NovaState, { label: string; detail: string }> = {
  idle: { label: "Idle", detail: "Awaiting input" },
  listening: { label: "Listening", detail: "Mic live" },
  thinking: { label: "Thinking", detail: "Processing" },
  speaking: { label: "Speaking", detail: "Voice output" },
  error: { label: "Error", detail: "Something went wrong" },
};

/** Small glowing state label under the orb. Announced to screen readers. */
export default function StatusPill({ state, detail }: { state: NovaState; detail?: string | null }) {
  const isError = state === "error";
  const { label, detail: fallback } = COPY[state];

  return (
    <div className="mt-1 flex max-w-xs flex-col items-center gap-1 text-center" role="status" aria-live="polite">
      <span
        className={`flex items-center gap-2 border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] ${
          isError
            ? "border-danger/40 bg-danger/5 text-danger"
            : "glow-text border-accent/30 bg-accent/5 text-accent"
        }`}
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            isError ? "bg-danger" : "animate-breathe bg-accent shadow-[0_0_8px_var(--color-accent)]"
          }`}
        />
        {label}
      </span>
      <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${isError ? "text-danger/80" : "text-dim"}`}>
        {detail ?? fallback}
      </span>
    </div>
  );
}
