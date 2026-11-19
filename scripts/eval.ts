/**
 * npm run eval            -> checks the keyword screen and language detection (no API key needed)
 * npm run eval -- --live  -> also sends each case to Gemini through the real coach() path
 * npm run eval -- --url=https://your-app.vercel.app  -> same live checks against a deployed app
 *
 * Load your key first for --live, e.g.  set -a; . ./.env.local; set +a
 */
import { coach } from "../src/lib/coach";
import { detectLanguage } from "../src/lib/language";
import { screenForCrisis } from "../src/lib/safety";
import type { CoachReply } from "../src/lib/types";

import { CASES, type Expect } from "../tests/cases";

function kindOf(reply: CoachReply): Expect {
  if (reply.kind === "escalation") return "escalation";
  if (reply.kind === "off_topic") return "off_topic";
  return reply.risk === "see_professional" ? "professional" : "plan";
}

async function viaHttp(baseUrl: string, message: string): Promise<CoachReply> {
  const res = await fetch(`${baseUrl}/api/coach`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, history: [], region: "ae" }),
  });
  // The API allows 20 messages per 5 minutes per IP; wait it out rather than fail.
  if (res.status === 429) {
    const wait = Number(res.headers.get("retry-after") ?? 60);
    console.log(`      (rate limited, waiting ${wait}s)`);
    await new Promise((r) => setTimeout(r, (wait + 1) * 1000));
    return viaHttp(baseUrl, message);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${data.error}`);
  return data.reply;
}

function indent(reply: CoachReply): string {
  if (reply.kind === "off_topic") return `      ${reply.message}`;
  const lines = reply.kind === "plan" ? [reply.summary, ...reply.steps.map((s) => `- ${s}`)] : [reply.title, reply.message];
  lines.push(`check-in: ${reply.checkIn.question} | ${reply.checkIn.when}`);
  return lines.map((l) => `      ${l}`).join("\n");
}

async function main() {
  const urlArg = process.argv.find((a) => a.startsWith("--url="));
  const baseUrl = urlArg?.slice("--url=".length).replace(/\/$/, "");
  const live = process.argv.includes("--live") || Boolean(baseUrl);
  const verbose = process.argv.includes("--verbose");
  let failures = 0;

  console.log("Offline checks (keyword screen + language)\n");
  for (const c of CASES) {
    const hit = screenForCrisis(c.text)?.category ?? null;
    const lang = detectLanguage(c.text);
    const screenOk = c.screen === undefined || hit === c.screen;
    const langOk = !c.lang || lang === c.lang;
    const ok = screenOk && langOk;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  screen=${hit ?? "-"}  lang=${lang}  ${c.text}`);
  }

  if (live) {
    if (!baseUrl && !process.env.GEMINI_API_KEY) throw new Error("--live needs GEMINI_API_KEY in the environment");
    console.log(`\nLive checks (full coach pipeline through Gemini${baseUrl ? ` at ${baseUrl}` : ""})\n`);
    for (const c of CASES) {
      try {
        const reply = baseUrl ? await viaHttp(baseUrl, c.text) : await coach({ message: c.text, history: [], region: "ae" });
        const got = kindOf(reply);
        // A plan case that comes back as "professional" is a soft miss, not a safety failure.
        const ok = got === c.expect || (c.expect === "plan" && got === "professional");
        if (!ok) failures++;
        console.log(`${ok ? "PASS" : "FAIL"}  expected=${c.expect}  got=${got}  lang=${reply.language}  ${c.text}`);
        if (verbose) console.log(indent(reply));
      } catch (err) {
        failures++;
        console.log(`ERROR ${c.text}\n      ${String(err)}`);
      }
    }
  }

  console.log(`\n${failures === 0 ? "All checks passed" : `${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
