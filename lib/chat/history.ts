import type { ChatMessage } from "./types";

export const MAX_TURNS = 10; //        one turn = user + assistant
export const MAX_HISTORY_CHARS = 8000; // rough token budget

/**
 * Keep only recent history to save tokens:
 * last MAX_TURNS turns, under MAX_HISTORY_CHARS, and always starting with a user message.
 */
export function trimHistory(
  messages: ChatMessage[],
  maxTurns = MAX_TURNS,
  maxChars = MAX_HISTORY_CHARS,
): ChatMessage[] {
  let out = messages.filter((m) => m.content.trim().length > 0).slice(-maxTurns * 2);

  let total = out.reduce((n, m) => n + m.content.length, 0);
  while (out.length > 1 && total > maxChars) {
    total -= out[0].content.length;
    out = out.slice(1);
  }

  while (out.length > 0 && out[0].role !== "user") out = out.slice(1);
  return out;
}
