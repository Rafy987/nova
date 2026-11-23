"use client";

import { useEffect, useState } from "react";

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

/** Top HUD bar: system name, status and a live clock. */
export default function StatusBar() {
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
        <span className="hud-label flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_6px_var(--color-ok)]" />
          Sys online
        </span>
        <span className="hud-label hidden md:inline">Mic: standby</span>
        <span className="hud-label tabular-nums text-ink/80" suppressHydrationWarning>
          {time ?? "--:--:--"}
        </span>
      </div>
    </header>
  );
}
