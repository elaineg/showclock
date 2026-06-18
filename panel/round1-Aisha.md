# Aisha — Product designer (panel round1)

**(1) Purpose clear in 5s? Partially.**
"Showclock" + "Know exactly how far behind you are — and what time everything starts now."
told me it's a timing tool, and the pre-filled agenda + "Start show" let me infer "agenda
timer for whoever runs a session." But the framing is all about DRIFT ("how far behind",
"reflow every clock time") — it reads like a run-of-show/AV tool for an MC with clock-time
slots, not obviously a *workshop timebox* timer. I'd explain it to a friend as "a presenter
clock that shows if your run-of-show is ahead/behind and recomputes when each item lands."
Confusing word: "drift" in the subhead is jargon I had to translate.

**Craft of setup screen:** flat. Left-aligned, no card/container, generic system fields. The
disabled "Start show" renders as a washed-out mint that reads *broken*, not *waiting* — a
considered tool would use a neutral grey or a filled-but-muted state. Empty state is just a
placeholder agenda; fine, but unremarkable.

**(2) Valuable to me (timeboxed FigJam workshops)? Marginal.**
Today I run a FigJam timer + a Loom-style mental clock and eyeball my phone. Showclock's
real idea — reflowing every item's *clock time* live as I drift — is genuinely better than my
FigJam timer, which only counts the current box and never tells me "critique now starts 7:54
instead of 7:56." That rundown is the best thing here. But it's clock-time/run-of-show shaped;
my workshops are duration-shaped ("15-min sketch"), and I don't care what wall-clock time
sketch ends — I care it ran 15:00. So I'm re-reading clock columns I don't need.

**STAGE CUES verdict (the thing I was asked to judge as a craft object):**
- **Band considered vs garish:** CONSIDERED. Green=emerald, amber=warm orange, red=crimson,
  full-bleed card, big mono numerals, white text with solid contrast. Reads cleanly across a
  room. A true traffic-light, not a rainbow.
- **Pulse calm vs strobe:** CALM. `cue-pulse` = opacity 1 → 0.72 → 1, 1.2s, ease-in-out,
  infinite. It *breathes*, never flickers or hits low opacity. This is the restrained pulse a
  facilitator wants — I would not be annoyed glancing at it mid-room. Best-crafted detail here.
- **Sound toggle:** Found in <5s, top-right "🔔 Sound: Off", default Off (correct). Clear
  label, flips Off→On cleanly. Pill styling is plain but fine. Good.
- **Calm-glanceability:** mostly yes — EXCEPT one real flaw: the top status chip ("on time" /
  "4 min ahead", whole-show drift) can directly CONTRADICT the item band. I watched a GREEN
  "on time" chip sit above a fully RED band reading "+0:06 over the planned 1 min." Two timing
  signals disagreeing in one glance is exactly what breaks a facilitator running a room.
- Also: a 1-min timebox shows **full AMBER from second one** (60s floor = the whole minute is
  "warning"). For a normal short warmup that's a false alarm.

**(3) Advocacy: 6/10.**
The reflow rundown is a real insight and the cue band/pulse are genuinely well-crafted — calm,
legible, restrained. What holds it back from a 7+: (a) it's framed/shaped as run-of-show
clock-time, not workshop durations, so it's adjacent to my job not made for it; (b) the
chip-vs-band contradiction undercuts the "glanceable" promise; (c) the setup screen and
disabled-button state feel unfinished next to the polished presenter view. Fix the
chip/band conflict and the 1-min amber, lean the copy toward durations, and this jumps to an 8.

```json
{"tester": 0, "round": 1, "clarity": "Partially", "value": "Marginal", "advocacy": 6, "topComplaints": ["Top drift-chip (e.g. 'on time'/'4 min ahead') can contradict the item band (full RED 'over planned') in the same glance — breaks glanceability", "Framed as run-of-show clock-time, not workshop durations; I re-read clock columns I don't need for '15-min sketch' timeboxes", "1-min item shows full AMBER from second one (60s floor); setup screen + washed-out disabled 'Start show' read unfinished vs the polished presenter view"], "priorConcernsAddressed": "n/a"}
```
