import { describe, expect, it } from "vitest";
import { clientKey, createLimiter } from "@/lib/rateLimit";

describe("createLimiter", () => {
  it("allows up to the limit, then blocks with a retry time", () => {
    const limiter = createLimiter(2, 60_000);
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("a", 1_000).ok).toBe(true);
    expect(limiter.check("a", 2_000)).toEqual({ ok: false, retryAfter: 58 });
  });

  it("frees slots once they fall out of the window", () => {
    const limiter = createLimiter(1, 1_000);
    limiter.check("a", 0);
    expect(limiter.check("a", 500).ok).toBe(false);
    expect(limiter.check("a", 1_001).ok).toBe(true);
  });

  it("counts each key separately", () => {
    const limiter = createLimiter(1, 1_000);
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("b", 0).ok).toBe(true);
  });

  it("forgets the oldest key when it holds too many", () => {
    const limiter = createLimiter(1, 60_000, 2);
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 0); // evicts "a"
    expect(limiter.check("a", 1).ok).toBe(true);
  });

  it("uses the real clock by default", () => {
    expect(createLimiter(1, 1_000).check("a").ok).toBe(true);
  });
});

describe("clientKey", () => {
  const req = (headers: Record<string, string>) => new Request("http://x.test", { headers });

  it("takes the first forwarded address", () => {
    expect(clientKey(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(clientKey(req({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientKey(req({}))).toBe("unknown");
  });
});
