import type { Language } from "./types";

// Urdu is written in Arabic script. Anything in that block means the parent wrote in Urdu script.
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

// Common Roman Urdu words. Two or more hits and we treat the message as Roman Urdu.
const ROMAN_URDU_WORDS = [
  "mera", "meri", "mere", "beta", "beti", "bacha", "bachay", "bachi", "nahi", "nahin",
  "hai", "hain", "karta", "karti", "karna", "kya", "kaise", "kyun", "bohat", "bahut",
  "khana", "sota", "soti", "rota", "roti", "ziddi", "baat", "mujhe", "hum",
  "aur", "lekin", "abhi", "kuch", "sath", "saath", "ammi", "abbu",
];

export function detectLanguage(text: string): Language {
  if (ARABIC_SCRIPT.test(text)) return "ur";
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const hits = words.filter((w) => ROMAN_URDU_WORDS.includes(w)).length;
  return hits >= 2 ? "roman_ur" : "en";
}

export function isRtl(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}
