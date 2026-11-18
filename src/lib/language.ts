import type { Language } from "./types";

// Urdu and Arabic share one script, so the block alone can't tell them apart.
const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Letters only Urdu uses (ٹ ڈ ڑ ں ے ھ ہ, plus the Urdu forms of ye and kaf)...
const URDU_ONLY = /[\u0679\u0688\u0691\u06BA\u06D2\u06BE\u06C1\u06CC\u06A9\u06AF]/g;
// ...and letters Urdu writers don't (Arabic ye, kaf, teh marbuta, alef maqsura, hamza on alef).
const ARABIC_ONLY = /[\u064A\u0643\u0629\u0649\u0623\u0625]/g;

// Common Roman Urdu words. Two or more hits and we treat the message as Roman Urdu.
const ROMAN_URDU_WORDS = [
  "mera", "meri", "mere", "beta", "beti", "bacha", "bachay", "bachi", "nahi", "nahin",
  "hai", "hain", "karta", "karti", "karna", "kya", "kaise", "kyun", "bohat", "bahut",
  "khana", "sota", "soti", "rota", "roti", "ziddi", "baat", "mujhe", "hum",
  "aur", "lekin", "abhi", "kuch", "sath", "saath", "ammi", "abbu",
];

export function detectLanguage(text: string): Language {
  if (ARABIC_SCRIPT.test(text)) {
    const urdu = text.match(URDU_ONLY)?.length ?? 0;
    const arabic = text.match(ARABIC_ONLY)?.length ?? 0;
    return arabic > urdu ? "ar" : "ur";
  }
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const hits = words.filter((w) => ROMAN_URDU_WORDS.includes(w)).length;
  return hits >= 2 ? "roman_ur" : "en";
}

export function isRtl(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}

/** CSS class for the right script font, or "" for Latin text. */
export function scriptClass(text: string): string {
  if (!isRtl(text)) return "";
  return detectLanguage(text) === "ar" ? "arabic" : "urdu";
}
