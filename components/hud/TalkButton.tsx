/** Push-to-talk control. Visual only in Phase 1; wired to the mic in Phase 3. */
export default function TalkButton() {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label="Hold to talk (Space)"
        className="group relative flex h-16 w-16 items-center justify-center rounded-full border border-line bg-deep transition-colors hover:border-accent/70 active:border-accent"
      >
        <span className="absolute inset-1.5 rounded-full border border-line-soft transition-colors group-hover:border-accent/30" />
        {/* mic glyph */}
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-muted transition-colors group-hover:text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" strokeLinecap="round" />
        </svg>
      </button>
      <p className="hud-label">
        Hold <kbd className="mx-1 border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink/80">Space</kbd> to talk
      </p>
    </div>
  );
}
