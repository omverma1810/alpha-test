# Alpha Kids parenting coach

A parent describes a worry in English, Urdu or Arabic and gets a short plan (two or three steps) plus a check-in. Emergencies, abuse and self-harm get a fixed escalation with helpline numbers instead of advice. Anything that isn't about parenting gets a polite redirect.

Live: https://alpha-test-three.vercel.app

## Run it locally

You need Node 20 or newer and a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) (`gemini-4-argon` needs billing turned on).

```bash
git clone https://github.com/omverma1810/alpha-test.git
cd alpha-test
npm install
cp .env.example .env.local      # paste your key into GEMINI_API_KEY
npm run dev                     # open http://localhost:3000
```

No key? Run `COACH_MOCK=1 npm run dev` for canned replies. The crisis and off-topic checks still run for real.

## Check it

```bash
npm test                 # 194 tests
npm run test:coverage    # fails under 90%
npm run eval             # safety cases, no key needed
npm run build
```

## How it stays safe

1. A keyword screen in English, Urdu, Roman Urdu and Arabic catches emergencies, abuse and self-harm before the model is called, and keeps the conversation in "get help" mode if one came up earlier.
2. Code, SQL, stack traces and "ignore your instructions" are turned away without a model call. The model is told to answer only parenting questions and to return just `{"on_topic":false}` for anything else.
3. The parent's text is fenced in tags so it can't pose as instructions; the reply must be JSON that passes a schema check.
4. Every reply is checked for medicine doses and diagnoses before it's shown.

More detail: [DESIGN.md](DESIGN.md) (architecture, tests, performance) and [SECURITY.md](SECURITY.md).
