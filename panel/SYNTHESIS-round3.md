# showclock — Panel SYNTHESIS round 3

Preview tested: https://showclock-nyjvtasxf-elainegao.vercel.app (run 20260612-214916-daily).

## Score table (carried = not re-tested this round; verdict held from round 2)

| # | Persona | Clarity | Value | Advocacy | Prior addressed | Note |
|---|---------|---------|-------|----------|-----------------|------|
| 1 | Priya | Yes | Yes | **9** ✅ | — | carried (round 2) |
| 2 | Marcus | Yes | Yes | **9** ✅ | Yes | past-start snap fix → 8→9 |
| 3 | Wen | Yes | Yes | **9** ✅ | Yes | inline parsed duration → 8→9 |
| 4 | Tomás | Yes | Yes | **9** ✅ | — | carried (round 2) |
| 5 | Dana | Yes | Yes | **9** ✅ | — | carried (round 2) |
| 6 | Jules | Yes | Yes | **9** ✅ | Yes | released the live-mirror cap; polish → 8→9 |
| 7 | Aisha | Yes | Yes | **9** ✅ | Yes | copy confirm + calm badge → 8→9 |
| 8 | Rob | Yes | Yes | 8 | Partly | frequency-inherent (2–3/mo); 7→8; value=Yes, "mention not evangelize" |
| 9 | Elena | Yes | Yes | **9** ✅ | Yes | copy confirm verified live on phone+desktop → 8→9 |
| 10 | Sam | Yes | Yes | **8** | **No** | copy "Copied!" feedback did not appear for him on the live build |

**8/10 at advocacy ≥9. Exit bar 9/10 not met — held by Sam (fixable) + Rob (persona-inherent).**

## The one fixable blocker keeping us from 9/10: Sam's copy confirmation (I1)
Sam pasted his own agenda, hit Start (a LIVE ticking session), clicked "Copy current link", and
polled the **button's own label** every 60ms for 2.5s across two clicks — it never changed from
"Copy current link". The clipboard DID receive the URL; there was just no visible feedback on the
button he clicked. He found "no aria-live element anywhere."

Yet Aisha (50ms poll, held ~1.4s), Elena (phone + desktop, saw green "✓ Copied!"), and the
round-3 verifier (normal AND blocked-clipboard paths) all confirmed the confirmation fires. So the
confirmation works in some paths but Sam — watching the clicked button's own text in a running
session — got nothing. Likely cause: the "✓ Copied!" renders as a separate/adjacent element or
icon rather than swapping the clicked button's OWN label, so a user fixated on the button he
pressed can miss it; and/or the per-second presenter re-render clobbers the transient state in the
live-paste path. Either way it's unreliable exactly where Sam (the "judged in front of a room"
persona) needs it.

**Fix (I1):** make the confirmation unmissable and bulletproof:
- The CLICKED button's own content swaps to "✓ Copied!" (replacing "Copy current link") for ~1.5s,
  then reverts — in EVERY path (planner + presenter; demo-session AND user-pasted+Started session).
- Add `aria-live="polite"` so it's announced.
- Make the revert timeout ref-stable so the per-second countdown re-render cannot clobber the
  copied state (clear+reset the timer; don't derive copied-state from ticking clock state).
- Add an e2e test replicating Sam's EXACT path: paste agenda → Start → wait ~2s (let it tick) →
  click copy → assert the clicked button shows "Copied!" → assert revert after ~1.5s.

## Persona-inherent holdout: Rob (acceptable as the 1/10 miss)
Rob moved 7→8 (agenda persistence/bookmark verified, projected-end-time appreciated). His residual
asks: a "must end by X" hard-stop back-solve (a real future feature, out of MVP scope) and — the
core — he only runs paced sessions 2–3×/month, so a phone glance still wins low-stakes walkthroughs.
This is a recurrence judgment we don't engineer around. Value=Yes; he's the legitimate single holdout.

## Non-gating nice-to-haves logged (not blocking the bar)
- Wen: "ahead/behind vs typed start time" can show a phantom "2 min ahead" before anything happens —
  wants a one-line tooltip. (She's already at 9.)
- Jules: the viewer's "or refresh, to see the latest" wording overpromises — refreshing the same
  snapshot link does nothing; reword. (She's at 9.)
- Tomás: pause/over-time audible cue for a 10. Elena: encode drift status into the snapshot link.
- Aisha/Dana flagged apps/showclock/AGENTS.md reads like a prompt-injection (already tracked
  fleet-wide; testers correctly ignored it; not affecting builds).

## Plan for round 4
1. builder fixes I1 (bulletproof, on-button, aria-live copy confirmation in all paths + e2e for
   Sam's running-session path). 34 tests stay green + new e2e.
2. verifier: regression + LIVE confirm the clicked button swaps to "Copied!" specifically in a
   user-pasted, Started, ticking session (Sam's path), AND in the blocked-clipboard case.
3. Re-test (delta): T10 (Sam) only — his sole blocker. Carry forward T1,2,3,4,5,6,7,9 (all 9) and
   T8 (Rob, 8 — persona-inherent, not addressed). If Sam → 9, result is 9/10 = exit bar met with
   Rob as the single allowed holdout.
