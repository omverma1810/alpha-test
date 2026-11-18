# Parenting coach (Alpha Kids test)

Live: https://alpha-test-om-vermas-projects.vercel.app

A small Next.js app where a parent describes a worry in English, Urdu (script or Roman) or Arabic and gets a short, structured plan back: one line that shows the worry was understood, two or three steps to try, and a check-in (a question, or a time to come back). If the parent describes an emergency, abuse or self-harm, the coach doesn't coach. It shows a fixed, hand-written escalation with helpline numbers for the selected country.

No login, no database. The conversation lives in the page and is sent along with each message.

## Run it

Needs Node 20+ and a Gemini API key. `gemini-4-argon` is paid-tier only, so the key needs a Google AI Studio project with billing on.

```bash
npm install
cp .env.example .env.local     # then paste your key into GEMINI_API_KEY
npm run dev                    # http://localhost:3000
```

No key yet? `COACH_MOCK=1 npm run dev` runs the UI with canned replies. The crisis screen still runs for real, so the escalation path can be tried without a key.

## How a message is handled

```
parent message
  │
  ├─ 1. keyword screen (src/lib/safety.ts) ─ match ─► fixed escalation reply, model never called
  │
  ├─ 2. Gemini, with the rules in the system prompt, asked for JSON only
  │      └─ reply validated with zod; one retry if the shape is wrong
  │
  ├─ 3. model sets risk = "crisis" ───────────────────► same fixed escalation reply
  │
  ├─ 4. output check: a dose or a diagnosis in the text ► safe "see a professional" reply
  │
  └─ plan card: summary · steps · check-in
```

Why the layers: a prompt alone isn't a safety system. The keyword screen catches the obvious crises in English, Urdu script, Roman Urdu and Arabic (MSA and common Gulf phrasing) without depending on the model at all, and it's tuned to over-trigger rather than miss (a parent seeing helpline numbers by mistake is a much smaller problem than the opposite). The model gets a second look at everything that passes, and the output check catches the two things the coach must never say, even if the model slips.

Crisis replies are templates in `src/lib/escalation.ts`, not generated text, so they read the same calm way every time. Helpline numbers live in one file, `src/lib/helplines.ts`, with the sources they were checked against.

## Checks

```bash
npm run eval            # keyword screen + language detection, no key needed
npm run eval -- --live  # every case through the full pipeline, including Gemini
npm run eval -- --url=https://alpha-test-om-vermas-projects.vercel.app   # same, against the deployed app
```

32 cases: everyday worries (including the tricky "my son hits his sister", in English and Arabic, which must not count as abuse), requests for a diagnosis, a medicine dose and legal advice, a prompt-injection attempt, and crises in English, Urdu, Roman Urdu and Arabic. On 18 Nov 2026 all 32 passed offline and all 32 passed live against the deployed app with `gemini-4-argon`. For `--live` locally, load the key first with `set -a; . ./.env.local; set +a`.

## Tests and CI

```bash
npm test                # 151 unit and component tests (Vitest + Testing Library)
npm run test:coverage   # same, fails under 90% on lines, branches, functions or statements
npm run typecheck
npx eslint . --max-warnings=0
```

Coverage on 18 Nov 2026: 99% of statements and lines, 97.6% of branches, 100% of functions. The tests cover the keyword screen in all four languages, the full coach pipeline with a fake model (retries, the model's crisis flag, the dose and diagnosis check, Gemini refusing a prompt), the Gemini client with a mocked `fetch`, the API route (validation, same-site check, size limit, rate limit, error handling) and the UI (sending, history, errors, right-to-left layout, tap-to-call numbers).

GitHub Actions (`.github/workflows/ci.yml`) runs lint, type check, tests with coverage, the safety eval and a production build on every push and pull request, plus a dependency audit that fails on any vulnerability in production dependencies.

## Security and performance

See [SECURITY.md](SECURITY.md) for headers, limits, logging and the dependency audit.

Lighthouse (mobile, simulated slow 4G, production build): performance 90 to 94, accessibility, best practices and SEO all 100. The Urdu and Arabic fonts are the heaviest files on the page, so they load at one weight only and aren't preloaded.

## Layout

```
src/app/api/coach/route.ts   POST endpoint, input validation
src/lib/coach.ts             the pipeline above
src/lib/safety.ts            keyword screen
src/lib/escalation.ts        crisis templates (en / ur / roman_ur / ar)
src/lib/helplines.ts         numbers per country, with sources
src/lib/rateLimit.ts         per-IP limiter for the API
src/lib/prompt.ts            system prompt
src/lib/gemini.ts            Gemini REST call
src/components/              chat UI, plan card, escalation card
scripts/eval.ts              the safety eval (offline, --live, or --url)
tests/                       Vitest suite
```

## Known limits

- The keyword screen is a first filter, not a classifier. It will miss crises phrased in ways it hasn't seen, which is why the model check sits behind it, and it will sometimes flag a message that's fine.
- Helpline numbers were checked on 18 Nov 2026 and need re-checking before any real launch. India's 112 and 1098 are the national numbers but weren't checked against an official page for this build.
- The Urdu, Roman Urdu and Arabic escalation copy should be read by native speakers before real use.
- Urdu and Arabic share a script. The app tells them apart by letters only one of them uses (ٹ ڈ ں ے for Urdu, ة ي ك for Arabic), so Urdu typed on an Arabic keyboard can come back in Arabic.
- History is trimmed to the last 10 turns and is lost on refresh, as intended for this test.
