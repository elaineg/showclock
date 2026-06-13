```json
{"tester":4,"name":"Tomás","clarity":"Yes","value":"Yes","advocacy":8,"biggest_blocker":"The 'behind' pill keys off real wall-clock vs. the typed start time, so landing cold it screams '472 min behind' and looks broken to a wary analyst"}
```

# Tomás — Operations analyst, Edge on locked-down corp laptop

## Clarity — Yes
Five seconds in I got it. The h1 "Showclock" plus the subline "Paste your run-of-show, hit
Start, and always know if you're ahead or behind. No accounts — the whole session lives in
the URL" told me precisely what it is and that it's for someone running a timed meeting.
The phrase "No accounts" and "the whole session lives in the URL" is the line that made me
relax — that's literally my buying criterion. The agenda placeholder ("Intro 10", "Demo - 20
min") showed me the input format without a tutorial.

## Value — Yes
Today I run the weekly ops review off a printed 45-min agenda and glance at my phone clock,
doing the "are we behind" math in my head. That math is exactly where I slip. This computes
planned vs. projected end time per item, strikes through finished items, and gives a live
countdown — Next/Back worked instantly and the rundown re-projected every item's end time.
The thing that actually sells me: I watched the network tab and there were ZERO POST/PUT
requests on Start AND on opening the shared link. The agenda is base64 in the URL hash. I
can paste a real (lightly sanitized) ops agenda and nothing leaves the browser — that clears
IT and my own paranoia in one move. The "Copy view-only link" handing a co-facilitator a
read-only timer is a genuine upgrade over me narrating "we have 3 minutes left" on Teams.

## Advocacy — 8
I'd bring this up in my next ops sync, but two things hold it back from a 9–10:
1. The "behind" math confused me hard on first contact. I typed start time 2:00 PM while
   testing in the evening, and it shouted "472 min behind" in an alarming orange pill, with
   the rundown projecting a 10:37 PM end. I worked out it's comparing the typed start to the
   ACTUAL current time — so in real use (start the show at meeting time) it'd read on-track.
   But a cautious user's first reaction is "this is broken," and that's a trust killer. It
   should anchor "behind" to elapsed time since I hit Start, or grey the pill until the clock
   passes the start time.
2. No way I saw to pause/stop the timer mid-meeting (we get derailed constantly) or nudge an
   item +2 min on the fly — and no audible/visual alert when an item's time is up. For a
   strict 45-min agenda I want a "you're over, move on" cue, not just a number ticking past.

Format parsing was excellent — it read "5 min", "- 10 min", and trailing/leading numbers all
correctly across my 6 items. Mechanics are solid; the on-track logic and a couple of live
controls are what stand between this and a tool I'd put in our ops runbook.
