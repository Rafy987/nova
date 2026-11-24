import { styleInstruction, type ReplyStyle } from "./replyStyle";

/** Allowed name: letters (any script), spaces, . ' - ; max 60 chars. Blocks prompt-injection via the name field. */
const NAME_PATTERN = /^[\p{L}\p{M} .'-]{1,60}$/u;

export function sanitizeUserName(name: string | undefined | null): string | null {
  const clean = (name ?? "").replace(/\s+/g, " ").trim();
  return clean && NAME_PATTERN.test(clean) ? clean : null;
}

/** Short on purpose: every token here is sent with every request. */
export function buildSystemPrompt(opts: { style: ReplyStyle; userName?: string | null }): string {
  const parts = [
    "You are NOVA, a voice assistant. Your replies are spoken aloud.",
    "Keep answers short: 1-3 sentences unless the user asks for more detail.",
    "Plain text only: no markdown, lists, emojis, code blocks or URLs.",
    styleInstruction(opts.style),
    "You have no tools, internet or live data yet (weather, news, time). If asked for those or to do an action, say briefly that you can't do that yet.",
    "You remember this conversation (this session only), not past sessions.",
    "Never claim to have done something you did not do. If unsure, say so.",
  ];
  const name = sanitizeUserName(opts.userName);
  if (name) {
    parts.push(
      `The user's name is "${name}". Always spell it exactly like this, even if the transcript spells it differently. Use the name only when it fits, not in every reply.`,
    );
  }
  return parts.join(" ");
}
