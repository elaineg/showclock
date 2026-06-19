# Round 1 — Aisha (Product designer, judges craft hard)

## 1. COLD OPEN (advocacy 8/10)
Within 30s I get it: paste your session rundown, hit Start, and it tracks how far
ahead/behind you are and recomputes when everything starts. "Know exactly how far behind
you are — and what time everything starts now" + the example placeholder ("Intro 10",
"Demo - 20 min") nailed it instantly. As someone who runs timeboxed FigJam workshops
(5-min warmup / 15-min sketch / 10-min critique), this is the presenter clock I improvise
today with a phone timer + mental math. I'd use it. The "See a live example — loads a
sample already running behind, no setup" line is a genuinely considered empty state — I
clicked nothing and already trusted it.

## 2. CORE TASK — plan, edit, start
Pasted "Warmup - 5 / Sketch - 15 / Critique - 10". A live RUNDOWN table appeared under the
textarea ("3 ITEMS · 30 MIN TOTAL", "Click any name or time to edit · reorder with ↑↓").
- Discoverable: YES. The hint copy is right there and the rows look clickable.
- Rename: clicked "Sketch", typed, Enter — worked, synced back to the textarea.
- Reorder: ↑/↓ per row, with proper aria-labels ("Move Warmup down"), endpoints disabled.
  Start times recomputed instantly. Clean.
- Add / Remove: "+ Add item" adds "New item 5", "×" removes. Both fine.
- Start show: presenter view is the standout — big NOW item, "5:00 / of 5 min planned",
  a calm "3 min ahead · WHOLE-SHOW DRIFT" badge, planned→projected column, projected end
  time, Space=next keyboard nav, "Copy current link / live read-only view". This is
  exactly what I want to glance at mid-room. Considered, legible, low-clutter.

CRAFT NIT (the thing that annoyed me): editing a duration in place does NOT select the
existing value on focus — the cursor lands at the end. I clicked "5m" meaning to change it
to 8 and typed "8", and got "85m" (and "110 MIN TOTAL"). For a tool whose whole job is
fast last-second timebox tweaks, fumbling a duration edit is the worst place to fumble. A
considered field selects-all on focus so one keystroke replaces it.

## 3. BIGGEST BLOCKER
The duration edit-in-place not selecting its value on focus. It's small but it directly
undermines the core promise of quick edits and bit me on my first real edit. Fix that
(select-all on focus) and this is a 9 for me.

```json
{"tester": 1, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["Editing a duration in place doesn't select the value on focus — clicking 5m and typing 8 yields 85m, fumbling the exact quick-edit the tool exists for", "Pasted formats like 'Warmup - 5 min' get normalized in the textarea to 'Warmup 5', which is fine but slightly surprising on first edit"], "priorConcernsAddressed": "n/a"}
```
