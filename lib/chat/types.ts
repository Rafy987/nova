export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ChatErrorCode =
  | "missing_key"
  | "bad_key"
  | "rate_limited" //      our per-IP limit
  | "groq_rate_limited" // Groq free-tier limit
  | "invalid_request"
  | "upstream";

export const CHAT_ERROR_MESSAGES: Record<ChatErrorCode, string> = {
  missing_key: "Groq API key missing. Add GROQ_API_KEY to .env.local and restart the server.",
  bad_key: "Groq rejected the API key. Check GROQ_API_KEY in .env.local.",
  rate_limited: "Too many requests. Wait a minute and try again.",
  groq_rate_limited: "Groq free-tier limit reached. Try again shortly.",
  invalid_request: "That request could not be processed.",
  upstream: "Could not reach NOVA's language model. Try again.",
};

export function isChatErrorCode(v: unknown): v is ChatErrorCode {
  return typeof v === "string" && v in CHAT_ERROR_MESSAGES;
}
