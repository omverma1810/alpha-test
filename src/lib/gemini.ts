import type { ChatTurn } from "./types";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class ModelError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export type Generate = (input: { system: string; history: ChatTurn[]; message: string }) => Promise<string>;

/** Calls Gemini's generateContent REST endpoint. Kept as plain fetch so there's nothing hidden. */
export const generateWithGemini: Generate = async ({ system, history, message }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ModelError("GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key.");

  const model = process.env.GEMINI_MODEL || "gemini-4-argon";
  const thinkingLevel = process.env.GEMINI_THINKING_LEVEL || "low";

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "parent" ? "user" : "model",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        // Generous on purpose: thinking tokens count against this, and running
        // out returns an empty reply with finishReason MAX_TOKENS.
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ModelError(`Gemini returned ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    // No candidate usually means the prompt itself was blocked by Gemini's own filters.
    throw new ModelError(`No reply from Gemini (${data?.promptFeedback?.blockReason ?? "unknown reason"})`);
  }

  const text: string = (candidate.content?.parts ?? [])
    .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
    .map((p: { text: string }) => p.text)
    .join("");

  if (!text) throw new ModelError(`Empty reply from Gemini (finishReason: ${candidate.finishReason ?? "unknown"})`);
  return text;
};
