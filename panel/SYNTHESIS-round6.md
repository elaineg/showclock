# Showclock — Panel SYNTHESIS Round 6

Target: http://localhost:3000 (local prod, contains all R5 fixes). 10 personas, all in-audience.
Audience-weighted bar: advocate at 9+.

## Per-tester (advocacy R5→R6, one-line blocker)

| Persona | R5 | R6 | Δ | One-line blocker |
|---|---|---|---|---|
| Priya (backend eng) | 6 | 8 | +2 | No dry-run rehearse + drift is text-only, wants large color band on projector (pre-existing surface) |
| Marcus (frontend eng, MC) | 6 | 8 | +2 | Bulk-paste raw textarea ignores Ctrl+A select-all → re-paste corrupts existing rundown |
| Wen (data analyst) | 5 | 7 | +2 | Same bulk-paste Ctrl+A hijack (silent data-mangling) + Copy normalizes 1:30→90 (no data-in=data-out) |
| Tomás (ops, Windows/Edge) | 5 | 6 | +1 | Same bulk-paste textarea swallows Ctrl+A (his Windows muscle memory) |
| Dana (demand-gen, mobile) | 6 | 8 | +2 | Per-item projected column/end does NOT drift live until a whole minute crosses |
| Jules (community, mobile) | 6 | 8 | +2 | Colon "1:30"→90m silently (H:MM), no echo/confirm of interpretation; mobile sound toggle clipped at 375px |
| Aisha (product designer) | 6 | 8 | +2 | "Copy rundown as text" gives no "Copied" confirmation label flip (craft micro-gap) |
| Rob (freelance designer) | 6 | 7 | +1 | Recurrence/fit non-fit (occasional short walkthroughs) + colon 1:30 ambiguity |
| Elena (eng manager) | 6 | 8 | +2 | No optional auto-advance — manual Next means babysitting the button (pre-existing feature ask) |
| Sam (PM, mobile) | 6 | 7 | +1 | Bulk-paste Ctrl+A corruption + sub-minute projected reflow looks frozen for ~50s |

**In-audience-at-9 count: 0/10** (raw). Cluster at 7–8; nobody crossed 9.
Mean moved 5.7 → 7.5 (every persona up; +2 for 6 of them).

## Did the 3 round-5 fixes resolve their complaints? (R5 repro mentally reproduced)

**Fix 1 — Ctrl+A-then-type replaces in editable CELLS (name + duration): RESOLVED / GONE.**
Every tester who tried it confirms the inline cell auto-selects and BOTH Ctrl+A-then-type AND
click-in cleanly REPLACE on name and duration, no whole-page select, no append. Explicitly verified
by Priya, Marcus, Wen, Tomás, Dana, Jules, Aisha, Elena, Sam (and Rob via Cmd+A on Mac). The R5
"chord selects the whole page" defect on cells is closed.
IMPORTANT DISTINCTION: the "garbled rows" reports (Marcus "Q&A 15Intro", Wen, Tomás "Break 5Intro",
Sam "Welcome 5Keynote") are NOT the fixed cell editor — they are the SEPARATE bulk-paste raw
`<textarea>` ("Or edit raw text below"), which still does not honor Ctrl+A select-all. New surface,
see friction below.

**Fix 2 — Colon "1:30" parses as H:MM=90 on both paste and inline-edit, echoed, names intact,
Copy round-trips: PARSE RESOLVED / GONE.** "1:30"→90m, "0:45"→45m, "0:05"→5m confirmed on both
paths by Priya, Marcus, Wen, Dana, Jules, Aisha, Rob, Elena, Sam; minutes echoed in row; totals
correct; names intact. The R5 parse-mismatch defect is closed. Two residual asks (not the R5 defect):
(a) Wen — Copy normalizes "1:30"→"90" (lossless minutes but not literal round-trip); (b) Jules/Rob —
H:MM is ambiguous vs m:ss, want an interpretation echo/hint. These are enhancement/discoverability,
not the shipped parse correctness.

**Fix 3 — Whole-show DRIFT band goes behind on live overrun BEFORE pressing Next (5s grace, signed):
RESOLVED / GONE.** Confirmed live by Priya (badge flipped on-time→behind), Dana (amber "21s behind"
at ~60s), Jules ("13s behind"), Aisha ("12s behind"), Rob ("3 min behind" + reflow), Elena, Sam
("on time→13s→1 min behind"). Reads "on time" at the moment of Start (correct). The R5 "stays green
through an overrun" defect is closed. NOTE Tomás reported a green "on time" at +2min — but he reached
the running state ONLY via Playwright clock injection, which he himself flagged as confounding the
elapsed-time logic (test-env artifact, consistent with everyone else's clean wall-clock observation);
not a reproduced app defect.

## Grouped friction (mapped to testers, classified)

### A. Bulk-paste raw `<textarea>` ignores Ctrl+A select-all — TARGET-FEATURE defect (NEW surface)
Testers: Marcus, Wen, Tomás, Sam (4); Priya verified-and-excused as cell-only-fixed, Rob hit the
adjacent symptom on a wrong-keystroke. Repro: focus "Or edit raw text below", press Ctrl+A →
selectionStart==selectionEnd (nothing selected, page steals it) → typed/pasted agenda INSERTS
mid-text → corrupted rows + wrong item count. Cmd+A (Mac) works; Ctrl+A (Windows/Chrome) does not.
This is the SAME stopPropagation class as the R5 cell fix, applied to the cell editor but NOT to the
sibling bulk textarea (lesson: sibling-symmetry-fix-all-peers-in-one-pass). It is silent-wrong-output
(no error, corrupted rundown) — Wen/Tomás/Sam all flag the silent mangling. This is the single
most-cited blocker (4 testers), and it IS a target-feature (editing-input correctness) defect, the
same family the round explicitly set out to fix — but on a different element than R5 named.

### B. Per-item PROJECTED column doesn't reflow until a whole minute crosses — TARGET-FEATURE defect (drift display)
Testers: Dana, Sam, Aisha (3). Drift BADGE moves live (fixed), but projected segment start/end times
round to whole minutes, so for the first ~50s of overrun the schedule table looks frozen while only
the badge changes. Dana/Sam: "the whole pitch is segments visibly reflow so the room trusts the
schedule" — the table is the trust artifact and it's static sub-minute. This is within the drift-
display target area, though it is a refinement of the (now-working) drift, not a correctness break.

### C. Colon H:MM ambiguity / no interpretation echo — discoverability (borderline target)
Testers: Jules, Rob (2). "1:30"→90m is correct-by-spec but silently surprising; want an echo/hint or
m:ss support. Parse is correct; this is a discoverability/affordance ask, not a parse defect.

### D. Pre-existing / feature-completeness presenter-surface asks — MIGRATE TO BACKLOG
- Optional auto-advance / per-item done-tap (manual Next babysitting): Elena (her standing R5+ ask), echoed by Priya (dry-run/rehearse).
- Large color drift band / projector-readable signal beyond text: Priya.
- Copy "as text" no "Copied" confirmation label flip: Aisha.
- Copy normalizes 1:30→90 (literal round-trip): Wen.
- Mobile 375px: sound toggle clipped off right edge (Jules), drift band truncates leading number to "behind" (Elena), edit cells ~21px tall fiddly (Dana). mobile-375 lesson: interaction works, cosmetic clipping.

### E. Persona-inherent non-fit
- Rob: occasional short 4-item walkthroughs, can eyeball a phone; drift payoff lands on longer multi-block sessions → he caps himself at 7 on fit, not quality. Inherent non-fit.

## VERDICT

**NEEDS-FIX (round 7).**

Honest reasoning. Two of the remaining clusters are TARGET-feature defects in the exact area this
arc owns (input-editing correctness + live-drift display), not pre-existing presenter-surface asks:

- Cluster A (bulk-paste textarea swallows Ctrl+A) is the **single most-cited blocker (4 testers:
  Marcus, Wen, Tomás, Sam)** and is named explicitly as their #1 by three of them. It is the SAME
  stopPropagation/select-all defect family R5 fixed on cells, simply left on the sibling element —
  a sibling-symmetry miss, and it produces silent corrupted output (silently-wrong-output lesson).
  This is a TARGET-feature defect, so per the rubric it blocks SHIP-ON-OBJECTIVE-MET.
- Cluster B (projected table frozen sub-minute) is cited by 3 testers (Dana, Sam, Aisha) as
  undercutting the core "segments visibly reflow" promise. It's within the drift target area.

This is NOT match-fix-signal self-consistency theater: the three R5-named defects are genuinely
CLOSED (verified above), the panel moved every persona up (+2 for six of them, mean 5.7→7.5), and the
verdict is driven by an independently-observed, multi-tester, reproducible target-feature defect on
the input path — not a manufactured nit. The remaining D/E items (auto-advance, color band, copied-
label, copy round-trip format, mobile cosmetic clipping, Rob's fit) ARE pre-existing/feature-
completeness/non-fit and would migrate; but A and B are not, so the run stays open.

Round-7 fix list (target-only):
1. Apply the cell editor's stopPropagation/select-all fix to the bulk-paste raw textarea so Ctrl+A
   selects all there too (sibling-symmetry: fix all peer inputs in one pass). Highest priority.
2. Make the per-item projected start/end column reflow live with sub-minute (m:ss) resolution during
   an overrun, so the table moves the moment the badge does.
3. (Cheap, fold in) Echo the colon interpretation ("read as 90 min") on entry — closes Jules/Rob's
   ambiguity within the parse-display target.

Migrate to BACKLOG (do NOT keep the run open for these): optional auto-advance / per-item done-tap
(Elena, Priya dry-run); large projector color drift band (Priya); Copy "Copied" confirmation flip
(Aisha); Copy literal-round-trip format choice (Wen); 375px cosmetic clipping of sound toggle / drift
band truncation / cell tap-target height (Jules, Elena, Dana); Rob persona-fit (non-fit).
