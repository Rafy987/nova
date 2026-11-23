"use client";

import { useState } from "react";
import Orb from "@/components/orb/Orb";
import StatusBar from "@/components/hud/StatusBar";
import Panel from "@/components/hud/Panel";
import TalkButton from "@/components/hud/TalkButton";
import StatusPill from "@/components/hud/StatusPill";
import DevStateControls from "@/components/hud/DevStateControls";
import { transition, type NovaEvent, type NovaState } from "@/lib/novaState";
import { micMessage, useMicLevel } from "@/hooks/useMicLevel";

const MODULES = ["Weather", "Time / Zones", "Calculator", "Reminders", "Notes"];

/** Client shell: owns NOVA's state and the microphone. */
export default function NovaHud() {
  const [state, setState] = useState<NovaState>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const mic = useMicLevel();

  // All state changes go through the pure state machine.
  async function send(event: NovaEvent) {
    const next = transition(state, event);
    if (next === state) return;

    if (next !== "error") setErrorText(null);
    if (state === "listening" && next !== "listening") mic.stop();
    setState(next);

    // Open the mic inside the user gesture (required by browsers)
    if (next === "listening") {
      const result = await mic.start();
      if (result !== "on" && result !== "off") {
        setErrorText(micMessage(result));
        setState((s) => (s === "listening" ? transition(s, "FAIL") : s));
      }
    }
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <StatusBar micStatus={mic.status} />

      <main className="grid flex-1 grid-cols-1 items-center gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        {/* Center: orb + state (first on mobile) */}
        <div className="flex flex-col items-center lg:order-2">
          <Orb state={state} micLevelRef={mic.levelRef} />
          <StatusPill state={state} detail={errorText} />
        </div>

        {/* Left: transcript */}
        <Panel label="Transcript" meta="Session 01" className="w-full lg:order-1 lg:max-w-sm lg:justify-self-end">
          <div className="space-y-4">
            <div>
              <p className="hud-label mb-1">You</p>
              <p className="text-sm text-dim">
                Your words will appear here as you speak
                <span className="ml-0.5 inline-block animate-blink text-accent">_</span>
              </p>
            </div>
            <div className="border-t border-line-soft pt-4">
              <p className="hud-label mb-1 text-accent/80">Nova</p>
              <p className="text-sm text-dim">Replies stream in here.</p>
            </div>
          </div>
        </Panel>

        {/* Right: tool output */}
        <Panel label="Modules" meta="0 active" className="w-full lg:order-3 lg:max-w-sm">
          <ul className="space-y-2.5">
            {MODULES.map((name) => (
              <li key={name} className="flex items-center justify-between border-b border-accent/5 pb-2 last:border-0 last:pb-0">
                <span className="font-display text-sm text-ink/80">{name}</span>
                <span className="hud-label text-dim">Standby</span>
              </li>
            ))}
          </ul>
        </Panel>
      </main>

      <footer className="flex flex-col items-center gap-6 px-5 pb-10 pt-2">
        <TalkButton />
        {process.env.NODE_ENV === "development" && <DevStateControls state={state} onEvent={send} />}
      </footer>
    </div>
  );
}
