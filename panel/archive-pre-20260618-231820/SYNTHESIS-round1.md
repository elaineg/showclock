# Showclock — Panel SYNTHESIS round1 (STAGE CUES feature)

Run: 20260617-170607-daily. Feature judged: STAGE CUES on the running presenter view
(traffic-light color band GREEN→AMBER→RED with calm RED pulse; opt-in 🔔 Sound toggle,
default Off; over-time flash). Tested COLD against http://localhost:3210 by 10 personas.

## Score table

| Persona | In-audience? | Clarity (5s) | Value | Advocacy | One-line note |
|---------|:---:|:---:|:---:|:---:|---|
| Priya (backend eng, monthly 8-talk demo day) | YES | Yes | Yes | 8 | Verified client-side in network tab; cues + calm pulse great; wants full-screen projector-only stage mode |
| Marcus (frontend eng, biweekly sprint demo MC) | YES | Yes | Yes | 8 | Cues all clean; co-host share link is a snapshot that goes stale on Next — wants live mirror |
| Wen (data analyst, weekly 6-seg training) | YES | Yes | Yes | 8 | Parse fidelity exact; cues work; copy-link gives no "Copied" confirmation; wants CSV export |
| Tomás (ops analyst, weekly strict 45-min review) | YES | Yes | Yes | 8 | No-signup verified; beeps fired; BLOCKER: green "on time" header vs red item band contradiction |
| Dana (demand-gen, monthly webinar, glance-to-know-behind) | YES | Yes | Yes | 8 | Glanceable behind-signal nailed; BLOCKER: item card RED while top pill GREEN = double-take |
| Jules (community marketer, weekly AMA, phone podium) | YES | Partially | Yes | 7 | Cues + calm pulse podium-safe; share link snapshot-not-live; H1 omits the word "timer" |
| Aisha (product designer, timeboxed FigJam workshops) | YES | Yes | Marginal | 6 | Cue band considered, pulse calm; BLOCKER: chip/band contradiction; clock-time framing not durations |
| Elena (eng manager, weekly all-hands, always overruns) | YES | Yes | Yes | 7 | TTFV ~2s; RED is the stop-kick she lacks; BLOCKER: green pill vs red band contradiction |
| Sam (PM, sprint planning, sharer) | YES | Yes | Yes | 8 | Share link live + reflows; cues work; "snapshot" copy misdescribes the (actually live) feature |
| Rob (freelance designer, 2–3×/month walkthroughs) | NO (low-freq holdout) | Yes | Yes (in principle) | 6 | Built well, cues verified; phone glance still wins at his frequency — KNOWN non-gating holdout |

## In-audience advocacy vs bar

Bar (audience-weighted niche DEEPEN): IN-AUDIENCE personas advocating at **≥9**.
- In-audience personas: 9 (all except Rob, the known low-frequency holdout — Value=Yes, non-gating).
- In-audience at ≥9: **0 of 9**. Cluster sits at 6–8 (six at 8, two at 7, one at 6).
- Bar NOT met. (Rob carried at 6, non-gating per the prior-panel holdout precedent. Aisha at 6 is an in-audience low-fit-but-real complaint, gating.)

## The new feature itself: PASSED cleanly — NOT a surfacing failure

added-feature-buried check (the thing this round most feared): **does not apply.**
- Sound toggle found in <5s WITHOUT a hint by ALL 10 testers (default Off, correct, top-right).
- ALL 10 noticed the band color change live (GREEN→AMBER→RED).
- behavior-green≠delight-correct check: the RED pulse is unanimously judged **CALM, not a strobe**
  (cue-pulse opacity 1→0.72, 1.2s ease-in-out — "breathes"); band is "considered, not garish";
  room-legible. The stage-cue feature as scoped is delight-correct and well-crafted.

So the new feature is not the problem. The advocacy ceiling comes from a DIFFERENT, pre-existing
signal that the new red band now visually COLLIDES with.

## Single highest-leverage blocker (named precisely)

**The top whole-show drift chip shows GREEN "on time" while the current item's band is RED/overrun.**
Two timing signals disagree in one glance — the exact failure mode for a facilitator scanning the
screen mid-room. Raised independently by **Tomás, Dana, Elena, and Aisha** (all in-audience), and the
single most-cited reason each capped at 7–8 instead of 9.

- This is a REAL DEFECT (logic/legibility), not a surfacing fix: the whole-show drift can legitimately
  be "ahead/on-time" while the *current item* is over (earlier items banked slack). But presenting a
  calm GREEN pill directly above a pulsing RED band reads as contradictory/broken at a glance.
- One-pass fix for the builder: when the CURRENT ITEM is in overrun (band RED), the top chip must not
  read calm green "on time." Reflect the active item's state in the header — e.g. surface "current item
  +0:28 over" / shift the chip amber/red when the live item is over, OR clearly relabel the chip as
  "whole-show drift" and visually subordinate it so the item band is the dominant signal. Make the two
  signals legibly distinct so they never look like they're contradicting each other.

Secondary (carry to backlog, non-gating this round, each raised by 1–2 personas):
- Share/co-host link copy says "snapshot" but the view is actually LIVE & reflows (Marcus, Jules, Sam) —
  misleading copy on the feature sharers care most about; either fix copy to "live read-only" or make it
  truly follow Next.
- "Copied" confirmation missing on copy-link (Wen).
- 1-min items render AMBER from second one (60s amber floor swallows the whole item) — minor, several noted.
- Full-screen projector-only stage mode (Priya); H1 missing the word "timer" (Jules); durations-vs-clock
  framing for workshop facilitators (Aisha).

## Verdict: ITERATE

The new STAGE CUES feature passed (surfaced, calm, legible, valued). But the bar (in-audience ≥9) is
not met: 0 of 9 in-audience personas at ≥9. **One fix unblocks the cluster** — resolve the
GREEN-header-vs-RED-band contradiction so the header reflects the current item's overrun state (or is
clearly subordinated as whole-show drift). That single change is what four in-audience personas named
as the gap between their 7–8 and a 9. Fix it, re-run the panel.

## Per-persona detail pointers
- apps/showclock/panel/round1-Priya.md
- apps/showclock/panel/round1-Marcus.md
- apps/showclock/panel/round1-Wen.md
- apps/showclock/panel/round1-Tomás.md
- apps/showclock/panel/round1-Dana.md
- apps/showclock/panel/round1-Jules.md
- apps/showclock/panel/round1-Aisha.md
- apps/showclock/panel/round1-Rob.md
- apps/showclock/panel/round1-Elena.md
- apps/showclock/panel/round1-Sam.md
