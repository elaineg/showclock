# showclock — Panel SYNTHESIS round 1

Prod URL tested: https://showclock-nu.vercel.app (run 20260612-214916-daily, retrofit panel).
Profiles regenerated from the 2026-06-12 ICP roster (sanctioned: app had no prior panel).

## Score table

| # | Persona | Clarity | Value | Advocacy | Biggest blocker |
|---|---------|---------|-------|----------|-----------------|
| 1 | Priya (backend eng) | Yes | Yes | 8 | No keyboard shortcuts for Next/Back (lectern use) |
| 2 | Marcus (frontend eng) | Yes | Yes | **6** | Share link is a frozen snapshot, not a live mirror — co-host won't see Next/Back |
| 3 | Wen (data analyst) | Yes | Yes | **7** | Silent misparse: "90 second" → 90 MIN with label mutated, no flag; "1h" chokes |
| 4 | Tomás (ops analyst) | Yes | Yes | 8 | Cold-landing "472 min behind" pill looks broken (drift vs. past start time) |
| 5 | Dana (demand-gen) | Yes | Yes | 8 | No live demo of the glanceable behind/ahead screen on landing |
| 6 | Jules (community mktg) | Yes | Yes | 8 | Share link frozen snapshot, not live mirror |
| 7 | Aisha (product designer) | Yes | Yes | 8 | Over-time/behind state hard to trigger; copy button gives no confirmation |
| 8 | Rob (freelance designer) | Yes | Yes | **7** | Persona-inherent: only runs paced sessions 2–3×/month, competes w/ phone glance |
| 9 | Elena (eng manager) | Yes | Yes | 8 | No "Copied!" confirmation; no fast re-run/save of recurring agenda |
| 10 | Sam (PM) | Yes | Yes | 8 | No "Copied" confirmation; per-item clock out-shouts the drift badge |

**Exit bar: ≥9 testers at advocacy ≥9 + clarity Yes + value Yes. Currently 0/10 at ≥9.**
Clarity and value are unanimous Yes — the product is legible and the job is real. This is a
polish/trust gap, not a fit problem.

## Complaints grouped by cause

### G1 — No copy confirmation on the share button (recurs: T7, T9, T10)
The presenter "copy link" button gives no visible feedback. Three testers independently flagged
it; for Sam and Elena it's the literal top blocker. Cheapest, highest-frequency fix.

### G2 — Drift badge loses to visual hierarchy (recurs: T10, T7)
The big per-item countdown out-shouts the "N min behind/ahead" badge — the badge is the whole
point of the app and the thing facilitators glance for. Make drift the dominant signal.

### G3 — Parser silently mutates input (recurs: T3, and trust-relevant to T4/T9)
"90 second teaser" is read as 90 MINUTES and the label is mutated, with no unparsed flag; "1h"
fails. Wen came specifically to verify no invisible transforms and this is exactly the failure.
Fix: parse seconds + hour units correctly, OR flag ambiguous/unknown units as unparsed rather
than silently reinterpreting. No silent mutation of the typed label.

### G4 — Cold-landing drift looks broken (T4)
Landing on / running the presenter view with a start time in the past produces an alarming
"472 min behind". To a wary user this reads as a bug. Drift should be suppressed/neutral until
the session is actually started, and the "behind" math should anchor sensibly.

### G5 — Payoff screen (behind/ahead) is hidden behind paste-and-Start (recurs: T5, T7)
Dana (ruthless one-scroll) and Aisha both wanted to SEE the glanceable drift state without
having to construct an agenda and run it. The over-time/behind state is also hard to trigger to
even preview. Add a one-tap demo/sample run that lands you in the presenter view showing a
realistic behind/ahead state.

### G6 — No keyboard shortcuts for Next/Back (T1)
Priya drives from a lectern, not a trackpad. Space/→ = Next, ←/Backspace = Back is standard for
presenter tools and cheap.

### G7 — Share link is a frozen snapshot, not a live mirror (recurs: T2, T6)
Marcus (6) and Jules (8) expected the co-host link to update live as the presenter hits Next.
This is an explicit spec boundary (Out of scope: "No live sync server" — free tier, no backend),
so a true live socket is off the table. The fixable part is the *expectation*: the link reads as
"broken" because nothing tells the user it's a point-in-time snapshot. Fix = reframe + frictionless
re-share: label it a snapshot, give a persistent "copy current link" in the presenter view, and a
clear "your co-host should refresh to see the latest" hint on the viewer. This won't fully satisfy
Marcus's live-mirror wish (architecturally impossible here) but removes the "feels broken" read.

### G8 — No reusable agenda (T9 secondary)
Elena would re-paste her all-hands every week. Spec excludes a saved library/backend, but the URL
already IS the saved state — a "bookmark this to reuse your agenda" hint makes the existing
capability discoverable. Cheap framing fix.

## Persona-inherent / likely-non-converting
- **Rob (7)** — frequency objection (2–3×/month). Value=Yes; he liked projected-end-time. Sharper
  "worth it over a phone glance" framing + the G2 drift prominence may tip him to 8–9, but per the
  no-fabricated-panel rule we don't engineer around his honest recurrence judgment. Acceptable as
  the 1 allowed holdout if needed.
- **Marcus (6)** — wants a true live mirror we can't build without a backend. G7 reframing is the
  honest ceiling for him this round.

## Plan
Fix G1–G6 (all cheap, high-frequency, directly named) + G7/G8 framing. Re-test all 10 in round 2
(every fix touches surfaces nearly every tester named, so no carries this round). Targets to convert:
T1 (kbd), T3 (parser), T4 (cold drift), T5 (demo), T7 (copy+drift+demo), T9 (copy+reuse), T10
(copy+drift). Watch list: Marcus, Rob.
