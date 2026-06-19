# Showclock — Round 1 — Priya (senior backend eng, keyboard-first, skeptical of new tools)

## 1. Cold open (30s)
**Clarity: Yes.** "Showclock — Know exactly how far behind you are, and what time everything
starts now. Paste your agenda. We track the drift and reflow every clock time live." I'd tell
a colleague: it's a no-signup, paste-a-rundown presentation timer that shows each slot's
real start time and how far ahead/behind the whole show is running. The placeholder
("Intro - 10 min", "15 Q&A") instantly told me it free-text parses durations — no form to
fight. That's exactly the format I'd type anyway. The "See a live example" affordance is a
nice low-commitment way to see it run before I trust it on the projector.
**Advocacy at cold open: 8.**

## 2. Core task — type, edit, start
Worked, and it impressed me.
- Typed my real 8-talk demo-day rundown (Opening 5 / Talk 1-5 / Break / Closing). All 8 parsed
  correctly, mixed formats ("Opening 5", "Talk 1 - 10 min", "Closing - 5 min") all handled.
- **Edit a duration:** changed "Talk 2 - 10 min" → "15 min". Reflowed correctly — projected
  end moved, every downstream start time recomputed.
- **Reorder / add / remove:** done by editing the textarea (moved Closing above Talk 2; it
  re-sorted). There's a "+ Add item" button on the editor too. NOTE: editing is text-only —
  there is NO in-place per-row editing or drag-to-reorder in the running show view. To change
  anything mid-show I hit "End & edit agenda", which correctly preserved my full agenda text
  for editing, then restart. That round-trip works but is a context switch.
- **Start:** show view is genuinely good — "ITEM 1 OF 8", big countdown, "4 min ahead /
  WHOLE-SHOW DRIFT", a planned→projected table for every slot, and keyboard nav
  (Space = next, ← = back). For a keyboard-first user driving from the back of the room,
  that's the right interaction.
- **Trust check (I always do this):** opened the network tab via Playwright request logging
  while typing, editing, starting, and copying the link — ZERO requests left localhost. State
  lives in the URL hash (base64 of agenda+start time), no backend call. "Copy current link"
  produced a hash URL; opening it in a fresh tab gave a read-only view (no editor textarea) —
  perfect for handing a co-facilitator. This is the thing that flips me from "maybe" to "yes":
  I can confirm it's fully client-side before it touches the projector. No console errors.

## 3. Biggest blocker
No live, in-place editing during the show. If a talk overruns and I want to trim the next
slot mid-show, I have to "End & edit agenda" (leaving the running clock view) and restart,
rather than nudge a duration inline. For back-to-back lightning talks that's the one moment
I'd actually need it. Secondary nit: reordering means hand-editing text lines — fine for me,
but no drag handles. Neither is a dealbreaker; both keep this off a 9/10.

**Advocacy: 8/10.** I'd recommend it to colleagues running demo days today. It does the core
job, it's keyboard-friendly, and I verified it's client-side. The missing live mid-show edit
is the only thing between this and "bring it up unprompted."

```json
{"tester": "priya", "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["no live in-place editing during the running show — must End & edit agenda and restart to adjust a duration mid-show", "reorder is text-line editing only, no drag handles"], "priorConcernsAddressed": "n/a"}
```
