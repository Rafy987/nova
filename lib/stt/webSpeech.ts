import { EMPTY_TRANSCRIPT, fullText, joinResults, type ResultChunk, type Transcript } from "@/lib/transcript";
import type { SttCallbacks, SttErrorCode, SttProvider } from "./types";

/*
 * Browser Web Speech API (Chrome/Edge). Audio is processed by the browser vendor's servers.
 * Minimal local types: the API is not in every TypeScript DOM lib version.
 */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Map browser error names to our codes. null = normal end (not an error). */
function mapError(error: string): SttErrorCode | null {
  switch (error) {
    case "no-speech":
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "audio-capture":
      return "no-mic";
    case "network":
      return "network";
    default:
      return "unknown";
  }
}

export function createWebSpeechProvider(lang = "en-US"): SttProvider {
  let current: SpeechRecognitionLike | null = null;

  function detach(rec: SpeechRecognitionLike) {
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
  }

  return {
    name: "web-speech",

    isSupported: () => getCtor() !== null,

    start(cb: SttCallbacks) {
      const Ctor = getCtor();
      if (!Ctor) {
        cb.onError("unsupported");
        return;
      }
      if (current) {
        detach(current);
        current.abort();
      }

      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = true; //    keep listening while the key is held
      rec.interimResults = true; // live partial words
      rec.maxAlternatives = 1;

      let latest: Transcript = EMPTY_TRANSCRIPT;
      let failed = false;

      rec.onresult = (e) => {
        const chunks: ResultChunk[] = [];
        for (let i = 0; i < e.results.length; i++) {
          chunks.push({ transcript: e.results[i][0].transcript, isFinal: e.results[i].isFinal });
        }
        latest = joinResults(chunks);
        cb.onPartial(latest);
      };
      rec.onerror = (e) => {
        const code = mapError(e.error);
        if (code) {
          failed = true;
          cb.onError(code);
        }
      };
      rec.onend = () => {
        if (current === rec) current = null;
        if (!failed) cb.onEnd(fullText(latest));
      };

      current = rec;
      try {
        rec.start();
      } catch {
        current = null;
        cb.onError("unknown");
      }
    },

    stop() {
      current?.stop();
    },

    abort() {
      if (!current) return;
      detach(current);
      current.abort();
      current = null;
    },
  };
}
