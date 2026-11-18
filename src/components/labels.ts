import type { Language } from "@/lib/types";

export const LABELS: Record<Language, { tryThis: string; checkIn: string; professional: string; call: string; whenLabel: string }> = {
  en: {
    tryThis: "Try this",
    checkIn: "Let's check in",
    professional: "Worth asking a professional",
    call: "Call",
    whenLabel: "When",
  },
  ur: {
    tryThis: "یہ آزمائیں",
    checkIn: "دوبارہ بات کرتے ہیں",
    professional: "کسی ماہر سے پوچھنا بہتر ہے",
    call: "کال کریں",
    whenLabel: "کب",
  },
  roman_ur: {
    tryThis: "Yeh try karein",
    checkIn: "Dobara baat karte hain",
    professional: "Kisi mahir se poochna behtar hai",
    call: "Call karein",
    whenLabel: "Kab",
  },
};
