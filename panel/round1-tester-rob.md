# Showclock — Round 1 — Rob (freelance brand/visual designer, desktop)

## 1. COLD OPEN (first 30s) — advocacy 7/10
**Clarity: Yes.** "Showclock" + "Know exactly how far behind you are — and what time
everything starts now" + "Paste your agenda. We track the drift and reflow every clock
time live." I'd tell a colleague: "It's a live run-of-show timer — paste your agenda,
hit start, and it tells you in big type whether you're ahead or behind and recalculates
the clock time of every remaining segment." The placeholder example ("Welcome 5",
"Demo - 20 min") instantly showed me the input format — no guessing. As a freelancer who
runs paced client walkthroughs and the odd portfolio panel, I got it immediately.

## 2. CORE TASK — worked, with one real gotcha
Pasted a 5-item client-presentation rundown. The moment I typed, a "RUNDOWN · 5 ITEMS ·
55 MIN TOTAL" table appeared with computed clock times per item — that's the moment it
clicked. "Click any name or time to edit · reorder with arrows" is good labeling.
- **Edit duration:** clicking "20m" turns it into an input. WORKS. **BUT the field does
  NOT select-all on focus** — cursor lands at the END of "20". I clicked to change it,
  typed "25" expecting a replace, and got "2520" (a 42-hour item). On the live screen that
  exploded the projected times into garbage (item showing "2520m", times wrapping to the
  wrong day). When I cleared the field first, 25m worked perfectly: planned 12:10 -> proj
  12:09, projected end recalculated correctly. This will bite anyone editing in a hurry.
- **Reorder (arrows), Delete (×), Add item:** all worked, order updated correctly, aria
  labels are clear ("Move Logo options up").
- **Start show:** big "1 min ahead — WHOLE-SHOW DRIFT" banner, current item with live
  countdown ("4:59 of 5 min planned"), and a planned -> projected reflow table. Space=next.
  Copy current link works (read-only co-facilitator view). "See a live example" loads a
  pre-running sample — smart for cold evaluation.

**Does drift/reflow earn its place over a phone clock glance?** Yes, marginally-to-clearly.
A phone clock tells me the time; it does NOT tell me "you're 1 min ahead and therefore Q&A
now starts at 12:39 instead of 12:40." That auto-reflow of every downstream clock time is
the actual value — it's the mental math I do badly mid-presentation. Worth it.

## 3. BIGGEST BLOCKER
The duration-edit field not selecting its contents on focus. It silently turned my "change
20 to 25" into "2520" and produced a broken live screen with no warning. For a paid-tool
replacement this is the difference between "trust it live in front of a client" and not.
No max-duration sanity guard either. Polish that and this is an 8-9.

```json
{"tester": 1, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 7,
 "topComplaints": ["Duration edit field doesn't select-all on focus — typing into '20' yields '2520', breaking the live projected times", "No sanity/max guard on a duration, so a fat-fingered value silently corrupts the whole reflow"],
 "priorConcernsAddressed": "n/a"}
```
