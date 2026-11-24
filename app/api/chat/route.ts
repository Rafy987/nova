import { chatRequestSchema } from "@/lib/chat/schema";
import { trimHistory } from "@/lib/chat/history";
import { buildSystemPrompt } from "@/lib/chat/prompt";
import { detectReplyStyle } from "@/lib/chat/replyStyle";
import { createSseParser, parseGroqPayload } from "@/lib/chat/sse";
import type { ChatErrorCode } from "@/lib/chat/types";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

/**
 * POST /api/chat
 * Body: { messages: [{ role, content }], lang }
 * Response: plain-text stream of the reply, token by token.
 * The Groq key stays on the server; the browser never sees it.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// gpt-oss-120b: supports tool calling; with low reasoning the first word arrives fast.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// 20 requests per minute per IP (soft limit, see lib/rateLimit.ts)
const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

function error(code: ChatErrorCode, status: number, headers?: HeadersInit) {
  return Response.json({ error: code }, { status, headers });
}

export async function POST(request: Request) {
  const rl = limiter.check(clientIp(request.headers));
  if (!rl.ok) {
    return error("rate_limited", 429, { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "PASTE_HERE") return error("missing_key", 500);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("invalid_request", 400);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return error("invalid_request", 400);

  const { userName } = parsed.data;
  const messages = trimHistory(parsed.data.messages);
  // Reply style follows the user's LAST message (English / Roman Urdu / Urdu script)
  const style = detectReplyStyle(messages.at(-1)?.content ?? "");

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.6,
        max_tokens: 400,
        reasoning_effort: "low", //   less hidden "thinking" = lower latency
        include_reasoning: false, //  only stream the answer, not the reasoning
        messages: [{ role: "system", content: buildSystemPrompt({ style, userName }) }, ...messages],
      }),
      signal: request.signal, // client disconnects -> stop paying for tokens
    });
  } catch {
    return error("upstream", 502);
  }

  if (!upstream.ok || !upstream.body) {
    // Log status + Groq's message for debugging (never the key)
    const detail = await upstream.text().catch(() => "");
    console.error(`[chat] Groq ${upstream.status}: ${detail.slice(0, 300)}`);
    if (upstream.status === 401) return error("bad_key", 502);
    if (upstream.status === 429) return error("groq_rate_limited", 429);
    return error("upstream", 502);
  }

  // Turn Groq's SSE stream into a plain text stream of just the words.
  const parser = createSseParser();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const textStream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        for (const payload of parser.push(decoder.decode(chunk, { stream: true }))) {
          const { text } = parseGroqPayload(payload);
          if (text) controller.enqueue(encoder.encode(text));
        }
      },
    }),
  );

  return new Response(textStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
