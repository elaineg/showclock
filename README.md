# Showclock

A paste-and-go run-of-show timer for workshop facilitators and event MCs. Paste a
free-text agenda ("Intro 10", "Demo - 20 min", "15 Q&A"), pick a start time, hit Start,
and always know whether you are ahead or behind — with the remaining items' clock times
auto-reflowed by the current drift.

- No accounts, no backend: the entire session (agenda, start time, actual Next/Back
  timestamps) is base64url-encoded into the URL hash.
- Reloading the presenter tab restores the running session from the URL alone.
- Copying the URL into another tab or device gives a read-only co-facilitator snapshot
  (same item, countdown, drift, reflowed times — no controls).

See `APP_SPEC.md` for the full spec and success checks.

## Develop

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm test           # vitest unit tests (parser + schedule math)
```

End-to-end smoke of the spec's success checks (needs a running server):

```bash
npm run build && npm run start -- -p 3217 &
node e2e-smoke.mjs            # or BASE_URL=... node e2e-smoke.mjs
```
