"use client";

import { useEffect, useRef } from "react";
import Panel from "./Panel";
import type { Transcript } from "@/lib/transcript";
import type { SpeechLang } from "@/lib/stt/types";
import type { ChatMessage } from "@/lib/chat/types";

/**
 * Conversation log: past turns, the live user transcript while listening,
 * and NOVA's reply while it streams in.
 */
export default function TranscriptPanel({
  turns,
  live,
  reply,
  listening,
  lang = "en-US",
  onClear,
  clearDisabled = false,
  className = "",
}: {
  turns: ChatMessage[];
  live: Transcript;
  reply: string | null;
  listening: boolean;
  lang?: SpeechLang;
  onClear: () => void;
  clearDisabled?: boolean;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasLive = listening || !!live.final || !!live.interim;
  const empty = turns.length === 0 && !hasLive && reply === null;

  // Keep the newest text in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, live, reply]);

  return (
    <Panel
      label="Transcript"
      meta={lang === "ur-PK" ? "Urdu" : "English"}
      action={
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled || turns.length === 0}
          className="hud-label border border-line px-2 py-0.5 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
        >
          Clear
        </button>
      }
      className={className}
    >
      <div ref={scrollRef} className="hud-scroll max-h-[42vh] space-y-4 overflow-y-auto pr-2 lg:max-h-[46vh]" aria-live="polite">
        {empty && (
          <p className="text-sm text-dim">
            Your words will appear here as you speak
            <span className="ml-0.5 inline-block animate-blink text-accent">_</span>
          </p>
        )}

        {turns.map((m, i) => (
          <Line key={i} who={m.role}>
            <span className="text-ink/85">{m.content}</span>
          </Line>
        ))}

        {hasLive && (
          <Line who="user">
            {!live.final && !live.interim ? (
              <span className="text-dim">Listening</span>
            ) : (
              <>
                <span className="text-ink">{live.final}</span>
                {live.interim && <span className="text-muted"> {live.interim}</span>}
              </>
            )}
            <span className="ml-0.5 inline-block animate-blink text-accent">_</span>
          </Line>
        )}

        {reply !== null && (
          <Line who="assistant">
            {reply ? <span className="text-ink">{reply}</span> : <span className="text-dim">Thinking</span>}
            <span className="ml-0.5 inline-block animate-blink text-accent">_</span>
          </Line>
        )}
      </div>
    </Panel>
  );
}

function Line({ who, children }: { who: ChatMessage["role"]; children: React.ReactNode }) {
  const nova = who === "assistant";
  return (
    <div className={nova ? "border-l border-accent/30 pl-3" : ""}>
      <p className={`hud-label mb-1 ${nova ? "text-accent/80" : ""}`}>{nova ? "Nova" : "You"}</p>
      {/* dir="auto": Urdu script flows right-to-left automatically */}
      <p dir="auto" className="text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}
