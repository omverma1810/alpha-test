import { afterEach, describe, expect, it, vi } from "vitest";
import { coach } from "@/lib/coach";
import { ModelError, type Generate } from "@/lib/gemini";
import { mockGenerate } from "@/lib/mock";

const plan = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    language: "en",
    risk: "none",
    summary: "Bedtime is hard.",
    steps: ["One", "Two", "Three"],
    check_in: { question: "How did it go?", when: "in 3 days" },
    ...over,
  });

const req = (message: string, extra: Partial<Parameters<typeof coach>[0]> = {}) => ({
  message,
  history: [],
  region: "ae" as const,
  ...extra,
});

describe("coach", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("escalates a crisis without calling the model", async () => {
    const generate = vi.fn<Generate>();
    const reply = await coach(req("My baby is not breathing"), generate);
    expect(generate).not.toHaveBeenCalled();
    expect(reply).toMatchObject({ kind: "escalation", category: "emergency", source: "precheck" });
  });

  it("returns a plan from the model", async () => {
    const reply = await coach(req("Bedtime is a battle"), async () => plan());
    expect(reply).toEqual({
      kind: "plan",
      language: "en",
      risk: "none",
      summary: "Bedtime is hard.",
      steps: ["One", "Two", "Three"],
      checkIn: { question: "How did it go?", when: "in 3 days" },
    });
  });

  it("keeps the detected language even if the model labels it differently", async () => {
    const reply = await coach(req("ابني لا ينام"), async () => plan({ language: "en" }));
    expect(reply.language).toBe("ar");
  });

  it("caps the plan at three steps", async () => {
    const reply = await coach(req("Bedtime"), async () => plan({ steps: ["1", "2", "3", "4"] }));
    expect(reply.kind === "plan" && reply.steps).toEqual(["1", "2", "3"]);
  });

  it("passes the system prompt and only the last 10 turns", async () => {
    const generate = vi.fn<Generate>(async () => plan());
    const history = Array.from({ length: 14 }, (_, i) => ({ role: "parent" as const, text: `turn ${i}` }));
    await coach(req("Bedtime", { history }), generate);
    const arg = generate.mock.calls[0][0];
    expect(arg.system).toContain("parenting coach");
    expect(arg.history).toHaveLength(10);
    expect(arg.history[0].text).toBe("turn 4");
  });

  it("retries once when the model's JSON is malformed", async () => {
    const generate = vi.fn<Generate>().mockResolvedValueOnce("not json").mockResolvedValueOnce(plan());
    const reply = await coach(req("Bedtime"), generate);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(reply.kind).toBe("plan");
  });

  it("gives up after two malformed replies", async () => {
    const generate = vi.fn<Generate>(async () => '{"wrong":"shape"}');
    await expect(coach(req("Bedtime"), generate)).rejects.toThrow("not in the expected format");
  });

  it("escalates when the model flags a crisis the keywords missed", async () => {
    const reply = await coach(req("Something is very wrong at home"), async () => plan({ risk: "crisis" }));
    expect(reply).toMatchObject({ kind: "escalation", category: "general", source: "model" });
  });

  it("passes through a see-a-professional plan", async () => {
    const reply = await coach(req("Does he have ADHD?"), async () => plan({ risk: "see_professional" }));
    expect(reply).toMatchObject({ kind: "plan", risk: "see_professional" });
  });

  it.each([
    ["a dose", { steps: ["Give 5 ml of syrup"] }],
    ["a diagnosis", { summary: "Your son probably has ADHD." }],
  ])("replaces a reply that contains %s", async (_, over) => {
    const reply = await coach(req("Help"), async () => plan(over));
    expect(reply).toMatchObject({ kind: "plan", risk: "see_professional" });
    expect(reply.kind === "plan" && reply.steps.join(" ")).not.toMatch(/ml|ADHD/);
  });

  it("uses the fallback in the parent's language", async () => {
    const reply = await coach(req("میرا بیٹا"), async () => plan({ steps: ["10 mg"] }));
    expect(reply.language).toBe("ur");
    expect(reply.kind === "plan" && reply.summary).toMatch(/ڈاکٹر/);
  });

  it("treats Gemini blocking the prompt as a crisis", async () => {
    const reply = await coach(req("Help"), async () => {
      throw new ModelError("No reply from Gemini (blockReason SAFETY)");
    });
    expect(reply).toMatchObject({ kind: "escalation", source: "model" });
  });

  it("rethrows other model errors", async () => {
    await expect(
      coach(req("Help"), async () => {
        throw new ModelError("Gemini returned 500");
      }),
    ).rejects.toThrow("500");
  });

  it("uses the canned replies when COACH_MOCK=1", async () => {
    vi.stubEnv("COACH_MOCK", "1");
    vi.useFakeTimers();
    const pending = coach(req("Bedtime is a battle"));
    await vi.advanceTimersByTimeAsync(1000);
    const reply = await pending;
    vi.useRealTimers();
    expect(reply).toMatchObject({ kind: "plan", language: "en" });
  });

  it("calls Gemini when not mocked", async () => {
    vi.stubEnv("COACH_MOCK", "0");
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(coach(req("Bedtime"))).rejects.toThrow("GEMINI_API_KEY");
  });
});

describe("mockGenerate", () => {
  it.each([
    ["en", "Bedtime"],
    ["ur", "میرا بیٹا روتا ہے"],
    ["ar", "ابني لا ينام"],
  ])("returns valid %s JSON", async (language, message) => {
    vi.useFakeTimers();
    const pending = mockGenerate({ system: "", history: [], message });
    await vi.advanceTimersByTimeAsync(1000);
    const out = JSON.parse(await pending);
    vi.useRealTimers();
    expect(out.language).toBe(language);
    expect(out.steps.length).toBeGreaterThan(0);
  });
});
