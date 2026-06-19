# Showclock — Panel SYNTHESIS Round 7

Target: http://localhost:3000 (local prod, all fixes). 10 in-audience personas.
Audience-weighted bar: all 10 must advocate at 9+.

## Per-tester (advocacy R6→R7 · one-line blocker)

| Persona | R6 | R7 | Δ | Top blocker |
|---|---|---|---|---|
| Priya  | 8 | 6 | -2 | `1:30`→90m colon misparse, silent — can't trust paste for lightning talks |
| Marcus | 8 | 6 | -2 | `12:30`→750m colon misparse — data-corruption-level, won't Slack a pasted agenda |
| Wen    | 7 | 7 | 0  | Silent colon reinterpretation (`1:30`→90m) + Copy emits bare numbers, not round-trip-safe |
| Tomás  | 6 | 8 | +2 | Whole-show drift headline says "on time" while live item is +Xs over (updates only on Next) |
| Dana   | 8 | 8 | 0  | `0:30`→30min colon misparse, no warning; Copy strips units |
| Jules  | 8 | 9 | +1 | Read-only co-host share link only appears AFTER show goes live (not discoverable pre-start) |
| Aisha  | 8 | 8 | 0  | Copy round-trips `1:30`→`90`; projected clock column minute-granularity feels static <60s |
| Rob    | 7 | 6 | -1 | `1:30`→90m silent misparse; `0`-min item silently dropped |
| Elena  | 8 | 8 | 0  | Past planned-start ignored (no backdating to "we started 3 min late") |
| Sam    | 7 | 8 | +1 | Projected clock TIMES minute-granularity look frozen at a glance during overrun (math is live) |

**In-audience-at-9 count: 1/10** (Jules only). Cluster mean 7.2 (R6 was 7.5).

## Did the 2 round-6 fixes resolve their complaints?

**FIX 1 — raw textarea Ctrl+A select-all replace (R6 repro: Marcus/Wen/Tomás/Sam):**
GONE for all four and everyone else who tried it. Marcus: "full replace rebuilt with no ghost/stale rows." Wen: "zero leftover. Clean." Tomás: "my prior complaint is GONE." Sam: "all rows rebuilt." Sibling-symmetry fix held — inline cells and bulk textarea now behave identically.

**FIX 2 — projected/upcoming clock not frozen during overrun (R6 repro: Dana/Sam/Aisha):**
GONE. Dana: "upcoming clock is NOT frozen — it ticks live; prior frozen-clock complaint is gone." Aisha: "nothing frozen" — NOW card +Xs ticks live, badge counts up, per-item "+Xs" deltas. Sam: captured +0:07→+0:11 live, "projections tracking live." The live drift cue + per-item annotation work.
SUB-NOTE (new, minor): the projected AM/PM *clock column* is minute-granularity, so for the first <60s of an overrun the time numbers don't visibly roll (only the "+Xs" tag moves). Aisha/Sam/Elena flagged this; Elena+Sam confirm it is CORRECT minute-rounding, not a frozen bug — a glance-polish ask, not a correctness defect.

Both R6 fixes are genuinely resolved. Neither is anyone's top blocker this round.

## Grouped friction (mapped + classified)

**A. TARGET-FEATURE defect THIS feature owns — colon duration parsed as H:MM silently**
Testers: Priya, Marcus, Wen, Dana, Rob (5 — and the single top blocker for the 4 lowest scorers).
`1:30`→90m, `0:30`→30m, `12:30`→750m, with NO on-screen indication of the rule. Rundown-parse correctness is squarely this feature's charter (colon parse is an explicit target-gap per the round goal). Presenters writing `1:30` mean 90 seconds for tight talk/webinar segments; the tool silently inflates to 90 minutes and corrupts the whole schedule. This is `silently-wrong-output`: the output is plausibly-formatted but wrong with no signal. THIS is the new dominant blocker and it is a target-feature parse defect. NOTE it was masked in R6 because testers happened not to probe colon-as-seconds; this round's explicit "1:30" instruction surfaced it — it is not newly-introduced code, but it IS within target-feature correctness and is now the gating defect.

**B. TARGET-FEATURE-adjacent — Copy rundown as text is lossy / not round-trip-safe**
Testers: Wen, Dana, Aisha (Priya noted format mangle `Talk 2 - 5 min`→`Talk 2 5`).
"Copy rundown as text" emits bare numbers (`Break 45`, `Closing 150`), stripping units and the original colon notation, so re-pasting the copy is ambiguous/lossy. Same silently-wrong-output family as A and tightly coupled to the parse rule — fix together.

**C. TARGET-FEATURE — whole-show drift headline lags live overrun**
Testers: Tomás (his top blocker), Marcus, Priya (self-contradiction: banner "on time" while item +Xs over).
The big "WHOLE-SHOW DRIFT" badge only updates on Next, so during an overrun the most prominent number contradicts the live item card + per-item deltas right below it. `match-fix-signal-self-consistency`: two surfaces disagree. Within target drift-correctness charter.

**D. PRE-EXISTING / feature-completeness asks (migrate to backlog if they remain the only holdouts):**
- Read-only share link not discoverable before show start (Jules). Feature-completeness/affordance-placement — `added-feature-buried` variant; the link exists and is genuinely read-only, just gated behind go-live.
- Past planned-start ignored / no backdating (Elena, Aisha noted). Feature-completeness ask (future-start contract works; backdating is a new capability).
- Projected clock-column minute granularity reads static <60s (Sam, Aisha). Presenter-surface glance polish.
- `0`-min item silently dropped (Rob). Edge-case input handling — minor.
- Sound toggle clipped at 375px (Jules). Mobile-375 polish.
- Privacy/no-server claim buried in small print (Tomás). Copy/trust polish.

**E. PERSONA-INHERENT non-fit:** none — all 10 found the app legible and for-them; every cap is a fixable defect or completeness ask, not a fit problem.

## VERDICT — NEEDS-FIX (round 8)

In-audience-at-9 is 1/10, so the bar is NOT met. More importantly, this is NOT ship-on-objective-met: the feature's OWN target correctness is NOT closed. The colon-duration parse (group A) is an explicit target gap (rundown-editing/parse correctness) and is a `silently-wrong-output` defect that is the single top blocker for the four lowest scorers (Priya 6, Marcus 6, Rob 6, plus Wen/Dana capped). Three personas dropped vs R6 specifically because of it. We cannot migrate a silent data-corruption parse bug to backlog and call the feature's correctness closed.

Concrete round-8 fix plan (target-feature correctness, do as ONE sibling-symmetry pass):
1. **Disambiguate colon durations.** Treat `M:SS` as minutes:seconds by default (the dominant presenter mental model for `1:30`, `0:30`, `12:30`), OR show an explicit inline echo of how each colon value parsed (`1:30 → 1m 30s`) so the rule is never silent. Whichever, it must be VISIBLE and never silently inflate — kill the `silently-wrong-output`. Decide one rule and apply it in the bulk-paste parser AND the inline cell parser AND the planned-rundown preview (sibling-symmetry — all three parse surfaces, one pass).
2. **Make "Copy rundown as text" round-trip-safe** with the same rule (preserve units / original colon notation) so copy→re-paste is lossless (group B — same parse module).
3. **Sync the whole-show drift headline live during an overrun** (group C / match-fix-signal-self-consistency) so the headline badge cannot read "on time" while the item card reads "+Xs over."
4. Handle `0`-min input explicitly (warn or keep) instead of silent drop (Rob).

After these target-correctness fixes, the expected remaining holdouts are the group-D pre-existing/feature-completeness surfaces (share-link discoverability, backdating, projected-column glance polish, 375px sound toggle) — at THAT point, if those are all that remain below 9, the run becomes ship-on-objective-met and group D migrates to backlog. But not before the parse defect is closed.

Lessons applied: `silently-wrong-output` (groups A+B — the gating issue), `match-fix-signal-self-consistency` (group C headline vs item card), `sibling-symmetry-fix-all-peers-in-one-pass` (fix all parse surfaces + copy together), `added-feature-buried` (share-link discoverability), `mobile-375` (sound toggle clip — both R6 fixes verified at 375px and hold).
