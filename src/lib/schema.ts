import { z } from "zod";

export const ModelReplySchema = z.object({
  language: z.enum(["en", "ur", "roman_ur"]),
  risk: z.enum(["none", "see_professional", "crisis"]),
  summary: z.string().min(1).max(400),
  steps: z.array(z.string().min(1).max(300)).min(1).max(4),
  check_in: z.object({
    question: z.string().max(300),
    when: z.string().max(120),
  }),
});

export type ModelReply = z.infer<typeof ModelReplySchema>;

export const CoachRequestSchema = z.object({
  message: z.string().trim().min(1, "Type a message first").max(1000, "Please keep it under 1000 characters"),
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
