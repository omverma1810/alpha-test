import { describe, expect, it } from "vitest";
import { CoachRequestSchema, extractJson, ModelReplySchema } from "@/lib/schema";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses JSON inside a ```json fence", () => {
    expect(extractJson('Here you go:\n```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it("parses JSON with text around it", () => {
    expect(extractJson('Sure! {"a":3} Hope that helps')).toEqual({ a: 3 });
  });

  it("throws when there is no object", () => {
    expect(() => extractJson("no json here")).toThrow("No JSON object");
  });
});

describe("CoachRequestSchema", () => {
  it("fills in defaults", () => {
    expect(CoachRequestSchema.parse({ message: "hi" })).toEqual({ message: "hi", history: [], region: "ae" });
  });

  it("rejects empty and over-long messages", () => {
    expect(CoachRequestSchema.safeParse({ message: "   " }).success).toBe(false);
    expect(CoachRequestSchema.safeParse({ message: "x".repeat(1001) }).success).toBe(false);
  });

  it("strips control characters but keeps line breaks", () => {
    expect(CoachRequestSchema.parse({ message: "a\u0000b\u0007\nc" }).message).toBe("ab\nc");
    expect(CoachRequestSchema.safeParse({ message: "\u0000\u0001" }).success).toBe(false);
  });

  it("rejects unknown regions", () => {
    expect(CoachRequestSchema.safeParse({ message: "hi", region: "us" }).success).toBe(false);
  });
});

describe("ModelReplySchema", () => {
  const valid = {
    language: "en",
    risk: "none",
    summary: "s",
    steps: ["a"],
    check_in: { question: "q", when: "w" },
  };

  it("accepts the short off-topic reply", () => {
    expect(ModelReplySchema.parse({ on_topic: false })).toEqual({ on_topic: false });
  });

  it("accepts a well-formed reply", () => {
    expect(ModelReplySchema.parse(valid)).toEqual(valid);
  });

  it("rejects too many steps and unknown risk levels", () => {
    expect(ModelReplySchema.safeParse({ ...valid, steps: ["1", "2", "3", "4", "5"] }).success).toBe(false);
    expect(ModelReplySchema.safeParse({ ...valid, risk: "high" }).success).toBe(false);
  });
});
