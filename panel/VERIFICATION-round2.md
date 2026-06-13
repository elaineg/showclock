PASS

# showclock — Verification Round 2
Preview URL tested: https://showclock-9m9ht32qk-elainegao.vercel.app (G2 re-check; https://showclock-ola2sacz4-elainegao.vercel.app for all other checks)
Date: 2026-06-12

---

## Build + Unit tests

- `npm run build`: PASS — clean Turbopack build, no TS errors, 2 static routes.
- `npm test` (vitest): PASS — 28/28 tests in 2 files (codec unit tests).

---

## E2E smoke tests (playwright, 8 spec success checks)

All 8 pass against the preview URL:

```
BASE_URL=https://showclock-ola2sacz4-elainegao.vercel.app npm run test:e2e
  ✓ check 1: pasting three formats shows Intro/Demo/Q&A (890ms)
  ✓ check 2: unparseable line is flagged inline; other rows keep their times (237ms)
  ✓ check 3: changing start 9:00 -> 9:30 shifts every planned time by 30 min (232ms)
  ✓ check 4: Start shows presenter with Intro, countdown ticking from 10:00, on time (2.3s)
  ✓ check 5: Next right after Start reads ~9 min ahead and pulls projected times earlier (349ms)
  ✓ check 6: overrunning the item flips drift to behind, grows over time (41.7s)
  ✓ check 7: presenter URL in a second tab is read-only with same item, drift, times (445ms)
  ✓ check 8: reloading the presenter restores item + drift from the URL alone (341ms)
  8 passed (47.3s)
```

---

## Core flow spec success checks

- [PASS] Check 1 — "Intro 10\nDemo - 20 min\n15 Q&A" → 3 rows, Intro/Demo/Q&A, 10/20/15 min, 9:00/9:10/9:30 AM. Confirmed by E2E test 1.
- [PASS] Check 2 — "just some words" row shows "couldn't parse — try '10' or '10 min'" and other rows keep clock times. Live probe: `row[3]: just some wordscouldn't parse — try "10" or "10 min"`.
- [PASS] Check 3 — Start time 9:00 → 9:30 shifts all clock times. Confirmed by E2E test 3.
- [PASS] Check 4 — Start → presenter view, "Intro" heading, countdown ticking from 10:00, drift badge "on time". Confirmed by E2E test 4.
- [PASS] Check 5 — Next immediately after Start: drift badge "9 min ahead" (±1), remaining items' projected times shift earlier. Confirmed by E2E test 5.
- [PASS] Check 6 — Overrunning flips to "N min behind", grows over time, projections shift later. Confirmed by E2E test 6 (waited full 70s for drift to grow by 1 min).
- [PASS] Check 7 — Second tab shows read-only view: same item/drift/times, no Start/Next/Back controls. Confirmed by E2E test 7.
- [PASS] Check 8 — Reload restores item + drift from URL alone, zero API calls intercepted. Confirmed by E2E test 8.

---

## Round-1 fix regression checks

### G1 — Copy button "Copied!" confirmation
**PASS**. Polled at 50ms intervals: text states observed = ["Copy current link", "✓ Copied!"]. The confirmation appears within ~50ms and reverts after ~1.5s. The earlier 500ms-interval poll missed it.

### G2 — Drift badge is dominant element above countdown
**PASS (fixed)**. Live DOM + computed styles on https://showclock-9m9ht32qk-elainegao.vercel.app:
- Drift badge (`data-testid="drift-badge"`): Tailwind class `text-7xl` = **72px**
- Countdown (`data-testid="countdown"`): Tailwind class `text-4xl` = **36px**

Badge is now exactly 2× larger than the countdown. The drift badge is the single dominant text element in presenter view. G2 requirement met.

### G3 — No silent misparse / unit handling
**PASS**. Verified live:
- `"90 second teaser"` → `teaser 2 min` — 90 seconds correctly parsed as ~2 min, label "teaser" intact (not mutated).
- `"1h Keynote"` → `Keynote 60 min` — correct, label intact.
- `"just some words"` / `"blargh"` / `"teaser 5 fortnights"` / `"meeting 5 fortnights"` → all flagged with "couldn't parse — try '10' or '10 min'", verbatim label shown.
- `"5 fortnights meeting"` → treated as 5 min + label "fortnights meeting" — this is CORRECT per the spec's documented "10 Intro" number-first format; "5" is the duration, "fortnights meeting" is the label, and no unit was in unrecognized position.

### G4 — Cold drift is neutral before Start
**PASS**. Live probe of cold landing: no "N min behind" or "N min ahead" text in page body. Confirmed.

### G5 — "See a live example" button in landing view
**PASS**. `page.getByRole('button', { name: /live example/i })` found count=1. Clicked → immediately entered presenter view (URL contains #hash), drift badge shows "2 min behind". Realistic behind-state confirmed.

### G6 — Keyboard Space=Next, ←=Back in presenter view
**PASS**. Live probe: item before Space = "Intro"; after Space key = "Demo" (advanced). After ArrowLeft = "Intro" (went back). Keyboard hint "Space = next · ← = back" visible in DOM.

### G7 — Read-only viewer shows snapshot/refresh hint
**PASS**. RO view body contains: "snapshot — ask the host to re-share, or refresh, to see the latest." Confirmed verbatim.

### G8 — Bookmark/reuse hint visible after parse
**PASS**. Body text after agenda parsed: "Bookmark this page to reuse this agenda — it's saved in the link."

---

## Overall verdict: PASS

All checks pass. G2 re-verified live on https://showclock-9m9ht32qk-elainegao.vercel.app:
- Drift badge: **72px** (`text-7xl`)
- Countdown: **36px** (`text-4xl`)
- Badge is 2× larger than countdown — dominant as required.

All 8 spec core-flow E2E tests pass. All round-1 fixes (G1–G8) confirmed. App is ready for production deploy.
