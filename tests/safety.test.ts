import { describe, expect, it } from "vitest";
import { detectLanguage, isRtl, scriptClass } from "@/lib/language";
import { normalize, screenForCrisis } from "@/lib/safety";
import { CASES } from "./cases";

describe("crisis screen", () => {
  it.each(CASES.filter((c) => c.screen !== undefined))("$text", ({ text, screen }) => {
    expect(screenForCrisis(text)?.category ?? null).toBe(screen);
  });

  it("prefers emergency when a message also mentions self-harm", () => {
    expect(screenForCrisis("She took a whole bottle of pills and says she wants to die")?.category).toBe("emergency");
  });

  it("doesn't treat taking normal medicine as an overdose", () => {
    expect(screenForCrisis("She took her medicine after breakfast and was fine")).toBeNull();
    expect(screenForCrisis("I think he overdosed on my sleeping pills")?.category).toBe("emergency");
  });

  it("does not flag the Arabic word for 'name' as poison", () => {
    expect(screenForCrisis("ما اسم هذه اللعبة؟")).toBeNull();
  });

  it("catches poison as a whole Arabic word", () => {
    expect(screenForCrisis("ابني شرب سم")?.category).toBe("emergency");
  });

  it("catches a parent afraid of hurting the baby", () => {
    expect(screenForCrisis("I'm scared I will hurt my baby, she won't stop crying")?.category).toBe("abuse");
  });
});

describe("normalize", () => {
  it("lowercases, unifies apostrophes and collapses spaces", () => {
    expect(normalize("  He WON’T   wake   up ")).toBe("he won't wake up");
  });

  it("maps Arabic letter forms to one shape and drops diacritics", () => {
    expect(normalize("أَمْيَرة")).toBe("امیره");
    expect(normalize("كتاب")).toBe("کتاب");
  });
});

describe("language detection", () => {
  it.each(CASES.filter((c) => c.lang))("$lang: $text", ({ text, lang }) => {
    expect(detectLanguage(text)).toBe(lang);
  });

  it("treats a single Roman Urdu-looking word as English", () => {
    expect(detectLanguage("My son says hai to everyone")).toBe("en");
  });

  it("knows which text is right-to-left and which font it needs", () => {
    expect(isRtl("hello")).toBe(false);
    expect(scriptClass("hello")).toBe("");
    expect(scriptClass("میرا بیٹا")).toBe("urdu");
    expect(scriptClass("ابني لا ينام")).toBe("arabic");
  });
});
