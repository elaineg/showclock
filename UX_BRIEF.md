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

---

# Stage Cues (round 3 — added feature)

Make the running presenter view readable from across a room: a glance from the podium
must answer "am I OK, wrapping up, or over?" without reading a number. Purely additive —
the drift badge, countdown, Start/Next/Back, rundown, copy-link and share view all keep
working exactly as today. Cues are derived from the SAME timing math that already drives
the countdown, so the read-only co-facilitator view shows the identical color/flash with
no extra state in the URL.

## C1 — Color-state rule (the exact, testable boundary)
Let `durMs = cur.minutes * 60_000` (current item's planned duration) and `countdownMs` =
`live.countdownMs` (already computed; negative = overrun). Define
`amberMs = max(60_000, 0.2 * durMs)` — the last 20% of the item, with a 60-second floor so
even short items get a real warning window. Then:

- **GREEN** — `countdownMs > amberMs` (ample time; you're cruising).
- **AMBER** — `0 < countdownMs <= amberMs` (final stretch; start wrapping up).
- **RED** — `countdownMs <= 0` (overrunning / at-or-past time-up).
- When `live.ended` (show complete): NEUTRAL grey band, no cue color, no flash, no chime.

Worked example (testable): a 1-minute item → `amberMs = max(60000, 12000) = 60000`, so it
is AMBER for its entire run, then RED at 0:00. A 10-minute item → `amberMs = 120000`, so
GREEN for the first 8 min, AMBER in the last 2 min, RED past 0:00. A 5-minute item →
`amberMs = 60000`: GREEN for 4 min, AMBER in the last 1 min, RED past 0:00.

## C2 — Visual treatment (band, not a tinted digit)
A **full-width horizontal color band** wrapping the "Now · item N of M" label, the item
name, AND the big countdown — i.e. the whole current-item block sits inside one bold
tinted panel that spans the presenter column edge-to-edge (square or lightly-rounded to
match existing cards; it's the dominant block under the drift badge). Keep showclock's
calm humanist look — saturated-but-not-neon fills, high text contrast, NOT a SSENSE
monochrome reskin:
- GREEN band: `bg-emerald-500` fill, white/near-black-on-light text as contrast dictates
  (reuse emerald, the app's existing "ahead/go" hue).
- AMBER band: `bg-amber-400` fill, dark text (`text-amber-950`) for contrast.
- RED band: `bg-rose-600` fill, white text.
The countdown numerals stay the largest text INSIDE the band; the band is what carries
across the room. The drift badge stays ABOVE the band and keeps its own existing palette
(it answers a different question — cumulative schedule drift, not current-item time-left) —
do not merge them. The read-only share view renders the identical band (color derived from
timing the viewer already has); only the controls are hidden.

## C3 — Over-time flash/pulse (tasteful, not seizure-inducing)
On RED only, the band **pulses**: a slow opacity/brightness breathe between full rose-600
and a slightly lighter rose (~85% lightness) on a **~1.2s ease-in-out loop** (well under
3 flashes/sec, WCAG-safe). It's a gentle "breathing" pulse, not a strobe. Green and amber
do NOT pulse — stillness vs. motion is itself the signal that you've crossed the line.
Respect `prefers-reduced-motion`: when set, drop the pulse to a static solid red band
(color alone still conveys RED).

## C4 — Audible chime (opt-in, default OFF, discoverable)
- **WebAudio oscillator beep**, no asset, no network. A short two-tone beep (~440→660Hz,
  ~250ms total) fires ONCE at the GREEN/AMBER→RED transition (item hits time-up), and a
  single reminder beep on **sustained overrun** (one more beep at ~30s past time-up). No
  continuous alarm — at most two beeps per item, so it's a cue, not a nuisance.
- **Default OFF.** A clear toggle lives in the presenter view top bar, inline with /
  adjacent to the drift badge area — a labeled pill button reading **"🔔 Sound: Off"** /
  **"🔔 Sound: On"** (text label, not just an icon, so a muted facilitator discovers it
  cold). It is visible the moment presenter view loads, not hidden in a menu.
- **Gesture-arming:** browsers block audio until a user gesture. The toggle press IS that
  gesture — turning Sound On creates/resumes the AudioContext and plays a tiny confirmation
  blip so the user hears it's live. If audio can't start, the toggle still flips but shows
  a quiet "sound blocked by browser" hint.
- **Local-only preference:** the on/off state is a per-device output choice — persist it in
  localStorage, NOT in the URL. The share view does NOT inherit the host's sound setting;
  each viewer arms their own (their toggle defaults OFF too, same control).

## C5 — Mobile / large-screen behavior
The band is full-width of the presenter column at every size (it already maxes at a narrow
column for phone-podium use). On a large external display the band + countdown scale up and
remain the dominant element; color and pulse must stay legible at a glance from >3m. The
sound toggle stays a tap-target ≥44px on mobile. No layout reflow vs. today beyond the band
wrapper and the toggle pill.

## C6 — Discoverability mandate (design AGAINST "added-feature-buried")
Build #1 must ship the color band AND the sound toggle as first-class, on-screen-by-default
elements of presenter view — NOT behind a settings gear or a hover. The color band is
inherently visible; the explicit requirement is the **labeled sound toggle visible on cold
load**. 5-second discoverability check: a facilitator who has never seen this feature opens
presenter view and, without clicking anything, can both SEE the current item's color state
AND SEE a labeled "Sound: Off" control they know how to switch on.

---

# Edit the rundown in place (round 4 — added feature, PLANNING view only)

Named by panel persona Wen: the recurring win is iteration. A facilitator who tweaks the
same agenda week to week (or fixes one typo'd duration) must NEVER re-paste the whole block
to change one thing. All of this lives in the PLANNING view BEFORE Start — the running
presenter view and its Back/Next are unchanged. Calm, glanceable, neutral as today: editing
is quiet and inline, not a modal or a separate "edit mode."

## E1 — Where each affordance lives (discoverable cold, renders + works at 375px in build #1)
The already-visible parsed rundown table under the paste box becomes directly editable. No
new screen, no gear, no hover-to-reveal. In each item row, left-to-right:
- **Title cell** and **Duration cell** are inline text inputs styled as the displayed text
  (so they read as values, not form fields) with a subtle bottom hairline that darkens on
  focus — the standing discoverability cue that a row is editable. A one-line helper sits
  directly above the table on cold load: **"Click any name or time to edit · reorder with
  ↑↓."**
- **Planned clock-time cell** stays READ-ONLY (computed) — never editable, it is the output.
- A trailing **controls cell** holds three tap targets: **↑** (move up), **↓** (move down),
  **×** (remove). Each is a real button ≥40px square, always visible (not hover-revealed).
- Below the last row: a full-width **"+ Add item"** button. Optional per-row "insert below"
  is polish, not required for build #1.
- Above or beside the paste box: a **"Copy rundown as text"** button (reuses the existing
  copy-confirm pattern from G1 — swaps to "Copied!" inline ~1.5s).

## E2 — Editable-row interaction model
- Click or Tab into a Title/Duration cell to edit; commit on **blur or Enter**, cancel on
  **Esc** (reverts to prior value). Enter in a Duration cell commits and the cursor can Tab
  to the next row's Title — fast keyboard iteration.
- Every commit, add, delete, or reorder **reflows all planned clock times LIVE**, identically
  to editing the paste text today (same recompute path). No save button.
- A blank Title commits as an empty-named item flagged like an unparsed row (don't drop it
  silently); a non-numeric/blank Duration shows the same inline "couldn't read a duration"
  flag as paste parsing (G3) and that row's clock time is held until fixed.
- **Round-trip authority (no silent divergence):** structured edits are AUTHORITATIVE after
  the initial paste — Start, the share URL, and the presenter view all use the edited
  rundown. The paste box is the bulk-entry / full-replace path: re-pasting REPLACES the
  rundown (with the existing parse), and the paste box text is kept in sync to reflect the
  current rundown so what you see in the box always matches the table. "Copy rundown as text"
  emits the current edited rundown as paste-compatible lines ("Intro 10") that paste back to
  the identical rundown.

## E3 — Edge / empty states
- **Empty rundown** (all items deleted or box cleared): table collapses to just the
  "+ Add item" button plus the standing helper line; Start is disabled with a quiet "Add at
  least one item" hint. Re-pasting or +Add brings rows back.
- **Single item:** its ↑ and ↓ are disabled (greyed, not removed, so the control column
  stays stable); × still works.
- **First item:** ↑ disabled. **Last item:** ↓ disabled. Disabled arrows are visibly
  inert, never invisible.

## E4 — 375px layout for the row controls
Each row stays a single horizontal line at 375px: Title (flex-grow, truncates), Duration
(narrow, ~3ch), clock time (read-only, right-aligned), then the ↑ ↓ × cluster. The three
control buttons are ≥40px tap targets with adequate spacing — operable by TAP, no hover,
no drag required (drag is optional desktop polish only). "+ Add item" and "Copy rundown as
text" are full-width tap-friendly buttons. If width is tight, the clock-time cell — not the
controls — is what shrinks first; controls never collapse into a menu.

## E5 — Correctness mandate (silently-wrong-output is P0)
Every edit — rename, duration change, add, delete, reorder — MUST keep the planned
clock-time column correct and consistent with what Start, the share URL, and the presenter
view then use. A wrong recomputed time after any edit is a P0 defect, not polish. The
edited rundown is the single source of truth handed to Start; there is exactly one rundown
model, and table edits, paste, share-URL encode, and presenter read all flow through it.
