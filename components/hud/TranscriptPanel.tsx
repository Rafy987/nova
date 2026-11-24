import Panel from "./Panel";
import type { Transcript } from "@/lib/transcript";
import type { SpeechLang } from "@/lib/stt/types";

/** Live transcript: confirmed words in white, words still being guessed in gray. */
export default function TranscriptPanel({
  transcript,
  listening,
  lang = "en-US",
  className = "",
}: {
  transcript: Transcript;
  listening: boolean;
  lang?: SpeechLang;
  className?: string;
}) {
  const empty = !transcript.final && !transcript.interim;

  return (
    <Panel label="Transcript" meta={lang === "ur-PK" ? "Urdu" : "English"} className={className}>
      <div className="space-y-4">
        <div>
          <p className="hud-label mb-1">You</p>
          {/* dir="auto": Urdu script flows right-to-left automatically */}
          <p
            dir="auto"
            lang={empty ? undefined : lang === "ur-PK" ? "ur" : "en"}
            className="min-h-[1.25rem] text-sm leading-relaxed"
            aria-live="polite"
          >
            {empty ? (
              <span className="text-dim">{listening ? "Listening" : "Your words will appear here as you speak"}</span>
            ) : (
              <>
                <span className="text-ink">{transcript.final}</span>
                {transcript.interim && <span className="text-muted"> {transcript.interim}</span>}
              </>
            )}
            {(listening || empty) && <span className="ml-0.5 inline-block animate-blink text-accent">_</span>}
          </p>
        </div>
        <div className="border-t border-line-soft pt-4">
          <p className="hud-label mb-1 text-accent/80">Nova</p>
          <p className="text-sm text-dim">Replies stream in here.</p>
        </div>
      </div>
    </Panel>
  );
}
