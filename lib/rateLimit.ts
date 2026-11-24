/**
 * Sliding-window rate limiter kept in server memory.
 * Limitation: each server instance has its own memory, so on Vercel (many instances)
 * this is only a soft limit. A shared store is planned for Phase 12.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return {
    check(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfterMs: number } {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: windowMs - (now - recent[0]) };
      }
      recent.push(now);
      hits.set(key, recent);

      // Keep memory bounded
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return { ok: true };
    },
  };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "local";
}
