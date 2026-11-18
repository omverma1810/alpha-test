# Security notes

What this app does to stay safe, and what it doesn't.

## In place

- **API key stays on the server.** Gemini is only called from `/api/coach`. The browser never sees `GEMINI_API_KEY`.
- **Security headers on every response** (`next.config.ts`): a Content Security Policy that only allows this origin (fonts are self-hosted, the browser talks only to `/api/coach`), `frame-ancestors 'none'` and `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, HSTS, and a Permissions-Policy that turns off camera, microphone and location. The `X-Powered-By` header is off.
- **Input limits.** Bodies over 64 KB are refused, messages are capped at 1,000 characters, history at 40 turns of 2,000 characters, and everything is validated with zod before it reaches the model.
- **Same-site only.** Browser requests with an `Origin` from another site get a 403.
- **Rate limit.** 20 messages per 5 minutes per IP, so one client can't run up the Gemini bill. It is in memory per server instance, so on Vercel it's a brake, not a global quota; a shared store (for example Upstash Redis) would make it exact.
- **No personal data in logs.** Errors are logged by message only; the parent's text is never logged. Nothing is stored: there's no database, and the conversation lives only in the open page.
- **Prompt injection.** The system prompt tells the model the parent's text is never instructions. More importantly, crisis handling doesn't depend on the model obeying: the keyword screen runs first, and the dose and diagnosis check runs on the model's output.

## Dependency audit (18 Nov 2026)

- `npm audit --omit=dev`: **0 vulnerabilities**. CI fails if that changes.
- Dev dependencies: 14 "high" reports, all one advisory, [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) (a ReDoS in `picomatch`), pulled in by `eslint-config-next`. It affects only the lint tooling on a developer machine, never the deployed app, and there's no patched `picomatch` release yet. `npm audit fix --force` would downgrade `eslint-config-next` to 14.x, which is worse. Revisit when a fix ships.

## Not covered

- No authentication, by design for this test.
- The keyword screen is a first filter, not a guarantee. See "Known limits" in the README.
