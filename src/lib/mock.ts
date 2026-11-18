import type { Generate } from "./gemini";

/**
 * Canned replies for COACH_MOCK=1, so the UI can be tried without a key.
 * The crisis screen in front of it is the real one.
 */
export const mockGenerate: Generate = async ({ message }) => {
  await new Promise((r) => setTimeout(r, 700));
  const urdu = /[؀-ۿ]/.test(message);
  if (urdu) {
    return JSON.stringify({
      language: "ur",
      risk: "none",
      summary: "آپ کا بچہ ایک بدلاؤ سے گزر رہا ہے اور اسے تھوڑی تسلی کی ضرورت ہے۔",
      steps: [
        "ہر صبح ایک جیسا مختصر الوداع کا طریقہ رکھیں، جیسے گلے ملنا اور ایک خاص جملہ۔",
        "رات کو سونے سے پہلے اگلے دن کی ایک اچھی بات کے بارے میں بات کریں۔",
      ],
      check_in: { question: "کیا صبح کا رونا کچھ کم ہوا؟", when: "ایک ہفتے بعد" },
    });
  }
  return JSON.stringify({
    language: "en",
    risk: "none",
    summary: "Bedtime is turning into a power struggle, and you'd like evenings to feel calmer.",
    steps: [
      "Start a 20-minute wind-down at the same time each night: bath, pyjamas, one book.",
      "Give two choices you're happy with, like which pyjamas or which book.",
      "Keep your voice low and boring if they protest. Repeat one calm line.",
    ],
    check_in: { question: "How many nights this week ended without a meltdown?", when: "In 5 days" },
  });
};
