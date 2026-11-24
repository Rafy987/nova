/** Small on/off switches for NOVA's voice and the UI sound cues. */
export default function AudioToggles({
  voiceOn,
  onToggleVoice,
  soundOn,
  onToggleSound,
}: {
  voiceOn: boolean;
  onToggleVoice: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Toggle label="Voice" on={voiceOn} onClick={onToggleVoice} />
      <Toggle label="Sfx" on={soundOn} onClick={onToggleSound} />
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`hud-label flex items-center gap-2 border px-2.5 py-1 transition-colors ${
        on ? "border-accent/40 text-accent" : "border-line text-dim hover:text-ink"
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${on ? "bg-accent shadow-[0_0_6px_var(--color-accent)]" : "bg-dim"}`} />
      {label} {on ? "On" : "Off"}
    </button>
  );
}
