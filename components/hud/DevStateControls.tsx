import { canTransition, type NovaEvent, type NovaState } from "@/lib/novaState";

const EVENTS: NovaEvent[] = ["LISTEN", "STOP_LISTENING", "CANCEL", "REPLY_START", "REPLY_END", "FAIL", "RESET"];

/** Dev-only panel to drive the state machine by hand. Hidden in production builds. */
export default function DevStateControls({
  state,
  onEvent,
}: {
  state: NovaState;
  onEvent: (e: NovaEvent) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 border border-dashed border-line px-3 py-2">
      <span className="hud-label mr-2 text-warn/80">Dev</span>
      {EVENTS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onEvent(e)}
          disabled={!canTransition(state, e)}
          className="border border-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink/80 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-line disabled:hover:text-ink/80"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
