/**
 * Small sliding-window limiter, kept in memory per server instance.
 *
 * On Vercel each instance has its own window, so this is a brake on one
 * client hammering the endpoint (and running up the Gemini bill), not a hard
 * global quota. A shared store like Upstash would be the next step.
 */
export interface Limiter {
  check(key: string, now?: number): { ok: boolean; retryAfter: number };
}

export function createLimiter(limit: number, windowMs: number, maxKeys = 5000): Limiter {
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000) };
      }
      recent.push(now);
      hits.set(key, recent);
      // Keep memory bounded: drop the oldest key once we're over the cap.
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value as string);
      return { ok: true, retryAfter: 0 };
    },
  };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
