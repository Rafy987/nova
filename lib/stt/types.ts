import type { Transcript } from "@/lib/transcript";

/** Speech-to-text provider. Web Speech now; Groq Whisper plugs into the same shape later. */

/** Recognition languages. Urdu comes back in Urdu script (not Roman Urdu). */
export type SpeechLang = "en-US" | "ur-PK";

export const SPEECH_LANGS: { value: SpeechLang; label: string; name: string }[] = [
  { value: "en-US", label: "EN", name: "English" },
  { value: "ur-PK", label: "UR", name: "Urdu" },
];

export type SttErrorCode =
  | "unsupported"
  | "not-allowed"
  | "no-mic"
  | "network"
  | "language-unsupported"
  | "unknown";

export interface SttCallbacks {
  /** Live text while the user speaks. */
  onPartial: (t: Transcript) => void;
  /** Session finished (after stop() or by itself). Empty string = nothing heard. */
  onEnd: (finalText: string) => void;
  onError: (code: SttErrorCode) => void;
}

export interface SttProvider {
  readonly name: string;
  isSupported(): boolean;
  start(cb: SttCallbacks): void;
  /** Stop listening and deliver the final text via onEnd. */
  stop(): void;
  /** Stop immediately, no callbacks. */
  abort(): void;
}

export const STT_MESSAGES: Record<SttErrorCode, string> = {
  unsupported: "Speech recognition needs Chrome or Edge.",
  "not-allowed": "Microphone blocked. Allow it from the icon in the address bar.",
  "no-mic": "No microphone found.",
  network: "Speech service unreachable. Check your internet connection.",
  unknown: "Speech recognition failed. Try again.",
  "language-unsupported": "This browser cannot recognize the selected language. Try Chrome, or switch to EN.",
};
