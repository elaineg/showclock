# Showclock — Round 1, Tester: Dana (demand-gen marketer, MacBook + phone, ruthless about time)

## 1. COLD OPEN (30s)
**Clarity: Yes.** "Showclock — Know exactly how far behind you are — and what time everything
starts now. Paste your agenda. We track the drift and reflow every clock time live." I got it
in one read: it's a run-of-show timer for live sessions/webinars that tells you if you're
running behind and recomputes when each segment starts. That IS my monthly webinar problem
(intro/demo/guest/Q&A). "See a live example" loading a session *already running behind* sold it
in two seconds — that's the screenshot I'd drop in my team channel.
**Advocacy on cold open alone: 8.**

## 2. CORE TASK (entered, edited, started — all at 375px by tap)
Pasted "Intro 5 / Demo 20 / Guest speaker 15 / Q&A 10 / Wrap-up 5". The free-text parse nailed
durations AND, the instant I typed, a structured **RUNDOWN** panel appeared: per-item name,
duration, computed start time, ↑/↓ reorder, × delete. Hint text "Click any name or time to
edit · reorder with ↑↓" is good.
- **Edit duration by tap: works.** Tapped "20m", it became an input. Reorder ↑↓ and × delete
  all worked by tap at 375px and stayed in sync with the textarea (edits flow both ways — nice).
  aria-labels are clean ("Move Demo down", "Remove Wrap-up"). No JS errors anywhere.
- **Running screen is exactly what I want:** big "on time / behind" drift badge, huge current
  item + countdown ("Intro 5:00 of 5 min planned"), and a planned→projected clock per item with
  a projected end time. Glanceable on a phone between speaking. "Copy current link" for a
  co-host snapshot is a bonus.

**What confused / annoyed me (specific):**
- **Tapping a duration does NOT select the existing number.** Cursor lands at the end, so on my
  phone typing "30" gave me "**3020**" (total jumped to 3055 min). I have to manually backspace
  the old value. On mobile that's a real fumble — should select-all on focus.
- **"Start time" field is a lie on Start.** I set it to 2:00 PM, hit Start show, and every clock
  read from the *current* wall-clock time (11:46 PM), ignoring my 2:00 PM. For a live timer
  "start now" is defensible, but then why let me set a future start time and silently drop it?
  Confusing for someone planning ahead.

## 3. BLOCKER (single biggest thing holding back the score)
The **silently-ignored "Start time" field**. I deliberately set 2:00 PM and the app threw it
away without a word — that's the difference between "tool I trust live in front of an audience"
and "tool I have to second-guess." Tighten this (either honor it, or relabel it "Show starts
when you hit Start" and hide/repurpose the field) and the duration select-on-focus, and I'm at 9.

Advocacy: **8/10.** Genuinely useful, no-signup, clearly built for my exact webinar job — I'd
share it. Two small trust/UX dings keep it out of the 9–10 "bring it up unprompted" zone.

```json
{"tester": 4, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["Set 'Start time' (2:00 PM) is silently ignored on Start — clocks reflow from current wall-clock time instead", "Tap-to-edit duration doesn't select existing value, so typing on a phone appends (20→3020)"], "priorConcernsAddressed": "n/a"}
```
