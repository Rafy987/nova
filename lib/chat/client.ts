import type { SpeechLang } from "@/lib/stt/types";
import { isChatErrorCode, type ChatErrorCode, type ChatMessage } from "./types";

export class ChatError extends Error {
  constructor(public code: ChatErrorCode) {
    super(code);
  }
}

/**
 * Browser side: POST to /api/chat and read the reply as it streams.
 * onToken gets each new piece and the full text so far. Resolves with the full reply.
 * Pass an AbortSignal to cancel (barge-in / clear).
 */
export async function streamChat(opts: {
  messages: ChatMessage[];
  lang: SpeechLang;
  userName?: string;
  signal: AbortSignal;
  onToken: (piece: string, fullSoFar: string) => void;
}): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: opts.messages, lang: opts.lang, userName: opts.userName || undefined }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let code: ChatErrorCode = "upstream";
    try {
      const data = (await res.json()) as { error?: unknown };
      if (isChatErrorCode(data.error)) code = data.error;
    } catch {
      // keep "upstream"
    }
    throw new ChatError(code);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += value;
    opts.onToken(value, full);
  }
  return full;
}
