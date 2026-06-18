# Marcus — Frontend engineer (panel round1)

## (1) Purpose clear within 5s? — Yes
Headline "Showclock" + "Know exactly how far behind you are — and what time everything starts now"
+ a pre-filled agenda textarea told me instantly: paste a run-of-show, get a live drift timer.
"See a live example" is a great cold-start affordance. I knew what to do without thinking.

## (2) Valuable to me (bi-weekly sprint demo MC + co-host link)? — Yes
Today I MC the sprint demo off a Notion doc and eyeball my phone clock — constant mental math
on "are we behind?". Showclock does that math for me: pasted "Intro 1m / Demo 5m / Q&A 3m", hit
Start, and got a big-type countdown + a "X min ahead/behind" drift chip + a rundown showing
projected vs planned end times. That last part (projected end 7:41 PM) is the thing I actually
want on a shared screen. Real time saved over my Notion-doc-plus-clock habit.

## STAGE CUES — explicit checks
- **Sound toggle findable fast?** YES. "🔔 Sound: Off" is a labelled pill top-right of the running
  view, default Off. Found it in ~2s, no hint. Toggles to "🔔 Sound: On" cleanly, zero console errors.
- **Noticed band color change?** YES, all three. GREEN (Demo 5:00 of 5min, full green card) →
  AMBER (0:24 of 2min, vivid amber, the final ~20%) → RED (+0:36 over planned, rose-red). The
  card backgrounds are big and unmissable on a shared screen — exactly what an MC wants peripherally.
- **Shared URL works?** YES. "Copy current link" yields the same URL with a `.ro` read-only suffix.
  Opened it in a clean browser (no host state): identical running view, a calm "You're viewing a
  snapshot — ask the host to re-share" banner, Back/Next correctly hidden so a co-host can't hijack
  my run. And the countdown KEEPS TICKING live from the baked start timestamp (verified 4:50→4:47).
  I'd drop this in team Slack without hesitation.
- **Pulse calm vs strobe?** CALM. RED card runs `cue-pulse` at 1.2s — a slow breathe, not a strobe.
  Won't induce a seizure on the projector. Good restraint.
- **CSS jank?** Almost none. Big JetBrains-mono countdown, clean rounded cards, consistent spacing.
  Nit: the colon in "0:24" doesn't use tabular figures so the digits shift ~1px each tick — I notice
  it because I'm picky; nobody else will. No layout shift, no FOUC, clean on 1440px.

## What holds back the score
The co-host link is a SNAPSHOT, not a live mirror — the countdown ticks, but the moment I press
Next or edit the agenda, my co-host is stale until I re-copy/re-send the link. For a fast-moving
demo with many items that means re-pasting into Slack every item. A genuinely live presenter URL
(or auto-updating link) would push this to a 9. Also: clipboard read was blocked in my headless
test env, but the Copy handler fired and produced the `.ro` URL — copy verified, env artifact, not a bug.

## (3) Advocacy: 8/10
Genuinely good. I'd share it in Slack for our next sprint demo today. The three-band cues + drift
chip + projected-end rundown nail the MC's core anxiety, and the craft (1.2s pulse, no jank) shows
care. It's an 8 not a 9 only because the co-host share is a re-share-on-every-step snapshot rather
than a live link — that's the one rough edge for my exact two-host workflow.

```json
{"tester": 0, "round": 1, "clarity": "Yes", "value": "Yes",
 "advocacy": 8, "topComplaints": ["Co-host share link is a snapshot that goes stale on Next/edit — must re-copy into Slack every item; not a live mirror", "Countdown digits not tabular-figures so they jitter ~1px each tick (pedantic nit)"], "priorConcernsAddressed": "n/a"}
```
