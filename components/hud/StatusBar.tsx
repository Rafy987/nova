"use client";

import { useEffect, useState } from "react";
import type { MicStatus } from "@/hooks/useMicLevel";
import { SPEECH_LANGS, type SpeechLang } from "@/lib/stt/types";

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

const MIC_LABEL: Record<MicStatus, string> = {
  off: "Standby",
  starting: "Opening",
  on: "Live",
  denied: "Blocked",
  unavailable: "Unavailable",
  error: "Fault",
};

/** Top HUD bar: system name, status and a live clock. */
export default function StatusBar({
  micStatus = "off",
  soundOn = true,
  onToggleSound,
  lang,
  onLangChange,
  langLocked = false,
}: {
  micStatus?: MicStatus;
  soundOn?: boolean;
  onToggleSound?: () => void;
  lang?: SpeechLang;
  onLangChange?: (l: SpeechLang) => void;
  langLocked?: boolean;
}) {
  // Clock starts empty on the server and fills in on the client (avoids hydration mismatch).
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatTime(new Date()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-line-soft px-7 py-4 sm:px-12">
      <div className="flex items-center gap-3">
        <span className="font-display text-base font-semibold tracking-[0.45em] text-ink">NOVA</span>
        <span className="hidden h-3 w-px bg-line sm:block" />
        <span className="hud-label hidden sm:inline">Voice Interface v0.1</span>
      </div>

      <div className="flex items-center gap-5">
        <span className="hud-label hidden items-center gap-2 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_6px_var(--color-ok)]" />
          Sys online
        </span>
        <span className={`hud-label hidden md:inline ${micStatus === "on" ? "text-accent" : ""}`}>
          Mic: {MIC_LABEL[micStatus]}
        </span>
        {lang && onLangChange && (
          <div role="radiogroup" aria-label="Speech language" className="flex items-center border border-line">
            {SPEECH_LANGS.map((l) => {
              const selected = l.value === lang;
              return (
                <button
                  key={l.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={l.name}
                  disabled={langLocked}
                  onClick={() => onLangChange(l.value)}
                  className={`hud-label px-2 py-0.5 transition-colors disabled:cursor-not-allowed ${
                    selected ? "bg-accent/15 text-accent" : "hover:text-ink"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        )}
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Turn sound cues off" : "Turn sound cues on"}
            className="hud-label border border-transparent px-1 transition-colors hover:border-line hover:text-ink"
          >
            Sfx: {soundOn ? "On" : "Off"}
          </button>
        )}
        <span className="hud-label tabular-nums text-ink/80" suppressHydrationWarning>
          {time ?? "--:--:--"}
        </span>
      </div>
    </header>
  );
}
