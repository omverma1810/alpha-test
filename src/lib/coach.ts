import { buildEscalation } from "./escalation";
import { generateWithGemini, ModelError, type Generate } from "./gemini";
import { detectLanguage } from "./language";
import { mockGenerate } from "./mock";
import { systemPrompt } from "./prompt";
import { screenForCrisis } from "./safety";
import { extractJson, ModelReplySchema, type CoachRequest, type ModelReply } from "./schema";
import type { ChatTurn, CoachReply, Language, PlanReply } from "./types";

const HISTORY_TURNS = 10;
// How far back a crisis keeps the conversation in "get help" mode.
const CRISIS_MEMORY_TURNS = 6;

/**
 * The history comes from the browser, so it's untrusted: we never assume the
 * client screened it. Re-running the keyword screen over recent parent turns
 * also means a crisis can't be "talked past" with a vague follow-up like
 * "ok, what should I do now?".
 */
function crisisInHistory(history: ChatTurn[]) {
  const recentParent = history.slice(-CRISIS_MEMORY_TURNS).filter((t) => t.role === "parent");
  for (let i = recentParent.length - 1; i >= 0; i--) {
    const hit = screenForCrisis(recentParent[i].text);
    if (hit) return hit;
  }
  return null;
}

/** Gemini expects turns to alternate; fold any back-to-back turns from the same side into one. */
export function toAlternating(history: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const turn of history) {
    const last = out[out.length - 1];
    if (last && last.role === turn.role) last.text = `${last.text}\n\n${turn.text}`;
    else out.push({ ...turn });
  }
  return out;
}

// Last line of defence on the model's output. If a reply slips past the prompt
// with a dose or a diagnosis in it, we don't show it.
const UNSAFE_OUTPUT = [
  /\b\d+(\.\d+)?\s?(mg|ml|mcg|milligrams?|millilitres?|milliliters?|tablets?|drops)\b/i,
  /\b(he|she|they|your (child|son|daughter)) (has|have|probably has|might have|may have|likely has) (adhd|autism|asd|depression|bipolar|ocd|an anxiety disorder|a learning disability)\b/i,
];

const SAFE_FALLBACK: Record<Language, Omit<PlanReply, "kind" | "language">> = {
  en: {
    risk: "see_professional",
    summary: "This is a question for your child's doctor or a specialist, so I'll stay out of the medical side.",
    steps: [
      "Write down what you've noticed, when it happens and for how long.",
      "Book a visit with your child's doctor and take those notes along.",
    ],
    checkIn: { question: "What did the doctor say?", when: "After the appointment" },
  },
  ur: {
    risk: "see_professional",
    summary: "یہ سوال بچے کے ڈاکٹر یا کسی ماہر کا ہے، اس لیے میں طبی پہلو پر رائے نہیں دوں گا۔",
    steps: [
      "جو کچھ آپ نے دیکھا ہے، کب ہوتا ہے اور کتنی دیر، لکھ لیں۔",
      "بچے کے ڈاکٹر سے وقت لیں اور یہ نوٹس ساتھ لے جائیں۔",
    ],
    checkIn: { question: "ڈاکٹر نے کیا کہا؟", when: "ملاقات کے بعد" },
  },
  ar: {
    risk: "see_professional",
    summary: "هذا سؤال يجيب عنه طبيب طفلك أو مختص، لذلك لن أتدخل في الجانب الطبي.",
    steps: [
      "دوّن ما لاحظته، ومتى يحدث، وكم يستمر.",
      "احجز موعدًا مع طبيب طفلك وخذ هذه الملاحظات معك.",
    ],
    checkIn: { question: "ماذا قال الطبيب؟", when: "بعد الموعد" },
  },
  roman_ur: {
    risk: "see_professional",
    summary: "Yeh sawal bachay ke doctor ya kisi mahir ka hai, is liye main medical pehlu par raaye nahi doon ga.",
    steps: [
      "Jo kuch aap ne dekha hai, kab hota hai aur kitni der, likh lein.",
      "Bachay ke doctor se waqt lein aur yeh notes saath le jayein.",
    ],
    checkIn: { question: "Doctor ne kya kaha?", when: "Mulaqat ke baad" },
  },
};

function looksUnsafe(reply: ModelReply): boolean {
  const text = [reply.summary, ...reply.steps].join(" ");
  return UNSAFE_OUTPUT.some((rule) => rule.test(text));
}

async function askModel(generate: Generate, req: CoachRequest, language: Language): Promise<ModelReply> {
  // A parent turn with no reply (say the request failed) gets folded into the new message.
  const turns = toAlternating([...req.history.slice(-HISTORY_TURNS), { role: "parent", text: req.message }]);
  const input = {
    system: systemPrompt(language),
    history: turns.slice(0, -1),
    message: turns[turns.length - 1].text,
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await generate(input);
    try {
      return ModelReplySchema.parse(extractJson(raw));
    } catch (err) {
      lastError = err; // bad JSON or wrong shape, try once more
    }
  }
  throw new ModelError(`Model reply was not in the expected format: ${String(lastError)}`);
}

export async function coach(req: CoachRequest, generate?: Generate): Promise<CoachReply> {
  const language = detectLanguage(req.message);

  // Layer 1: keyword screen. A match never reaches the model.
  const crisis = screenForCrisis(req.message);
  if (crisis) return buildEscalation(crisis.category, language, req.region, "precheck");

  const earlier = crisisInHistory(req.history);
  if (earlier) return buildEscalation(earlier.category, language, req.region, "history");

  const gen = generate ?? (process.env.COACH_MOCK === "1" ? mockGenerate : generateWithGemini);

  let reply: ModelReply;
  try {
    reply = await askModel(gen, req, language);
  } catch (err) {
    // Gemini refusing the prompt outright is itself a strong signal. Treat it as a crisis.
    if (err instanceof ModelError && /blockReason|SAFETY|PROHIBITED/i.test(err.message)) {
      return buildEscalation("general", language, req.region, "model");
    }
    throw err;
  }

  // Layer 2: the model's own risk flag.
  if (reply.risk === "crisis") return buildEscalation("general", language, req.region, "model");

  // Layer 3: output check.
  if (looksUnsafe(reply)) return { kind: "plan", language, ...SAFE_FALLBACK[language] };

  return {
    kind: "plan",
    language,
    risk: reply.risk,
    summary: reply.summary,
    steps: reply.steps.slice(0, 3),
    checkIn: reply.check_in,
  };
}
