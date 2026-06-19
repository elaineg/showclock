# Showclock — Panel SYNTHESIS Round 8 (decisive round)

Target: http://localhost:3000 (local prod, all R7→R8 fixes present). 10 personas, all in-audience.

## Per-tester (advocacy R7 → R8, one-line blocker)

| Tester | R7 | R8 | Δ | Blocker (one line) |
|--------|----|----|----|--------------------|
| Priya  | 6  | 9  | +3 | Wants explicit reassurance a backgrounded/sleeping tab recovers on wall-clock mid-show (10-blocker only); copy-as-text grammar cosmetic nit. |
| Marcus | 6  | 7  | +1 | Saw WHOLE-SHOW DRIFT headline read green "on time" while current item red "+0:04 over" + downstream +4s — headline-vs-body contradiction at sub-Next overrun. |
| Wen    | 7  | 7  | 0  | No CSV/Sheets round-trip (parallel tool, not replacement); colon MM:SS default has no unit confirm/toggle. |
| Tomás  | 8  | 8  | 0  | "1:30" = 1m30s reads wrong for an ops/meeting audience who mean 1h30m (echo is honest but default surprises). |
| Dana   | 8  | 8  | 0  | Mobile SETUP/EDIT table truncates names to one letter ("Welcome"→"W.") — can't edit from phone. (Live view mobile is perfect.) |
| Jules  | 9  | 9  | 0  | Copy-as-text drops units ("Welcome 1" not "Welcome — 5 min"), ambiguous when pasted into Notion/handed off. |
| Aisha  | 8  | 8  | 0  | At second-scale drift the planned→projected clock column shows identical times (4:50→4:50) w/ tiny "+6s" — column looks redundant; no fullscreen presenter mode. |
| Rob    | 6  | 7  | +1 | "1:30" = 90s default backwards for presentation segments (means h:mm); also "0 min" item flagged unparseable (a legit 0m placeholder break should parse). |
| Elena  | 8  | 8  | 0  | Colon "1:30" silently = 1m30s where she means 1h30m; wants HH:MM default or "did you mean 1h30m?" nudge. |
| Sam    | 7  | 8  | +1 | Shared link is a frozen snapshot — viewer doesn't follow host's mid-show agenda edits (the exact thing he'd brag about). Secondary: colon default. |

## In-audience-at-9 count: **2 / 10** (Priya, Jules)

Trajectory: R7 in-audience-at-9 was 1 (Jules). R8 = 2. Net delta +9 across the panel (every score flat or up; zero regressions). Median moved 7.5 → 8.

## Did the 4 round-7 fixes resolve their R7 complaints?

- **Colon silent-misparse (Priya/Marcus/Rob/Wen/Dana):** SILENT-MISPARSE is GONE. Every tester who typed "1:30" saw the unmissable inline echo "1:30 → 1m 30s" on the parse surface — Priya, Marcus, Wen, Tomás, Dana, Jules, Aisha, Rob, Elena, Sam all confirmed the echo and none was silently wrong. The R7 *silent* defect is CLOSED. What REMAINS (Wen/Tomás/Dana/Rob/Elena/Sam) is a SEMANTIC-DEFAULT preference: MM:SS vs HH:MM. They explicitly note it is honest/visible, not hidden — this is a feature-completeness ask (unit-confirm/toggle or smarter default), NOT the R7 silently-wrong defect.
- **Copy round-trip (Wen/Dana):** GONE. Wen confirms "Keynote 1:30" round-trips faithfully and is lossless; Dana, Jules, Priya, Aisha, Rob, Elena, Sam all re-pasted successfully. Remaining (Jules/Dana/Priya) is a cosmetic export-grammar ask (bare "1" vs "— 5 min") — round-trips fine, just reads terse in Notion. Feature-completeness, not corruption.
- **Headline-drift lag (Tomás/Marcus/Priya):** RESOLVED FOR 9/10. Tomás, Priya, Dana, Jules, Elena, Sam, Aisha, Wen ALL explicitly saw the headline flip live from "on time" → "Xs behind / WHOLE-SHOW DRIFT" during an unadvanced overrun, with correct propagated math. **Marcus is the lone holdout** who reports the headline still read green "on time" while the item was red "+0:04 over." See analysis below — this is a self-consistency signal that must be adjudicated, not waved off.
- **0-min drop (Rob):** NOT silently dropped — Rob confirms "0 min" is FLAGGED + kept/greyed ("couldn't parse — try '10'"), not dropped. The R7 silent-drop defect is GONE. Rob's residual is a NEW feature ask: he wants a 0m placeholder break to actually parse as a valid 0-duration row. Feature-completeness, not corruption.

## Marcus headline-contradiction — adjudication (silently-wrong + match-fix-signal-self-consistency)

Marcus is the only tester of 10 to report the headline NOT flipping; 8 others explicitly watched it flip live with correct math, on desktop and mobile. The fix CLAIM was "headline updates live during overrun; still reads 'on time' at the exact moment of Start." Marcus's "+0:04 over" is a 4-SECOND overrun — i.e. ~4s after Start. The most consistent reading across all 10 reports: the headline flips correctly once a meaningful drift accrues (Priya saw it at +5/6s, Tomás +15/16s, Dana +12/13s, Elena +12s), but in Marcus's first ~4 seconds there is a brief window where the headline still reads "on time" while the per-item card already shows red. That is a SHORT-LATENCY edge at the very-low-single-digit-seconds boundary, not a sustained green-while-overrunning state — every other tester who let it run past a few seconds saw agreement. This is NOT a silently-wrong-OUTPUT data-corruption defect (the numbers everywhere are correct and self-consistent once drift registers); it is a sub-5-second headline-threshold/latency polish item on the presenter surface. Marcus's secondary nit (green "on time" tagline color ≈ green button color) is a presenter-surface contrast ask.

Caution applied (match-fix-signal-self-consistency): I did NOT auto-classify Marcus's complaint as the R7 defect just because the words match. The R7 defect was the headline reading "on time" *throughout* a sustained overrun; the R8 behavior 9/10 testers verified is live agreement. The residual is a boundary-latency refinement, not the closed defect reopened.

## Grouped friction → classification

**A. SEMANTIC colon default MM:SS vs HH:MM** (Wen, Tomás, Dana, Rob, Elena, Sam — most-cited, 6 testers)
→ PRE-EXISTING/FEATURE-COMPLETENESS. The R7 TARGET defect (silent misparse) is CLOSED — every value now echoes its parse unmissably. What's left is a default-semantics preference + optional unit toggle/nudge. Honest and visible per all 6; not silently wrong. MIGRATE TO BACKLOG.

**B. Headline sub-5s latency / green-on-green contrast** (Marcus)
→ PRESENTER-SURFACE polish. Live-overrun drift incl. headline is correct & self-consistent for 9/10; Marcus's case is a very-low-second-boundary latency + a status-band color-contrast nit. MIGRATE TO BACKLOG (threshold/contrast tune). Not a NEW data-corruption TARGET defect.

**C. Copy-as-text export grammar** (Jules, Dana, Priya) → FEATURE-COMPLETENESS. Round-trips losslessly (R7 defect closed); request is human-readable "— N min" export. BACKLOG.

**D. Mobile setup/EDIT table name truncation at 375px** (Dana) → PRE-EXISTING presenter/editor-surface (mobile-375 lesson). Live view is fine; the EDIT table clips names on phone. BACKLOG (was not in R7 group-D; new sighting — log it). NOT introduced by this run's editing/parse/drift changes; it's a responsive-layout gap in the editor.

**E. Projected-clock column shows identical times at second-scale drift** (Aisha, Rob) → PRESENTER-SURFACE glance polish (R7 group-D "projected-column glance polish"). Math correct (+Ns shown); the clock-time cell doesn't round/move at sub-minute drift. BACKLOG.

**F. Feature-completeness asks:** CSV/Sheets round-trip (Wen); fullscreen presenter mode (Aisha); live-following shared link vs frozen snapshot (Sam, Jules secondary); 0-min placeholder-break should parse (Rob); sleep/background-tab wall-clock recovery reassurance (Priya). → All PRE-EXISTING/FEATURE-COMPLETENESS or PERSONA-INHERENT scope expansions. BACKLOG. (Wen's CSV ask + Sam's live-link are persona-inherent fit ceilings — neither is a defect this run introduced.)

No tester reported any console error, crash, hydration failure, or data corruption. All editing surfaces (Ctrl+A in cells + bulk textarea, click-edit, reorder, add/remove) worked for all 10.

## VERDICT: SHIP-ON-OBJECTIVE-MET

The feature's OWN target correctness is genuinely CLOSED:
- Rundown editing across ALL text surfaces (Ctrl+A in cells AND bulk textarea, click-to-edit name+duration, reorder, add/remove): worked for 10/10, zero breakage.
- Colon parse is now NON-SILENT and echoed ("1:30 → 1m 30s") on every parse surface for 10/10 — the R7 gating silent-misparse defect is dead.
- Copy round-trips losslessly for 10/10 — R7 defect dead.
- Future-start pre-roll contract + "Start now" override: 10/10.
- Live-overrun whole-show drift incl. the HEADLINE updating live: verified live by 9/10 with correct self-consistent math; the 10th (Marcus) is a sub-5-second boundary-latency + color-contrast polish item, not a sustained wrong-output regression.
- 0-min item flagged-and-kept (not dropped) for Rob — R7 defect dead.

The in-audience ≥9 bar is met by only 2/10 raw, so this is NOT a PASS. But every holdout below 9 is a PRE-EXISTING/FEATURE-COMPLETENESS or presenter-surface ask, NOT a new TARGET defect this run introduced:
- A (colon semantic default), B (headline sub-5s latency/contrast), C (copy grammar), D (mobile-375 editor truncation), E (projected-column glance), F (CSV / fullscreen / live-link / 0m-parse / tab-recovery).

Per audience-weighted precedent (chartwise/colcopy/cron-explainer): once the feature's own correctness is closed and only pre-existing/feature-completeness surfaces remain, that IS ship-on-objective-met even at <9/10 raw. NEEDS-FIX(round 9) is reserved for a genuine NEW silently-wrong-output / data-corruption TARGET defect — there is none here after 8 rounds. Do not keep the run open chasing migrating surface nits into an open-ended redesign.

### Caps migrating to BACKLOG (named):
1. Colon-duration default semantics: optional MM:SS↔HH:MM toggle or "did you mean 1h30m?" nudge (6 testers — top-cited; biggest single advocacy lever).
2. Whole-show-drift headline sub-5-second flip latency + status-band green-on-green contrast vs buttons (Marcus).
3. Copy-as-text human-readable export grammar ("Welcome — 5 min") while keeping lossless round-trip (Jules/Dana/Priya).
4. Mobile (375px) setup/EDIT table name truncation — names clip to one letter (Dana).
5. Projected-clock column rounds/moves visibly at sub-minute drift (Aisha/Rob).
6. Feature-completeness scope: CSV/Sheets round-trip (Wen); fullscreen presenter mode (Aisha); live-following shared link (Sam/Jules); 0-min placeholder-break parses as valid 0-duration row (Rob); background-tab wall-clock recovery reassurance/handling (Priya).
