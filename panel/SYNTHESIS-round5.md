# Showclock — Panel SYNTHESIS Round 5

Target URL: http://localhost:3000 (local prod, claimed to contain all R4 fixes)
All 10 personas in-audience. Bar: advocate at 9+.

## Per-tester (advocacy R4 → R5, one-line blocker)

| Tester | R4 | R5 | Δ | Top blocker |
|--------|----|----|---|-------------|
| Priya  | 8  | 6  | -2 | Whole-show drift band stays green "on time" + projected-end frozen during live overrun (also Ctrl+A "4530") |
| Marcus | 8  | 6  | -2 | Ctrl+A-then-type APPENDS ("SponsorsIntro"/"3520") + colon "1:30"→2m, both silent |
| Wen    | 5  | 5  | 0  | Silent duration rounding ("1:30"→2m, "0:45"→1m) + DRIFT shows a word not a signed number |
| Tomás  | 7  | 5  | -2 | Colon parse broken ("1:30"→2m); drift anchored to button-press not planned start |
| Dana   | 8  | 6  | -2 | Colon silently corrupted (raw "1:30"→2m, inline→130m, copy writes "130") |
| Jules  | 6  | 6  | 0  | Colon corrupted (inline "1:30"→130m, raw→2m); 0-min items silently dropped; on-time/over contradiction |
| Aisha  | 8  | 6  | -2 | Colon "1:30"→2m + Ctrl+A destructive ("Sketch roundSketch") + drift band green during overrun |
| Rob    | 6  | 6  | 0  | Live overrun doesn't reflow (band green, projected end frozen) + colon "1:30"→2m |
| Elena  | 8  | 6  | -2 | Ctrl+A editing broken ("Opening keynoteKeynote", dur→600m) + colon "1:30"→2m |
| Sam    | 8  | 6  | -2 | "on time"/green band + frozen downstream times during overrun + Ctrl+A insert |

## In-audience-at-9 count: 0 / 10

Mean dropped from ~7.2 (R4) to ~5.8 (R5). Seven testers regressed, three flat, zero improved. Zero at 9+.

## Did the 3 round-4 fixes resolve their complaints? (mental repro of each R4 repro)

**FIX 1 — Ctrl+A-then-type should REPLACE (uncontrolled editing buffer, both fields): DID NOT LAND.**
Reproduced as still-broken by Marcus ("Intro"+type "Sponsors"→"SponsorsIntro"; "20"+"35"→"3520"), Priya (dur "4530"), Aisha ("Sketch roundSketch", total 615), Elena ("Opening keynoteKeynote"; "2m"+Ctrl+A+"90"→600m), Sam ("LunchCoffee break"), Jules/Rob saw it work but they were on Mac using Cmd+A. The pattern is unambiguous: a REAL Ctrl+A (Windows/keyboard chord) selects the PAGE, not the inline field, so typed text PREPENDS/APPENDS and the old value persists; duration then clamps silently to "max 600m". The claimed "uncontrolled editing buffer / verified with a real browser key chord" fix is NOT present in this build. Tomás (Edge) reported it clean — the ONE Windows tester who didn't hit it — but five others reproduced it; this is the round-4 P0 still live.

**FIX 2 — Colon durations ("1:30") parse as MM:SS, name intact: DID NOT LAND (worse — two divergent wrong answers).**
ALL 10 testers hit colon corruption. Raw paste "Keynote 1:30" → **2m** everywhere (parsed as ~1.5 decimal minutes, ceil-rounded). Inline-edit "1:30" → **130m** (colon stripped) per Dana/Jules/Elena. "Copy rundown as text" then writes "Keynote 130" so it can't even round-trip. Names ARE preserved (the "name mangling" half is gone), but the core parse claim — "parse as minutes:seconds" — is false; it is neither MM:SS nor honest, and the raw/inline answers disagree. Wen's exact R4 repro reproduces unchanged.

**FIX 3 — Live overrun grows the drift badge before Next: PARTIALLY LANDED, self-contradicting.**
Split signal. The per-item NOW card DOES now go red and count up live ("+0:10 over the planned 1 min") for everyone. But the headline WHOLE-SHOW DRIFT band + projected-end + downstream reflow did NOT update live for Priya, Aisha, Rob, Sam (band stayed green "on time", projected end frozen) — yet DID flip amber/"2 min behind" with reflow for Dana, Wen, Jules, Marcus. So the fix half-landed: item-level live, show-level still anchored to Next/inconsistent. Dana's R4 repro is resolved; Priya/Aisha/Rob/Sam see a band that contradicts the red item — worse than no signal. Likely a grace-band threshold + show-level recompute-only-on-Next gap.

## Grouped friction (mapped + classified)

**TARGET-FEATURE defect — editing correctness (Ctrl+A) [P0]:** Marcus, Priya, Aisha, Elena, Sam. Real Ctrl+A chord prepends/appends instead of replacing; duration silently clamps to 600. This is exactly the defect this run claimed to fix. **silently-wrong-output** + **match-fix-signal-self-consistency** (the run summary asserts "verified with a real browser key chord" — the panel disproves it).

**TARGET-FEATURE defect — colon-duration parse correctness [P0]:** ALL 10. Raw "1:30"→2m, inline→130m, neither is MM:SS, copy can't round-trip, no echo of interpretation. **silently-wrong-output**.

**TARGET-FEATURE defect — live whole-show drift/reflow consistency [P0]:** Priya, Aisha, Rob, Sam (band green + frozen projected-end during a red overrunning item) vs Dana/Wen/Jules/Marcus (works). Self-contradiction at the exact glance moment. **match-fix-signal-self-consistency**.

**TARGET-FEATURE defect — drift legibility (PRE-EXISTING-ish nit but in-feature):** Wen — DRIFT band shows a WORD ("on time"/"behind") not a signed number under a header literally labeled DRIFT; ~1-min grace band hides small overruns.

**PRE-EXISTING / UNRELATED nits:** "Copy rundown as text" gives no "Copied" feedback for some (Priya, Marcus) while flipping to "✓ Copied!" for others (Rob) — inconsistent button feedback; copy strips units ("Talk A 5" not "5 min"). 0-minute items silently dropped (Jules). Drift anchored to button-press not planned wall-clock start (Tomás, Marcus) — a model choice, arguably its own feature ask.

**PERSONA-INHERENT non-fit / feature-completeness asks (NOT this run's defects):** CSV/column paste so weekly agendas don't get re-typed (Wen, Tomás, Dana). These are the only genuinely out-of-scope asks; everything blocking 9 is in-feature correctness.

## VERDICT: NEEDS-FIX (round 6)

The bar is NOT met (0/10 at 9). More decisively: the TOP blocker for every single tester is one of the three TARGET-feature defects this run was specifically meant to close, and two of the three (Ctrl+A replace, colon MM:SS) did NOT land at all in the build the panel tested — the round summary's "fixed/verified" claims are contradicted by 5–10 independent cold reproductions (match-fix-signal-self-consistency: the shipped build does not match the claimed fix). This cannot be ship-on-objective-met: the editing/parse/drift feature still owns the top defect for all 10. The remaining holdouts are NOT pre-existing presenter-surface asks — they are this feature's own correctness.

### Concrete round-6 plan

1. **Ctrl+A replace (P0).** The inline editors are not capturing select-all. Do NOT rely on native Ctrl+A (it bubbles to document selection on Windows). On focus, programmatically `select()` the field's full contents, AND intercept `keydown` Ctrl/Cmd+A inside the cell to `el.select()` and `preventDefault`. Confirm the editing buffer is uncontrolled so the typed value REPLACES. Verify with a REAL Ctrl+A keydown chord (not just `.fill()`/`.type()` which already overwrite) on BOTH name and duration, on Windows-style modifier. This is the claim that failed verification last round — the verifier MUST drive `keyboard.down('Control'); keyboard.press('A'); keyboard.up('Control'); keyboard.type('45')` and assert the cell reads "45", not "4520".

2. **Colon-duration parse (P0).** Decide ONE contract and apply it identically in BOTH the raw-textarea parser and the inline-edit parser (they currently diverge: 2m vs 130m). Recommended per persona intent: treat "1:30" as H:MM or M:SS? Personas (Wen/Tomás/Elena/Dana) read "1:30" as 90 MINUTES (H:MM). So "1:30" → 90 min, "0:45" → 45 min, "12:00" → 720 min. Echo the interpretation back in the row (e.g. "90 min") so it's never silent. Round-trip through "Copy rundown as text" must reproduce the same value. Add unit tests for "1:30", "0:45", "0:05", "12:00" through BOTH input paths.

3. **Whole-show drift live consistency (P0).** Recompute whole-show drift + projected end + downstream reflow on the SAME live tick that turns the NOW card red — not only on Next. Eliminate (or shrink + visibly disclose) the ~1-min grace band so the band cannot read green "on time" while the current item is red and over. Replace the word-only DRIFT label with a signed number ("+2:00 behind") per Wen. Assert: at +0:10 into a 1-min item with no Next pressed, the band is NOT green and projected end has moved.

4. **Cheap wins:** make "Copy" feedback consistent ("✓ Copied!" everywhere) and include units in copied text; warn instead of silently dropping 0-min items.

Re-panel after these land. Apply added-feature-buried (the editing affordance must work for the keyboard chord users reach for first), mobile-375 (Jules/Sam confirmed 375px nav/interaction is clean — no regression there), silently-wrong-output (colon + clamp + 0-drop all fail silently today), match-fix-signal-self-consistency (do not let a round summary claim "fixed/verified" a defect the build still reproduces).
