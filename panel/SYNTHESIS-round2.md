# Showclock — Panel SYNTHESIS Round 2

Target: http://localhost:3000 (local prod server with round-1 fixes). All 10 personas in-audience.
Audience-weighted bar: in-audience personas must advocate at 9+.

## Per-tester results (round1 → round2 delta)

| # | Persona | R1 | R2 | Δ | One-line blocker |
|---|---------|----|----|---|------------------|
| 1 | Priya (backend eng, demo day) | 8 | 8 | 0 | Click-to-place-cursor + type still concatenates → "205m" (no clamp). |
| 2 | Marcus (frontend eng, sprint demo MC) | 8 | 8 | 0 | Shared co-host link is a frozen snapshot, not live; minor colon-spacing jank. |
| 3 | Wen (data analyst, training) | 7 | 6 | -1 | Start anchors to wall-clock-now → unexplained "522 min ahead" vs planned 9:00; reads like a bug. |
| 4 | Tomás (ops analyst, ops review) | 8 | 7 | -1 | Duration field unbounded → fat-finger "1440m" / 1470-min total, no warning. |
| 5 | Dana (demand-gen, webinar, mobile) | 8 | 8 | 0 | Future planned start + Start = "823 min ahead"; needs a guardrail + stronger behind=red cue. |
| 6 | Jules (community, AMA, mobile) | 9 | 8 | -1 | "822 min ahead" when prepping a future-start show; co-host link goes stale on live edits. |
| 7 | Aisha (product designer, workshops) | 8 | 7 | -1 | No validation on impossible durations (silent wrong clock); "+ Add item" wipes placeholder agenda. |
| 8 | Rob (brand designer, client walkthroughs) | 7 | 6 | -1 | Future-dated start + Start = nonsense "822 min ahead" / projected anchored to machine clock. |
| 9 | Elena (eng manager, all-hands, mobile) | 8 | 8 | 0 | Item advance fully manual; "NOW" goes stale if she forgets to click Next. No auto-advance. |
| 10 | Sam (PM, workshops, mobile) | 6 | 8 | +2 | "515 min ahead" hero number from start-anchor mismatch; copy-as-text copies raw input not computed clock times. |

## In-audience-at-9 count: 0 / 10

(Round 1 was 1/10. Net advocacy moved DOWN: five testers dropped a point, two flat at 8, one flat at 8, Sam +2, none reached 9. The two shipped fixes did not clear the blockers and a regression-class concern surfaced.)

## Did the 3 round-1 fixes resolve their complaints?

1. **Select-all on focus + max-duration clamp (silently-wrong duration bug)** — PARTIAL, effectively FAILED. The select-all-on-focus half works: every tester who *clicked then typed* got a clean overwrite (20 over 15 = 20), confirmed by Wen, Tomás, Dana, Jules, Aisha, Rob, Elena, Sam. BUT the "max-duration guard / clamp" half is NOT present: clicking to *place the cursor* (no selection) and typing still concatenates, and absurd values are NOT clamped. Priya reproduced "205m" (total 230), Tomás "1440m" (total 1470), Aisha duplicate-clock garbage from a 1440 item. This is still a SILENTLY-WRONG-OUTPUT class defect = P0 for a tool selling exact clock times. The most-cited remaining blocker.

2. **"Start show" honors entered Planned start (was silently wall-clock-now)** — FAILED as users experienced it. The Planned-start field is read and labeled, but pressing Start still anchors "now" = wall-clock-now and computes drift against the planned time, so a future planned start (the dominant prep-ahead workflow) yields an alarming "500–823 min ahead" hero number with projected times at the wrong wall clock. Hit by Wen, Dana, Jules, Aisha, Rob, Sam, Tomás. This is the #2 most-cited blocker and it directly contradicts what fix #2 was supposed to resolve. (match-fix-signal-self-consistency: the relabel landed but the behavior the relabel promised did not.)

3. **Editor table + "Copy rundown as text" rendered above the textarea (discoverability)** — RESOLVED. No tester in round 2 reported failing to find the structured editor or the copy button; everyone discovered and exercised reorder/add/remove/copy on first entry. added-feature-buried complaint is gone. (Residual nit, not discoverability: Sam/Priya note copy-as-text copies raw input lines, not computed clock times — a content choice, not a buried-affordance defect.)

## Grouped friction

### TARGET-FEATURE defects (editing correctness / discoverability / mobile)
- **Unbounded/concatenating duration field — P0 silently-wrong-output.** Priya (205m), Tomás (1440m), Aisha (150/1440 garbage clock). Select-all covers click-then-type but not place-cursor-then-type, and there is no max clamp. A single typo produces a wrong clock with zero warning. THE blocker.
- **Editing discoverability** — RESOLVED for all (fix #3 worked).
- **Edit-by-tap at 375px** — WORKS. Dana, Jules, Elena, Sam all overwrote durations / reordered / added by tap at mobile width with no failure. mobile-375 lesson satisfied.
- **"+ Add item" on cold page wipes the placeholder agenda** instead of converting it to editable rows — Aisha. Editing-flow defect, P1.

### PRE-EXISTING / behavior nits (not the round-2 target, but now the dominant advocacy ceiling)
- **Start-anchor drift footgun (future planned start → "500–823 min ahead")** — Wen, Dana, Jules, Aisha, Rob, Sam, Tomás. This is the single biggest *cluster* by tester count and the reason no one reaches 9. Classified PRE-EXISTING (it predates the editor feature) but fix #2 explicitly targeted it and did not resolve it, so it is now in-scope. P0/P1.
- **Co-host share link is a frozen snapshot, stale on live edits** — Marcus, Jules. P2.
- **Manual-only item advance; NOW goes stale** — Elena. P2.
- **Copy-as-text copies raw input, not computed clock times** — Sam, Priya. P2.
- **Colon-spacing jank in hero countdown** — Marcus. P3.

### PERSONA-INHERENT non-fit
- None. All 10 confirmed in-audience and all 10 found the core value real ("yes I'd use it"). No persona rejected on fit.

## Verdict: NEEDS-FIX (round 3)

In-audience-at-9 = 0/10; bar requires (audience-weighted) advocacy at 9+. The round failed and slightly regressed because the two correctness fixes did not actually land the behavior they promised.

### Round-3 fix plan (ordered)
1. **Clamp + sanitize the duration field (P0, fixes the #1 blocker).** On EVERY edit path — not just focus-select — coerce to a bounded integer: ignore concatenation when the field already holds a committed value (treat a fresh keystroke as replace, or cap field length), and CLAMP to a sane max (e.g. 1–600 min) with a visible inline flag on out-of-range input. No path may produce a clock from an absurd duration silently. This is the silently-wrong-output P0 and the most-cited blocker — fixing it alone likely moves Priya, Tomás, Aisha to 9.
2. **Make Start honor the planned start for real (P0/P1, fixes the #2 cluster).** When planned-start is in the future (or differs materially from now), do NOT compute drift as if the show already started. Either (a) start anchored at the planned time (a pre-show "scheduled for 2:00 PM, not started" state, drift = 0 / suppressed until item 1 is advanced), or (b) offer an explicit "start now" vs "start at planned time" choice. Kill the "822 min ahead" hero number on a fresh future-dated start. This unblocks Wen, Dana, Jules, Rob, Sam, Tomás.
3. **"+ Add item" on the cold/placeholder page must convert the placeholder agenda to editable rows, not wipe it (P1).** — Aisha.
4. (Defer to backlog) live/refreshable co-host link, optional auto-advance, copy-as-computed-clock-times, colon spacing.

match-fix-signal-self-consistency note for round 3: do not relabel/announce a fix unless the observable behavior changes. Verify each fix by reproducing the EXACT tester repro (click-to-place-cursor + type 20; set future planned start + Start) before declaring it landed.
