"use client";

/** Push-to-talk control: hold with mouse/touch, or hold Space anywhere. */
export default function TalkButton({
  active,
  onPressStart,
  onPressEnd,
}: {
  active: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label="Hold to talk (or hold Space)"
        aria-pressed={active}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          onPressStart();
        }}
        onPointerUp={onPressEnd}
        onPointerCancel={onPressEnd}
        onContextMenu={(e) => e.preventDefault()}
        className={`group relative flex h-16 w-16 touch-none select-none items-center justify-center rounded-full border bg-deep transition-[border-color,box-shadow] duration-200 ${
          active
            ? "border-accent shadow-[0_0_24px_rgb(34_211_238/0.45)]"
            : "border-line hover:border-accent/70"
        }`}
      >
        <span
          className={`absolute inset-1.5 rounded-full border transition-colors ${
            active ? "border-accent/50" : "border-line-soft group-hover:border-accent/30"
          }`}
        />
        {active && <span aria-hidden className="absolute -inset-2 animate-ping rounded-full border border-accent/30" />}
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 transition-colors ${active ? "text-accent" : "text-muted group-hover:text-accent"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" strokeLinecap="round" />
        </svg>
      </button>
      <p className="hud-label">
        {active ? (
          <span className="text-accent">Release to send</span>
        ) : (
          <>
            Hold <kbd className="mx-1 border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink/80">Space</kbd> to talk
          </>
        )}
      </p>
    </div>
  );
}
