/**
 * Decide the ONE language style NOVA must reply in, based on the user's last message.
 * Done in code (not left to the model) so replies never mix scripts.
 */

export type ReplyStyle = "english" | "roman-urdu" | "urdu-script";

// Arabic-script block covers Urdu letters.
const URDU_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

// Common Roman Urdu words that are not normal English words.
const ROMAN_URDU_WORDS = new Set([
  "hai", "hain", "ho", "hoon", "hun", "tha", "thi", "the", "kya", "kia", "kyun", "kyon", "kaise", "kaisa", "kaisi",
  "kab", "kahan", "kidhar", "kaun", "kon", "mera", "meri", "mere", "mujhe", "main", "mein", "hum", "humein", "tum",
  "tumhara", "aap", "ap", "apka", "aapka", "aapko", "apko", "nahi", "nahin", "haan", "han", "ji", "jee", "acha",
  "achha", "theek", "thik", "karo", "karein", "kardo", "kar", "karna", "kro", "batao", "bataen", "bataein", "bolo",
  "chahiye", "chaiye", "sakte", "sakta", "sakti", "raha", "rahi", "rahe", "wala", "wali", "abhi", "aaj", "kal",
  "phir", "lekin", "magar", "aur", "bhi", "sirf", "bohat", "bahut", "zyada", "kam", "yeh", "ye", "woh", "wo",
  "kuch", "sab", "naam", "shukriya", "mausam", "dost", "yaar", "samajh", "pata", "matlab", "ka", "ki", "ke", "ko",
  "se", "par", "pe",
]);

// Words that are both Roman Urdu and English: don't count them alone.
const AMBIGUOUS = new Set(["main", "the", "par", "pe", "ho", "kal", "han", "ki", "ka", "ke", "ko", "se", "ye", "kam", "sab"]);

export function detectReplyStyle(text: string): ReplyStyle {
  if (URDU_SCRIPT.test(text)) return "urdu-script";

  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  if (words.length === 0) return "english";

  let strong = 0;
  let any = 0;
  for (const w of words) {
    if (!ROMAN_URDU_WORDS.has(w)) continue;
    any++;
    if (!AMBIGUOUS.has(w)) strong++;
  }
  // Roman Urdu if at least one unambiguous word and a fair share of Urdu words overall.
  return strong >= 1 && any / words.length >= 0.25 ? "roman-urdu" : "english";
}

export function styleInstruction(style: ReplyStyle): string {
  const rule = "Use this one style for the whole reply. Never mix languages or scripts, and never repeat the answer in another language.";
  switch (style) {
    case "urdu-script":
      return `Reply only in Urdu, written in Urdu script. Do not use Latin letters or Roman Urdu. ${rule}`;
    case "roman-urdu":
      return `Reply only in Roman Urdu (Urdu written with Latin letters, e.g. "Main theek hoon"). Do not use Urdu script. ${rule}`;
    default:
      return `Reply only in English. ${rule}`;
  }
}
