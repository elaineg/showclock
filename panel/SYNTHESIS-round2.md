# showclock — Panel SYNTHESIS round 2

Preview tested: https://showclock-9m9ht32qk-elainegao.vercel.app (run 20260612-214916-daily).

## Score table

| # | Persona | Clarity | Value | Advocacy | Prior addressed | Remaining blocker |
|---|---------|---------|-------|----------|-----------------|-------------------|
| 1 | Priya | Yes | Yes | **9** ✅ | Yes | none blocking (kbd shortcuts fixed) |
| 2 | Marcus | Yes | Yes | 8 | Yes | past-start time renders scary "493 min behind"; (live mirror accepted as backend limit) |
| 3 | Wen | Yes | Yes | 8 | Yes | on-screen label shows "teaser" not her typed "90 second teaser" (raw text IS preserved in link) |
| 4 | Tomás | Yes | Yes | **9** ✅ | Yes | none blocking (cold drift fixed); wants pause/over-time cue for a 10 |
| 5 | Dana | Yes | Yes | **9** ✅ | Yes | none blocking (demo fixed) |
| 6 | Jules | Yes | Yes | 8 | Yes | co-host sync still needs a re-sent link per segment (wants true live mirror) |
| 7 | Aisha | Yes | Yes | 8 | **Partly** | **"Copied!" confirmation never appeared on deployed build** (clipboard filled, no UI feedback) |
| 8 | Rob | Yes | Yes | 7 | Partly | persona-inherent: runs paced sessions only 2–3×/month; phone glance competes |
| 9 | Elena | Yes | Yes | 8 | **Partly** | **"Copied!" confirmation still missing** (only open blocker; reusable-agenda fix verified good) |
| 10 | Sam | Yes | Yes | 8 | **Partly** | **"Copied!" confirmation still absent** (only open blocker; drift badge fix landed perfectly) |

**3/10 at advocacy ≥9 (up from 0/10). Exit bar 9/10 not met.**

## Complaints grouped by cause

### H1 — "Copied!" confirmation broken on the deployed build (GATING; recurs: T7, T9, T10)
THE dominant issue. Three testers independently report the copy button's clipboard write
succeeds but the "Copied!" label/feedback never appears. The round-2 verifier observed the flip
in a permissive (clipboard-granted) environment; the testers' browsers rejected the async
`navigator.clipboard.writeText()` and the `.then()` that sets the "Copied!" state never ran — no
fallback. For Elena and Sam this is their ONLY remaining blocker; for Aisha it's the last open
one. Fix robustly: set the "Copied!" state on click independent of the async result, AND add an
execCommand/textarea fallback so the copy itself also succeeds where the async API is blocked.
This one fix should convert 3 testers.

### H2 — Past-start-time drift scare (T2; same class as round-1 G4, different path)
Marcus set a start time in the past and the running view screamed "493 min behind" with no
guardrail. G4 fixed the pre-Start cold landing, but a past start time at/after Start still
produces an alarming number. Fix: when the chosen start is in the past, either warn + offer to
snap start to "now", or cap/sanely-frame the behind display. Removes Marcus's only fixable
blocker (he's accepted that true live mirror needs a backend we don't have).

### H3 — On-screen label is the parsed name, not the verbatim typed line (T3, minor)
Wen typed "90 second teaser"; the row shows "teaser" (correct parse: name=teaser, dur=90s). She
concedes it's cosmetic and the raw text is preserved in the share link, but a data-hygiene user
notices the displayed label isn't a verbatim echo. Cheap nicety: surface the parsed duration
inline on the row (e.g. "teaser · 1m30s") so the user sees their full input was understood, not
silently shortened. Low priority.

### H4 — Badge calm vs. shouty (T7, watch)
Aisha called the now-dominant drift badge "one notch from shouty." Keep it the dominant glanceable
element (don't regress G2) but ensure weight/sizing reads calm, not alarming — she judges craft hard.

## Persona-inherent holdouts (structural ceiling)
- **Jules (8)** — wants a true live co-host mirror; impossible without a sync backend (explicit
  out-of-scope). Snapshot framing fully resolved her *confusion* but not her *wish*.
- **Rob (7)** — frequency: 2–3 paced sessions/month. Value=Yes, polish acknowledged, but his
  recurrence is just lower than the weekly personas. Not addressable by polish.

These two are the realistic risk to the 9/10 bar. After fixing H1–H3 the convertible set is
T1,T4,T5 (already 9) + T7,T9,T10 (copy) + T2 (past-start) + T3 (label) = up to 8 at ≥9, with
Jules and Rob as the two holdouts. If round 3 lands there and round 4 can't move a holdout, this
is a plateau at 8/10 driven by one out-of-scope feature wish + one low-frequency persona.

## Plan for round 3
1. builder fixes H1 (robust copy + confirmation), H2 (past-start guardrail), H3 (inline parsed
   duration on row), H4 (calm badge weight). Existing 28 tests stay green; add a copy-fallback test.
2. verifier: regression + LIVE confirm the "Copied!" feedback fires even when clipboard API is
   blocked (the exact failure mode the testers hit), + past-start guardrail.
3. Re-test (delta): T7, T9, T10 (copy), T2 (past-start), T3 (label). Carry forward T1, T4, T5 (9,
   untouched-and-passing). Carry T6 (8) and T8 (7) — fixes don't touch their blockers.
