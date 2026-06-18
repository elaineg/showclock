# Sam — Product manager (panel round1)

Tested cold on mobile (375px), the device I actually use between meetings.

## (1) Purpose clear in 5s? — Yes
I'd tell a friend: "Paste your meeting agenda, it runs a live timer per item and shows you
how far behind/ahead you are and what time everything will *actually* start now." The H1
"Showclock" plus "Know exactly how far behind you are — and what time everything starts now"
nailed it instantly. The pre-filled agenda example + "next 5-min mark" link made the input
obvious. Nothing confused me on the landing page.

## (2) Valuable to me (sprint planning, share link, look organized)? — Yes
Today I run sprint planning off a Notion doc with the agenda and just *eyeball* a phone
timer — when "Story review" runs long I'm doing math in my head about whether we'll still
finish Commit by the hour. This does that math live. I pasted "Intro 1m / Capacity 8m /
Story review 20m / Commit 10m" → it parsed to 4 items / 39 min and showed a RUNDOWN with
**planned → projected** times that visibly reflowed when item 1 overran (every downstream
row shifted earlier/later). That reflow is exactly the "the room trusts the schedule" thing
I wanted. Real save over my Notion + phone-timer habit.

## STAGE CUES verdict
- **Band change noticed?** YES. 20-min item opened GREEN (19:59), goes AMBER in the final
  stretch, flips RED on overrun showing **+0:06 over the planned 1 min** (counts UP). Color
  change is a smooth 300ms fade, very legible at arm's length.
- **Pulse calm vs strobe?** CALM. Red band animation is `cue-pulse`, 1.2s ease-in-out,
  infinite — a slow breathing fade, not a jarring strobe. Good for a live room.
- **Sound toggle findable in 5s?** YES — "🔔 Sound: Off" sits top-right of presenter view,
  default OFF as expected. Toggled to On with one tap.
- **Share link works?** YES. "Copy current link" copied a real URL (clipboard verified, not
  blocked). Opened it in a fresh browser = the live running view: red overrun band, "3 min
  ahead" status, reflowed rundown — and it's genuinely LIVE (clock ticked +0:10 → +0:15
  over 5s). Reflow visible in the shared view too.

## The one thing that bugs me (sharer hat)
The shared link shows a yellow banner: **"You're viewing a snapshot — ask the host to
re-share, or refresh, to see the latest."** But it's NOT a snapshot — it was ticking live in
front of me. Telling my room "this is stale, refresh it" when it's actually live undercuts
the whole "the room trusts the schedule" promise. Either drop the banner or make it honest.
Also the helper text "Shares a snapshot of right now" reinforces the wrong mental model —
as a PM I'd hesitate to drop that link in Slack thinking it freezes.

## (3) Advocacy: 8/10
Genuinely useful, legible, calm cues, no signup — I'd bring it up in my next planning prep.
Held back from 9 by the snapshot-vs-live confusion: the share story is the feature I care
about most as a sharer, and the copy actively misdescribes what the link does. Fix that
messaging and it's a 9.

```json
{"tester": 2, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["Shared link says 'viewing a snapshot — refresh to see the latest' but it's actually live-ticking; misleading for the sharer", "'Shares a snapshot of right now' copy makes me think the link freezes, so I'd hesitate to drop it in Slack"], "priorConcernsAddressed": "n/a"}
```
