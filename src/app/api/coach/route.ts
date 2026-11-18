import { coach } from "@/lib/coach";
import { ModelError } from "@/lib/gemini";
import { clientKey, createLimiter } from "@/lib/rateLimit";
import { CoachRequestSchema } from "@/lib/schema";

// Leave room for one model call plus a retry on a malformed reply.
export const maxDuration = 60;

const MAX_BODY_BYTES = 64 * 1024;
// 20 messages per 5 minutes per IP is plenty for a real parent and stops a script.
const limiter = createLimiter(20, 5 * 60 * 1000);

function json(body: unknown, status: number, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
}

/** Browsers send Origin on cross-site POSTs; reject anything that isn't this site. */
function isForeignOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  if (isForeignOrigin(request)) return json({ error: "Requests must come from this site." }, 403);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 413);

  const { ok, retryAfter } = limiter.check(clientKey(request));
  if (!ok) {
    return json({ error: "Too many messages in a short time. Please wait a minute and try again." }, 429, {
      "retry-after": String(retryAfter),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, 400);
  }

  const parsed = CoachRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, 400);
  }

  try {
    const reply = await coach(parsed.data);
    return json({ reply }, 200);
  } catch (err) {
    // Log the error only, never the parent's message.
    console.error("[coach]", err instanceof Error ? err.message : err);
    const missingKey = err instanceof ModelError && err.message.includes("GEMINI_API_KEY");
    return json(
      {
        error: missingKey
          ? "The coach isn't set up yet: GEMINI_API_KEY is missing on the server."
          : "The coach couldn't reply just now. Please send your message again.",
      },
      missingKey ? 500 : 502,
    );
  }
}
