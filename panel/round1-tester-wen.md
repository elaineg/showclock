# Showclock — Round 1, Tester: Wen (marketing data analyst)

## 1. COLD OPEN — what is it, would I use it? (Advocacy: 7/10)
Within 30s: a presenter's run-of-show clock. Paste an agenda (one item per line), it parses
each line into name + duration + a planned start clock, then during the live show tracks how
far behind/ahead you are. Tagline "Know exactly how far behind you are — and what time
everything starts now" + "Paste your agenda. We track the drift and reflow every clock time
live" made it legible immediately. I run a weekly 6-segment data-literacy training and live in
a fragile Google Sheet that does NOT reflow clock times when I cut a segment — so yes, this is
relevant to me. The "Paste your agenda" textarea (not a 6-field form) is exactly my workflow.

## 2. CORE TASK — paste, edit, reorder, add/remove, start
Pasted my real 6-line rundown ("Welcome 5", "Intro - 10 min", "15 Q&A", etc.). Parse was
EXACT — every name and duration matched what I typed, 60 MIN TOTAL, 6 ITEMS, clock times
cumulatively correct (9:00→9:05→9:15→9:35→9:50→9:55 off a 9:00 start). It accepts "Welcome 5",
"Intro - 10 min", AND "15 Q&A" (leading number) and gets all three right. That earns my trust.

In-place editing IS discoverable — "Click any name or time to edit · reorder with ↑↓" hint
plus visible ↑ ↓ × on every row. All reflows were CORRECT:
- Duration edit Live demo 20→30: total → 70 min, every downstream clock pushed +10. ✓
- Name edit Q&A→Questions: clean, no value change. ✓
- Reorder (Break up over Q&A): Break→9:35, Q&A→9:40, Wrap-up→9:55. ✓
- Add item: 7 items / 65 min, new row appended at correct next clock. ✓
- Remove: back to 60 min, all times correct. ✓
No wrong clock time in any edit path. Zero console errors. Started show → clean live view with
"planned → projected" two-column drift table, exactly the transparency I want.

DATA-HYGIENE CHECKS I ran on my own:
- "Copy rundown as text" round-trips the DATA faithfully (names+durations preserved) but
  CANONICALIZES format: "Intro - 10 min" comes back "Intro 10", "15 Q&A" → "Q&A 15". Values
  intact, punctuation/word-order rewritten. Acceptable, but it's a silent reformat I noticed.
- An item with no number ("Welcome") is NOT silently defaulted — it's flagged "couldn't parse
  — try '10' or '10 min'" and excluded. That honesty is exactly what I want. Big plus.

ONE BROKEN PATH: clicking a duration cell opens an input pre-filled with the value, but it does
NOT select-all on focus. If you type "30" expecting to replace "20" you get "3020m" (total
jumped to 3060 min). Triple-clicking first works fine, but the obvious gesture corrupts the
value. For a tool whose whole pitch is trustworthy numbers, a fat-finger that produces 3020
minutes with no guardrail is jarring.

## 3. BLOCKER — single biggest thing holding back the score
The **start-time field is a lie at Start**. I set Start time to 14:30, the editor planned every
clock off 2:30 PM — then "Start show" IGNORED 14:30 and ran the live show off the wall clock
(11:48 PM "now"), with the live "planned" column showing 11:48 PM, not 2:30 PM. Nothing warns
you. As someone who opens her tool 10 min before a scheduled session, I can't tell whether the
clocks I planned are what I'll see live. Combined with the no-select-all duration edit producing
3020m, these two trust dents cap me at 7. Fix start-time-at-Start honesty (either honor it or
clearly label the field "preview planning only") + select-all on edit focus, and this is a 9 —
it already beats my Sheet on the one thing my Sheet can't do: reflow every clock on edit.

```json
{"tester": 1, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 7, "topComplaints": ["Start show ignores the Start-time field — runs off wall-clock 'now' with no warning; planned clocks I set don't appear live", "Duration cell doesn't select-all on focus: typing '30' over '20' yields '3020m' (3060 min total) with no guardrail"], "priorConcernsAddressed": "n/a"}
```
