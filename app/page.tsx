import Orb from "@/components/orb/Orb";
import StatusBar from "@/components/hud/StatusBar";
import Panel from "@/components/hud/Panel";
import CornerBrackets from "@/components/hud/CornerBrackets";
import TalkButton from "@/components/hud/TalkButton";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Background layers */}
      <div aria-hidden className="hud-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="hud-vignette pointer-events-none absolute inset-0" />
      <CornerBrackets />

      <div className="relative z-10 flex flex-1 flex-col">
        <StatusBar />

        <main className="grid flex-1 grid-cols-1 items-center gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
          {/* Center: orb + state (first on mobile) */}
          <div className="flex flex-col items-center lg:order-2">
            <Orb />
            <div className="mt-1 flex flex-col items-center gap-1" role="status" aria-live="polite">
              <span className="flex items-center gap-2 border border-accent/30 bg-accent/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent glow-text">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)] animate-breathe" />
                Idle
              </span>
              <span className="font-mono text-[10px] tracking-[0.15em] text-dim">AWAITING INPUT</span>
            </div>
          </div>

          {/* Left: transcript */}
          <Panel label="Transcript" meta="Session 01" className="lg:order-1 lg:max-w-sm lg:justify-self-end w-full">
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
          <Panel label="Modules" meta="0 active" className="lg:order-3 lg:max-w-sm w-full">
            <ul className="space-y-2.5">
              {["Weather", "Time / Zones", "Calculator", "Reminders", "Notes"].map((name) => (
                <li key={name} className="flex items-center justify-between border-b border-accent/5 pb-2 last:border-0 last:pb-0">
                  <span className="font-display text-sm text-ink/80">{name}</span>
                  <span className="hud-label text-dim">Standby</span>
                </li>
              ))}
            </ul>
          </Panel>
        </main>

        <footer className="flex justify-center px-5 pb-10 pt-2">
          <TalkButton />
        </footer>
      </div>
    </div>
  );
}
