/** Pure helpers for building the live transcript from speech-recognition results. */

export interface ResultChunk {
  transcript: string;
  isFinal: boolean;
}

export interface Transcript {
  final: string; //   confirmed words
  interim: string; // words still being guessed (may change)
}

export const EMPTY_TRANSCRIPT: Transcript = { final: "", interim: "" };

/** Collapse whitespace and trim. */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Split a session's results into confirmed (final) and in-progress (interim) text. */
export function joinResults(results: ResultChunk[]): Transcript {
  const final: string[] = [];
  const interim: string[] = [];
  for (const r of results) (r.isFinal ? final : interim).push(r.transcript);
  return { final: cleanText(final.join(" ")), interim: cleanText(interim.join(" ")) };
}

/** Everything heard so far, used when the user releases the talk key. */
export function fullText(t: Transcript): string {
  return cleanText(`${t.final} ${t.interim}`);
}
