# Priya — Senior backend software engineer (panel round1)

## (1) Purpose clear within 5 seconds? YES
"Showclock — Know exactly how far behind you are — and what time everything starts now."
plus a pre-filled agenda textarea and a "Start show" button. I knew instantly: paste an
agenda, it runs a live run-of-show clock with drift. The "See a live example" button is a
nice escape hatch for skeptics like me — I'd click it before committing my own agenda.

## Skeptic check (the thing I actually care about): PASSED
First thing I did was watch the network tab. Cold load = page + fonts + Next chunks, nothing
else. After Start: ZERO external requests across a full 60s+ run — no analytics, no beacons,
no API. State is encoded in the URL hash (`#eyJ0...` base64 agenda). The "Copy current link"
shares a snapshot by URL, no server. I would trust this on the projector. This is the single
biggest reason I'd actually use it.

## STAGE CUES feature
- Sound toggle: FOUND IN <2s, no hint. Top-right, "🔔 Sound: Off". Default Off (correct —
  I do NOT want a surprise beep on the demo-day projector). Toggled it → "🔔 Sound: On",
  clean. Beep is WebAudio (no network), fires at time-up; couldn't hear it headless but the
  toggle and label behavior are correct. (Audio not audible in test env, not a bug.)
- Color band: I NOTICED IT clearly. emerald-500 GREEN at full time → amber-400 AMBER in the
  final stretch → bright RED on overrun showing "+0:03 over the planned 1 min". White text on
  all bands, big numerals. Smooth `transition-colors` so it doesn't jump jarringly.
- Pulse on RED: CALM, not a strobe. Keyframe is opacity 1.0↔0.72 over 1.2s ease-in-out. It
  breathes, never flashes to black or changes hue. Readable from across a room, won't trigger
  anyone. Good restraint — I expected an obnoxious blink and was relieved.
- EDGE CASE worth flagging: a 1-minute item renders AMBER the instant it starts (0:59),
  because the amber window = final 20% w/ 60s floor, and a 1m item is entirely inside the
  floor. Technically correct but means short items never show green — mildly confusing the
  first time. Minor.

## (2) Valuable to ME (monthly 8-talk demo day)? YES
Today I keep 8 slots honest with a phone stopwatch + a Slack message of start times I
recompute by hand when we run long. This does exactly the recompute I do manually: the
RUNDOWN reflows projected clock times live as we drift ("planned → projected"). The
across-room band means my speakers self-police without me waving. Space=next / ←=back is
keyboard-first, which I require. No signup, paste-and-go in one session. This replaces both
my stopwatch and my manual time math.

## (3) Advocacy: 8/10
I'd bring this up unprompted to other facilitators — "no signup, fully client-side, run-of-
show timer with a reflow." That's rare and it earns the mention. Not a 9/10 because: (a) the
1m-item-always-amber behavior tripped me; (b) I want a per-item or full-screen "stage" mode
that hides the rundown and shows only the giant band+clock for the projector — right now the
presenter view still shows the rundown table, which is busy from across a room; (c) couldn't
verify the beep audibly, and for a projector demo the audio cue is the part I'd most want to
trust. Fix the full-screen stage view and this is a 9.

## Summary (5 lines)
- Purpose clear in <5s; client-side claim verified in network tab (zero external calls) — earns my trust.
- Sound toggle found in <2s, default Off (correct); band GREEN→AMBER→RED noticed clearly, white-on-color, big.
- RED pulse is CALM (opacity 1.0↔0.72, 1.2s ease) — breathes, not a strobe; room-readable.
- Replaces my phone-stopwatch + manual start-time recompute for monthly 8-talk demo day. Valuable: YES.
- Advocacy 8/10 — wants a projector-only full-screen stage mode; 1m items render amber-from-start.

```json
{"tester": 0, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["No full-screen projector-only 'stage' mode — presenter view still shows the busy rundown table, hard to read across a room", "A 1-minute item renders AMBER from the very start (0:59) because the 60s amber floor swallows the whole item — confusing first time", "Couldn't audibly verify the time-up beep in test env; it's the cue I'd most want to trust on a projector"], "priorConcernsAddressed": "n/a"}
```
