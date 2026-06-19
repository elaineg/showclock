# Showclock — Round 1 — Jules (content & community marketer, 50/50 mobile)

## 1. Cold open (advocacy 9/10)
Within 30s I knew exactly what it is: a zero-login live timer for a "show" with an agenda.
The h1 "Showclock" + subhead "Know exactly how far behind you are — and what time
everything starts now" + the placeholder agenda ("Welcome 5 / Intro - 10 min...") told me
instantly it's a run-of-show timer. The line "After Start, copy the URL to give a
co-facilitator a snapshot view" is LITERALLY my use case (weekly AMA + a co-host). No login,
opens on my phone — this is the thing I keep hacking together in a Notion table + my phone
clock. Yes, I'd use it today.

## 2. Core task (worked, fully, at 375px by tap)
On a 375px viewport I pasted my real AMA run of show into the textarea. It instantly parsed
into a "RUNDOWN · 5 ITEMS · 60 MIN TOTAL" list with computed start times and the hint "Click
any name or time to edit · reorder with ↑↓". Then by TAP:
- Edited a duration (tapped "25m" → inline number field → typed 20 → it became 20m and the
  start times reflowed). Worked.
- Renamed an item (tapped "Guest intro" → editable → "Guest spotlight"). Worked.
- Reordered (tapped ↑ on Community Q&A; it jumped above Main interview; top item's ↑ is
  correctly disabled). Worked.
- Removed last item (× → 5→4 items) and Added one (+ Add item → "New item 5m", back to 5).
- Tapped "Start show" → big-font live timer "4:59 of 5 min planned", "on time / WHOLE-SHOW
  DRIFT", planned→projected column, Back/Next, projected end time. Beautiful on a podium phone.
- "Copy current link" put a working URL on my clipboard; opening it as a co-host showed a
  TRUE read-only view (timer + reflowed times, no Back/Next/End edit controls) with an honest
  banner: "you're viewing a live read-only view... ask the host for a new link to pick up edits."
Zero console errors anywhere. Nothing broke. (Copy button label didn't flip to "Copied" but
the URL did land on the clipboard — verified, not a blocker.)

## 3. Biggest blocker on advocacy
Hard to find one. The only thing keeping it off a 10: the agenda lives in the URL hash, so a
co-host's read-only link goes STALE the moment I edit during a live show — I have to re-copy
and re-send a fresh link mid-stream. The banner is honest about it, but in a live AMA I won't
want to re-paste a link to my co-host while talking. A truly live-syncing link would make this
a 10. Tiny secondary nit: "Add at least one item to start" still showed under the (clearly
enabled-looking) Start button before I'd typed — momentary "is it on?" confusion, resolved
the instant I pasted.

```json
{"tester": 7, "round": 1, "clarity": "Yes", "value": "Yes",
 "advocacy": 9, "topComplaints": ["Co-host read-only link is a static snapshot — goes stale on mid-show edits, must re-copy/re-send", "Pre-paste 'Add at least one item to start' under an enabled-looking Start button caused a brief is-it-working pause"], "priorConcernsAddressed": "n/a"}
```
