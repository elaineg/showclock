# showclock — UX Brief (round 2)

## 1. Problem statement
When your meeting runs long, this shows you exactly how far behind you are and what
time each remaining item will now actually start — so you can decide what to cut.

## 2. Primary user action
Paste a free-text agenda and hit Start to enter a glanceable presenter view. The
landing textarea is pre-focused and PRE-FILLED with a worked sample agenda, so the
rundown (names, durations, clock times) is already visible before the user types.

## 3. Emotional tone
Calm and in-control under time pressure — the dashboard a host trusts at the lectern.
Font: clean humanist sans, very large numerals in presenter view. Color: cool neutral
base, with one warm-amber "behind" and one cool-green "ahead" accent. Spacing: roomy,
high-contrast, readable from arm's length on a phone.

## 4. Design decisions (addressing every panel friction point)

**G1 — Copy confirmation.** Every "copy link" button swaps its label to "Copied!" with a
check for ~1.5s on click, then reverts. Success check: clicking copy shows "Copied!"
inline within the same button.

**G2 — Drift badge dominates.** In presenter view the signed drift badge ("ON TIME" /
"N MIN AHEAD" / "N MIN BEHIND") is the single largest element — bigger and higher than the
per-item countdown, full-width, color-coded (amber behind / green ahead / neutral on time).
Per-item countdown is visibly secondary (smaller, below). Success check: the drift badge is
the largest/topmost text in presenter view.

**G3 — No silent misparse.** Parse "90 sec"/"90 seconds" as 0:90 and "1h"/"1.5h" as
hours correctly. Any line with an unrecognized unit or ambiguous duration renders as an
inline-flagged unparsed row ("couldn't read a duration — try '10' or '10 min'") with the
user's typed text shown VERBATIM; never silently reinterpret units or mutate the label.
Success check: "90 second teaser" yields a 90-second item labeled "teaser"; a junk line is
flagged, not coerced to minutes.

**G4 — Cold drift is neutral.** Before Start, no drift number anywhere. In presenter view
drift only computes from the actual session start; a past/stale start never shows a giant
"472 min behind" — until the first Start the badge reads "ON TIME · 0 min". Success check:
cold landing and freshly-started session both show "ON TIME", never a large stale "behind".

**G5 — One-tap demo to the payoff.** A "See a live example" button on the landing view
loads a sample agenda AND jumps straight into presenter view in a realistic BEHIND state
(e.g. mid-session, ~6 min behind, remaining items reflowed later). Success check: one click
from landing shows the presenter view with a non-zero "behind" badge.

**G6 — Keyboard shortcuts.** In presenter view: Space or → = Next, ← or Backspace = Back.
Show a one-line hint ("Space = next · ← = back") under the controls. Success check: pressing
Space advances the current item.

**G7 — Snapshot, not live mirror.** Reframe the share link honestly. Presenter view has a
persistent "Copy current link" button (re-copyable any time, reflecting the latest Next).
Label near it: "Shares a snapshot of right now." The read-only viewer shows a banner:
"You're viewing a snapshot — ask the host to re-share, or refresh, to see the latest."
Success check: viewer page displays the refresh-to-update hint; presenter copy button is
always available, not one-time.

**G8 — Reusable agenda hint.** On the rundown/landing view, a quiet line: "Bookmark this
page to reuse this agenda — it's saved in the link." Success check: a bookmark/reuse hint is
visible once an agenda is parsed.

## 5. 5-second check (above the fold, cold visitor)
- Headline: "Know exactly how far behind you are — and what time everything starts now."
- Subtitle: "Paste your agenda. We track the drift and reflow every clock time live."
- Primary action: pre-filled, pre-focused agenda textarea + a prominent Start button.
- Secondary: "See a live example" button (G5) landing in a behind-state presenter view.
- Already-visible payoff: the parsed rundown with computed wall-clock times under the paste box.
