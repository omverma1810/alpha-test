import { z } from "zod";

const PlanSchema = z.object({
  on_topic: z.literal(true).optional(),
  language: z.enum(["en", "ur", "roman_ur", "ar"]),
  risk: z.enum(["none", "see_professional", "crisis"]),
  summary: z.string().min(1).max(400),
  steps: z.array(z.string().min(1).max(300)).min(1).max(4),
  check_in: z.object({
    question: z.string().max(300),
    when: z.string().max(120),
  }),
});

// Off-topic replies are just the flag, so the model spends almost no tokens on them.
const OffTopicSchema = z.object({ on_topic: z.literal(false) });

export const ModelReplySchema = z.union([OffTopicSchema, PlanSchema]);

export type ModelReply = z.infer<typeof ModelReplySchema>;
export type ModelPlan = z.infer<typeof PlanSchema>;

export const CoachRequestSchema = z.object({
  message: z
    .string()
    // Drop control characters (keep newlines and tabs) before anything else sees the text.
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""))
    .pipe(z.string().trim().min(1, "Type a message first").max(1000, "Please keep it under 1000 characters")),
  history: z
    .array(z.object({ role: z.enum(["parent", "coach"]), text: z.string().max(2000) }))
    .max(40)
    .default([]),
  region: z.enum(["ae", "in", "pk", "other"]).default("ae"),
});

export type CoachRequest = z.infer<typeof CoachRequestSchema>;

/** Models sometimes wrap JSON in ```json fences or add a sentence around it. */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model output");
  return JSON.parse(body.slice(start, end + 1));
}
