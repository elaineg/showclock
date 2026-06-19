# Showclock — Panel SYNTHESIS Round 3

Target: http://localhost:3000 (local prod server, all 3 round-2 fixes shipped).
Audience: all 10 personas in-audience. Bar = advocate at 9+.

## Per-tester (advocacy round2 → round3)

| Persona | R2 | R3 | Δ | One-line blocker |
|---|---|---|---|---|
| Priya (backend eng, keyboard-first) | 8 | 6 | -2 | Ctrl+A in a duration cell does NOT select-all; typing prepends → "20"→"3020", clamps to bogus 600m, projected clock runs backward |
| Marcus (frontend eng) | 8 | 8 | 0 | Future "Planned start" doesn't pre-roll — Start runs the clock immediately |
| Wen (data analyst) | 6 | 6 | 0 | Future planned start ignored; timer/drift anchor to "now" not the planned instant |
| Tomás (ops analyst) | 7 | 6 | -1 | "Planned start" accepts a future time but Start begins counting immediately — implies scheduling it doesn't do |
| Dana (demand-gen mktr) | 8 | 8 | 0 | No reusable saved templates for a recurring monthly webinar (re-paste each month) |
| Jules (community mktr) | 8 | 8 | 0 | Copy buttons give no "Copied!" confirmation on phone (NOTE: contradicted — see below) |
| Aisha (product designer) | 7 | 8 | +1 | Silent over-max duration clamp + no "future start = not yet running" state |
| Rob (freelance designer) | 6 | 6 | 0 | Main "Start show" button disabled on cold load until you edit the prefilled agenda, no hint why |
| Elena (eng manager) | 8 | 8 | 0 | Manual per-item advance, no auto/audible overrun cue; no one-tap recall of recurring agendas |
| Sam (PM) | 8 | 8 | 0 | Future planned start is label-only — Start fires countdown immediately; (also cited silent copy) |

## In-audience-at-9 count: 0 / 10

No tester reached 9. Scores cluster at 6 (Priya, Wen, Tomás, Rob) and 8 (Marcus, Dana, Jules, Aisha, Elena, Sam). Trajectory across the panel is essentially flat vs round 2 (R2 avg 7.2 → R3 avg 7.0), with two regressions (Priya -2, Tomás -1) and one gain (Aisha +1).

## Did the 3 round-2 fixes resolve their complaints?

### FIX A — duration field REPLACES on edit + CLAMPS to 600m with "max 600m" flag
**LANDED for the real user gesture; one keyboard-first hole remains.** Eight testers (Marcus, Wen, Tomás, Dana, Jules, Aisha, Rob, Sam, Elena) independently verified that the natural path — click/tap the duration cell, the value is pre-selected (selStart 0 / selEnd 2), type the new number — cleanly REPLACES ("20"→"30", "12"→"20", "20"→"7"). Eight of them explicitly flagged that a `Ctrl+A`-then-type produced a junk value ("600"/"3020") but attributed it to their OWN test harness (Ctrl+A = line-start on Mac, or deselects the field on Linux), NOT the app, and refused to report it as a bug. The round-2 silently-wrong-clock repro (typing over "5" giving "205") is GONE on the click-and-type path.
- **BUT Priya (keyboard-first, the one persona who lives on Ctrl+A) traced it as a real app defect:** clicking the cell to place the cursor, then Ctrl+A, leaves selection at `[0,0]` so digits prepend → "20"→"320"→"3020", clamped to a bogus 600m that still flows into the total (635 MIN) and makes projected clock times read BACKWARD. For her this is the canonical keyboard-first overwrite and it silently corrupts the number on the projector. The clamp guard fires but does not prevent the wrong-but-in-range value. This is a REAL, narrow TARGET-feature defect (select-all-in-field), not a pure harness artifact, because it is the literal gesture her persona uses.

### FIX B — Start reads "ON TIME / 0 min" with a future Planned start (no "822 min ahead" hero)
**Half-landed and BACKFIRED into a new blocker.** The round-2 bug (bogus huge "ahead" hero number) is GONE — testers confirm Start now reads "on time / 0 min" and drift is measured from the actual Start moment. BUT four testers (Marcus, Wen, Tomás, Sam; echoed by Aisha) now read the SAME design as a fresh defect from the opposite direction: a FUTURE "Planned start" with a "next 5-min mark" helper IMPLIES the show is scheduled to begin then, but pressing "Start show" begins counting DOWN immediately. The field is now "label-only" (drives the planned-schedule column) while the timer anchors to the click moment. This is the single most-cited remaining blocker (4 named + 1 echo). It is a TARGET-feature defect of the affordance's own contract (match-fix-signal-self-consistency: the fix made the number honest but left the affordance promising a pre-roll it doesn't deliver).

### FIX C — "+ Add item" on cold page preserves the placeholder agenda
**LANDED.** No tester reported the round-2 wipe-on-add behavior. "+ Add item" appended a row and preserved existing items for everyone who exercised it (Priya, Marcus, Elena, Sam, Rob, etc.). Resolved.

## Grouped friction (mapped + classified)

**A. Future Planned start does not defer/pre-roll the timer** — Marcus, Wen, Tomás, Sam (+Aisha echo). **TARGET-FEATURE defect** (FIX B's affordance contract). The top blocker; gates 4 in-audience testers at 6–8. This is editing/start correctness, squarely the feature's own surface.

**B. Ctrl+A-then-type in a duration cell does not select-all; digits prepend and corrupt** — Priya (the rest saw it but disowned it as harness). **TARGET-FEATURE defect, narrow** (keyboard-first edit path). silently-wrong-output: produces an in-range-but-wrong 600m that makes projected clock times run backward. Real for the keyboard-first persona; cosmetically masked for mouse/touch users.

**C. Copy buttons give no "Copied!" confirmation** — Priya, Sam, Jules say NO confirmation; **but Wen, Dana, Aisha, Rob, Elena explicitly saw "✓ Copied!" flip.** CONTRADICTORY signal across testers → likely a per-button gap ("Copy rundown as text" may lack the flip that "Copy current link" / the show-view copy has) OR a clipboard-env timing artifact. Classify as **TARGET-adjacent craft nit** worth a one-line verify: confirm BOTH editor copy buttons flip to "✓ Copied!". match-fix-signal-self-consistency: do not declare fixed without reproducing the exact button each holdout clicked.

**D. "Start show" disabled on cold load until the prefilled agenda is edited** — Rob. **PRE-EXISTING/UX defect** (first-run trust). The primary CTA looks clickable but is dead on the seeded example; "See a live example" rescues it but the dead button is a bad first impression. added-feature-buried-adjacent: the cold-state primary action is non-functional. Real defect, not the round-3 target, but cheap and high-leverage.

**E. Over-max duration clamps silently to 600m (only a red badge)** — Aisha, Priya. **Craft nit / part of FIX A** — the clamp exists but does not reject/explain; ties into defect B.

**F. Mobile 375px: "on time" drift badge text clipped at top, band bleeds to edge** — Elena (cosmetic). **PRE-EXISTING craft nit.** mobile-375: editor + presenter + read-only view all RENDER and are interactive at 375px for Dana, Jules, Elena (real interaction confirmed, not just render) — only this badge clipping is off. Migrating nit.

**G. No reusable saved templates / one-tap recall for recurring agendas** — Dana, Elena. **PERSONA-INHERENT / scope** — both run the SAME agenda weekly/monthly and want recall beyond bookmark-the-link. Genuine recurrence-value gap but a NEW feature, not a round-3 fix.

**H. Manual per-item advance, no auto/audible overrun cue; "Sound: Off" unclear cold** — Elena. **PRE-EXISTING** (showclock's existing stage-cues feature exists but its cold affordance is unclear). Migrating nit.

**I. Copy round-trip normalizes text ("SQL basics - 12 min" → "SQL basics 12")** — Wen. **PERSONA-INHERENT data-hygiene** nit; value preserved, format rewritten. Not a blocker.

## VERDICT: NEEDS-FIX (round 4)

The in-audience bar (9+) is NOT met (0/10), and the gap is NOT merely pre-existing craft: the feature's OWN target surface — editing + start correctness — carries the two top defects (A future-start contract, B keyboard-first overwrite). This is not SHIP-ON-OBJECTIVE-MET because the target gap is still open. match-fix-signal-self-consistency: FIX B made the hero number honest but left the affordance self-contradictory; we must not call it done.

### Round-4 fix plan (ordered by advocacy leverage)
1. **Resolve the future-Planned-start contract (top blocker, 5 testers).** Pick ONE honest model and make the UI say it: EITHER (a) a real pre-roll — a future Planned start arms a "Show starts in MM:SS" countdown and the per-item timer begins at the planned instant; OR (b) keep start-on-click but relabel the field so it cannot imply scheduling (e.g. "Scheduled clock time (display only) — timer starts when you press Start", remove the "next 5-min mark" future-nudge or repurpose it). (a) is what Marcus/Wen/Tomás/Sam actually expect ("set up early, start at the scheduled time"); prefer (a) unless it is large, in which case (b) closes the self-consistency gap immediately.
2. **Fix select-all in the duration cell (Priya).** On focus/click, the cell input should select its whole value so Ctrl+A (and any cursor-then-type) overwrites, not prepends. Verify "20" + Ctrl+A + "30" = "30". Also make over-max input reject/correct rather than land a wrong-but-in-range 600m that reverses projected times.
3. **Enable "Start show" on cold load (Rob).** The seeded example agenda is valid — the primary CTA must be live on first paint (or show an inline "edit the agenda to start" hint at the moment it's disabled).
4. **Confirm BOTH editor copy buttons flip to "✓ Copied!" (Priya/Sam/Jules vs Wen/Dana/Aisha/Rob/Elena contradiction).** Reproduce the exact "Copy rundown as text" button each holdout clicked; if it lacks the flip the others saw, add it.
5. **Cosmetic (batch, low priority):** 375px "on time" badge top-clip + edge-bleed (Elena); clarify the "Sound: Off" overrun-cue affordance cold (Elena).

Expected lift: fixing #1 (future-start) directly unblocks Marcus, Wen, Tomás, Sam toward 9; #2 lifts Priya; #3 lifts Rob. That is a credible path to the bar in round 4. Defects G (templates) and I (format normalization) migrate to BACKLOG as recurrence-value / data-hygiene enhancements, not round-4 blockers.
