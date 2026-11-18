import { describe, expect, it } from "vitest";
import { buildEscalation } from "@/lib/escalation";
import { helplinesFor, REGIONS } from "@/lib/helplines";
import type { CrisisCategory, Language, Region } from "@/lib/types";

const languages: Language[] = ["en", "ur", "roman_ur", "ar"];
const categories: CrisisCategory[] = ["emergency", "abuse", "self_harm", "general"];
const regions: Region[] = ["ae", "in", "pk", "other"];

describe("buildEscalation", () => {
  it.each(languages.flatMap((l) => categories.map((c) => [l, c] as const)))("%s / %s has full copy", (language, category) => {
    const reply = buildEscalation(category, language, "ae", "precheck");
    expect(reply).toMatchObject({ kind: "escalation", language, category, source: "precheck" });
    expect(reply.title).not.toBe("");
    expect(reply.message).not.toBe("");
    expect(reply.steps.length).toBeGreaterThanOrEqual(2);
    expect(reply.checkIn.question).not.toBe("");
    expect(reply.helplines.length).toBeGreaterThan(0);
  });
});

describe("helplines", () => {
  it("gives every region and category at least one entry", () => {
    for (const r of regions) for (const c of categories) expect(helplinesFor(r, c).length).toBeGreaterThan(0);
  });

  it("uses the UAE ambulance and police numbers", () => {
    expect(helplinesFor("ae", "emergency").map((h) => h.number)).toEqual(["998", "999"]);
  });

  it("points people elsewhere to their local number instead of guessing one", () => {
    expect(helplinesFor("other", "emergency")[0].number).toBe("");
  });

  it("lists every region in the picker", () => {
    expect(REGIONS.map((r) => r.value).sort()).toEqual([...regions].sort());
  });
});
