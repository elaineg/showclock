# Showclock — Round 1 — Tester: Elena (Eng manager, 8 reports, 30-sec patience)

## 1. COLD OPEN — what is it, would I use it? Advocacy: 8/10
**Yes, clear in ~10 seconds.** "Showclock — Know exactly how far behind you are — and
what time everything starts now. Paste your agenda. We track the drift and reflow every
clock time live." That headline IS my weekly all-hands problem in one sentence. The
pre-filled placeholder agenda ("Intro 10", "Demo - 20 min") told me the input format
before I had to think. "See a live example" reassured me I could try it with zero setup.
No signup, no nonsense — exactly the bar for something I open between meetings.
I run an all-hands and a monthly retro I always overrun; "reflow every clock time live"
is precisely what I lean over to my calendar clock for today.

## 2. CORE TASK — paste, edit, reorder, delete, start
Pasted my real 5-line agenda (mix of "Welcome & wins 5" and "Roadmap update - 15 min").
It **auto-parsed instantly** into a structured rundown: name, duration, computed clock
time per item, running total ("5 ITEMS · 45 MIN TOTAL"), with ↑↓ reorder, × delete, and
"Click any name or time to edit · reorder with ↑↓". No "Parse" button to hunt for — it
just happened. That's fast enough for me.
- Reorder (↑↓): worked, clock times reflowed immediately. Good.
- Delete (×): worked, total recomputed. Good.
- Edit name: clicked, typed, Enter — worked.
- **Edit duration: this is where I'd get burned.** Clicking "10m" opens an input but does
  NOT select the existing value — cursor lands at the end. So when I (hurried) click "15m"
  and just type "20", I get **"1520" → 2045 MIN TOTAL** garbage. I have to notice it,
  backspace the old digits, retype. For a 30-second-budget person tweaking a duration
  mid-prep, that's the one spot that made me distrust the numbers.
- Start show: instant. Big "2 min ahead / WHOLE-SHOW DRIFT" badge, current item with
  countdown, Next/Back (Space = next), and a live planned→projected list with a "projected
  end 12:32 AM". That running view is genuinely what I'd put on my second monitor. The
  "Copy current link / read-only view" for a co-facilitator is a nice bonus.
- Agenda saved in the URL so I can bookmark my all-hands rundown — that earns recurrence.

## 3. BLOCKER (single biggest)
The duration field not selecting-all on click. Editing a time — the single most common
edit I'd make every week — is a trap that produces a wrong total unless I manually clear
the old value. Fix = select-all on focus (or treat the field as overwrite). That alone
moves me from 8 to a confident 9.

```json
{"tester": 4, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8,
 "topComplaints": ["Duration edit field doesn't select-all on focus: clicking 10m and typing 20 yields 1020, wrong total until manually cleared", "Reorder is ↑↓ one-step-at-a-time clicks — fine for 5 items, tedious if I ever had a long retro agenda"],
 "priorConcernsAddressed": "n/a"}
```
