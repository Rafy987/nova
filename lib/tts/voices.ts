import type { ReplyStyle } from "@/lib/chat/replyStyle";

/** The parts of SpeechSynthesisVoice we use (plain objects in tests). */
export interface VoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
}

// Best first. Matched as substrings of the voice name.
const ENGLISH_PREFERRED = [
  "Ava Online (Natural) - English (United States)",
  "Andrew Online (Natural) - English (United States)",
  "Emma Online (Natural) - English (United States)",
  "Brian Online (Natural) - English (United States)",
  "Jenny Online (Natural)",
  "Aria Online (Natural)",
  "Google US English",
];
const ROMAN_URDU_PREFERRED = ["Neerja Online (Natural)", "Prabhat Online (Natural)"];
const URDU_PREFERRED = ["Online (Natural) - Urdu (Pakistan)", "Online (Natural) - Urdu (India)"];

const isLang = (v: VoiceInfo, prefix: string) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix);

function byNames<T extends VoiceInfo>(voices: T[], names: string[]): T | undefined {
  for (const n of names) {
    const v = voices.find((x) => x.name.includes(n));
    if (v) return v;
  }
  return undefined;
}

function bestEnglish<T extends VoiceInfo>(voices: T[]): T | null {
  return (
    byNames(voices, ENGLISH_PREFERRED) ??
    voices.find((v) => isLang(v, "en-us") && v.name.includes("Natural")) ??
    voices.find((v) => isLang(v, "en-us")) ??
    voices.find((v) => isLang(v, "en")) ??
    null
  );
}

/** Pick a voice for the reply style. null = no suitable voice (don't speak). */
export function pickVoice<T extends VoiceInfo>(voices: T[], style: ReplyStyle): T | null {
  switch (style) {
    case "urdu-script":
      return byNames(voices, URDU_PREFERRED) ?? voices.find((v) => isLang(v, "ur")) ?? null;
    case "roman-urdu":
      // No voice reads Roman Urdu natively; Indian-English voices sound closest.
      return byNames(voices, ROMAN_URDU_PREFERRED) ?? voices.find((v) => isLang(v, "en-in")) ?? bestEnglish(voices);
    default:
      return bestEnglish(voices);
  }
}

export const FALLBACK_LANG: Record<ReplyStyle, string> = {
  english: "en-US",
  "roman-urdu": "en-IN",
  "urdu-script": "ur-PK",
};
