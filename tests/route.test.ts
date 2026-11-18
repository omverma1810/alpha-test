import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/coach", () => ({ coach: vi.fn() }));

import { POST } from "@/app/api/coach/route";
import { coach } from "@/lib/coach";
import { ModelError } from "@/lib/gemini";

let ip = 0;
function post(body: unknown, headers: Record<string, string> = {}) {
  ip += 1;
  return new Request("https://coach.test/api/coach", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ip}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/coach", () => {
  afterEach(() => vi.mocked(coach).mockReset());

  it("returns the coach's reply and is never cached", async () => {
    vi.mocked(coach).mockResolvedValue({ kind: "plan" } as never);
    const res = await POST(post({ message: "Bedtime", region: "in" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ reply: { kind: "plan" } });
    expect(coach).toHaveBeenCalledWith({ message: "Bedtime", history: [], region: "in" });
  });

  it("accepts same-site requests", async () => {
    vi.mocked(coach).mockResolvedValue({ kind: "plan" } as never);
    expect((await POST(post({ message: "hi" }, { origin: "https://coach.test" }))).status).toBe(200);
  });

  it("rejects requests from other sites", async () => {
    const res = await POST(post({ message: "hi" }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("rejects a malformed Origin header", async () => {
    expect((await POST(post({ message: "hi" }, { origin: "not a url" }))).status).toBe(403);
  });

  it("rejects oversized bodies", async () => {
    const res = await POST(post({ message: "hi" }, { "content-length": String(100_000) }));
    expect(res.status).toBe(413);
  });

  it("rejects a body that isn't JSON", async () => {
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/JSON/);
  });

  it("rejects an invalid request with a readable message", async () => {
    const res = await POST(post({ message: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Type a message first");
  });

  it("says so when the server has no API key", async () => {
    vi.mocked(coach).mockRejectedValue(new ModelError("GEMINI_API_KEY is not set."));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(post({ message: "hi" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/GEMINI_API_KEY/);
  });

  it("returns 502 for model failures and logs no message text", async () => {
    vi.mocked(coach).mockRejectedValue(new Error("Gemini returned 503"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(post({ message: "a very private worry" }));
    expect(res.status).toBe(502);
    expect(JSON.stringify(log.mock.calls)).not.toContain("private worry");
  });

  it("logs non-Error throws too", async () => {
    vi.mocked(coach).mockRejectedValue("plain string");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(post({ message: "hi" }))).status).toBe(502);
  });

  it("rate-limits one client after 20 messages", async () => {
    vi.mocked(coach).mockResolvedValue({ kind: "plan" } as never);
    const same = { "x-forwarded-for": "9.9.9.9" };
    for (let i = 0; i < 20; i++) expect((await POST(post({ message: "hi" }, same))).status).toBe(200);
    const res = await POST(post({ message: "hi" }, same));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
