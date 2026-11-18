import { coach } from "@/lib/coach";
import { ModelError } from "@/lib/gemini";
import { CoachRequestSchema } from "@/lib/schema";

// Leave room for one model call plus a retry on a malformed reply.
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = CoachRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const reply = await coach(parsed.data);
    return Response.json({ reply });
  } catch (err) {
    console.error("[coach]", err);
    const missingKey = err instanceof ModelError && err.message.includes("GEMINI_API_KEY");
    return Response.json(
      {
        error: missingKey
          ? "The coach isn't set up yet: GEMINI_API_KEY is missing on the server."
          : "I couldn't put a reply together just now. Please try again in a moment.",
      },
      { status: missingKey ? 500 : 502 },
    );
  }
}
