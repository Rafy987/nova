/**
 * Server-Sent Events parsing for Groq's OpenAI-compatible stream.
 * The stream looks like:
 *   data: {"choices":[{"delta":{"content":"Hel"}}]}
 *   data: {"choices":[{"delta":{"content":"lo"}}]}
 *   data: [DONE]
 * Network chunks can cut a line in half, so we buffer until a newline.
 */

export function createSseParser() {
  let buffer = "";
  return {
    /** Feed raw text; returns complete `data:` payloads found so far. */
    push(chunk: string): string[] {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? ""; // last piece may be incomplete
      const payloads: string[] = [];
      for (const line of lines) {
        if (line.startsWith("data:")) payloads.push(line.slice(5).trim());
      }
      return payloads;
    },
  };
}

/** Extract the text delta from one payload. */
export function parseGroqPayload(payload: string): { done: boolean; text: string } {
  if (payload === "[DONE]") return { done: true, text: "" };
  try {
    const json = JSON.parse(payload) as { choices?: { delta?: { content?: string | null } }[] };
    return { done: false, text: json.choices?.[0]?.delta?.content ?? "" };
  } catch {
    return { done: false, text: "" };
  }
}
