import { describe, expect, it } from "vitest";
import { trimHistory } from "./history";
import { createSseParser, parseGroqPayload } from "./sse";
import { chatRequestSchema } from "./schema";
import { createRateLimiter, clientIp } from "../rateLimit";
import type { ChatMessage } from "./types";

const u = (content: string): ChatMessage => ({ role: "user", content });
const a = (content: string): ChatMessage => ({ role: "assistant", content });

describe("trimHistory", () => {
  it("keeps only the last N turns", () => {
    const msgs = Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? u(`q${i}`) : a(`a${i}`)));
    const out = trimHistory(msgs, 3);
    expect(out).toHaveLength(6);
    expect(out[0].content).toBe("q24");
  });

  it("always starts with a user message", () => {
    expect(trimHistory([a("hi"), u("hello"), a("hey")])[0].role).toBe("user");
  });

  it("drops oldest messages over the char budget", () => {
    const out = trimHistory([u("x".repeat(50)), a("y".repeat(50)), u("z".repeat(10))], 10, 70);
    expect(out).toEqual([u("z".repeat(10))]);
  });
});

describe("SSE parser", () => {
  it("handles lines split across chunks", () => {
    const p = createSseParser();
    expect(p.push('data: {"choices":[{"delta":{"content":"Hel')).toEqual([]);
    const got = p.push('lo"}}]}\n\ndata: [DONE]\n');
    expect(got.map(parseGroqPayload)).toEqual([
      { done: false, text: "Hello" },
      { done: true, text: "" },
    ]);
  });

  it("ignores non-data lines and bad JSON", () => {
    const p = createSseParser();
    expect(p.push(": keep-alive\nevent: x\n")).toEqual([]);
    expect(parseGroqPayload("{not json")).toEqual({ done: false, text: "" });
    expect(parseGroqPayload('{"choices":[{"delta":{}}]}')).toEqual({ done: false, text: "" });
  });
});

describe("chatRequestSchema", () => {
  it("accepts a valid request and defaults lang", () => {
    const r = chatRequestSchema.safeParse({ messages: [u("hi")] });
    expect(r.success && r.data.lang).toBe("en-US");
  });
  it("rejects empty, too long, or assistant-last requests", () => {
    expect(chatRequestSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [u("x".repeat(2001))] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [u("hi"), a("yo")] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "system", content: "x" }] }).success).toBe(false);
  });
});

describe("rate limiter", () => {
  it("blocks after the limit and frees up after the window", () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(rl.check("ip", 0).ok).toBe(true);
    expect(rl.check("ip", 100).ok).toBe(true);
    expect(rl.check("ip", 200).ok).toBe(false);
    expect(rl.check("other", 200).ok).toBe(true);
    expect(rl.check("ip", 1001).ok).toBe(true);
  });
  it("reads the first forwarded IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers())).toBe("local");
  });
});
