# Tomás — Operations analyst (panel round1)

**Persona:** Ops analyst, runs a strict weekly 45-min ops review. Edge/Win, IT blocks installs, wary of pasting company data into random sites.

## (1) Purpose clear in 5s? — YES
Headline "Know exactly how far behind you are — and what time everything starts now" + the sub "Paste your agenda. We track the drift and reflow every clock time live" told me instantly: it's a run-of-show timer for facilitators. The agenda textarea is pre-filled with a sample, so I knew what to type. No "what is this" moment.
- **No-signup / client-side:** Confirmed cold — no login, no email, no account field anywhere. I instrumented the page: pasting my agenda + Start fired **zero requests to any non-localhost origin** (fully client-side). For someone who won't paste internal metrics into a random SaaS, this is the single biggest unlock. I'd actually trust this with a real agenda.

## (2) Valuable to me (weekly strict 45-min review)? — YES
Today I run the review off an Excel agenda + my phone's stopwatch, doing the "if blockers ran 4 min over, when does Wrap start?" math in my head. Showclock does that math live: the RUNDOWN showed every item's planned→projected clock time and a "projected end 8:17 PM" that reflows as I drift. That's the exact thing I fumble. It saves me real effort over my spreadsheet + stopwatch combo.

## (3) Advocacy: 8/10
I'd bring this up unprompted to the other facilitators on my team — no-signup + nothing-leaves-the-browser clears my IT/privacy bar, and the live reflow is genuinely better than my current habit.

### Stage cues (the new feature) — verdict
- **Band GREEN→AMBER→RED:** Works and is legible at a glance. On my 1-min "Roll call" item it opened AMBER (correct: 60s floor means a 1-min item is amber its whole life) and flipped to a vivid RED "+0:20 over the planned 1 min" at overrun. Reading the room from across the table, the color does the job.
- **🔔 Sound toggle:** Found in **~3s** with no hint — sits top-right next to the status band. **Default OFF** (good; I'd be mortified by a surprise beep mid-review). Toggled On cleanly, label flipped to "Sound: On", and I verified beeps fired at time-up and again on the ~30s overrun reminder. No JS errors.
- **Pulse calm vs strobe:** CALM. The red band animates `cue-pulse 1.2s ease-in-out` — a slow breathe, not a strobe. Right call for a meeting room; it draws the eye without causing anxiety.

### What holds it back from a 9 (be specific)
1. **Contradictory top status.** While my current item was bright-red 20s OVER, the big header still read **"on time"** in green (it tracks whole-agenda drift, which still projected to finish early). At a glance "on time" + a pulsing red item is a mixed signal — I had to reason out which clock each refers to. Label it so the two aren't visually fighting (e.g. "item over · agenda on time").
2. **Amber loses meaning on short items.** A 1-min roll-call is amber from second one, so amber stops signaling "wrap up soon" for my shortest items. Minor, but worth a note.

```json
{"tester": 1, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["Top status reads green 'on time' while the current item band is red/overrun — contradictory at a glance", "Amber band loses signal value on sub-2-min items (amber from the start)"], "priorConcernsAddressed": "n/a"}
```
