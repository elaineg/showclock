# Wen — Marketing data analyst (panel round1)

## (1) Clarity — Yes (in 5s)
"Paste your run-of-show agenda; it shows the live countdown for the current segment and
recalculates the real clock-time each item now starts at, so you know exactly how behind
you are." Headline "Know exactly how far behind you are — and what time everything starts
now" plus the placeholder examples nailed it instantly. The "planned → projected" column
header in the rundown is what sold me as a data person — that's the drift made literal.

## Parse fidelity — EXACT (my top worry, passed)
Pasted "Welcome 1m / Segment A 8m / Segment B 8m / Segment C 8m / Exercise 10m / Wrap 3m".
Got "RUNDOWN · 6 ITEMS · 38 MIN TOTAL" (1+8+8+8+10+3=38 ✓). Every name preserved verbatim,
every duration shown beside its item, clock chain correct (7:35→7:36→7:44→7:52→8:00→8:10).
ZERO silent reinterpretation. This is the thing I distrust most in tools and it earned trust.

## Stage cues — all work
- Band: confirmed full GREEN → AMBER → RED cycle in real time. Overrun card reads
  "+0:07 over the planned 1 min" — honest, signed, no rounding games. Legible across a room
  (huge mono timer, full-card color fill).
- Sound toggle: found in <5s, top-right, default OFF as expected; toggled Off→On cleanly.
- Pulse: CALM, not strobe. Keyframe dips opacity 1→0.72 and back — a breathe, not a flash.
  I'd run this in front of a training room without worrying about photosensitivity.
- Two-layer drift (green/amber/red item card + separate "X min behind" banner + per-row
  projected times) is MORE transparent than one conflated number. I trust it.

## Nits
- A 1-min item is born AMBER (60s floor covers its whole duration). Defensible, but
  "Welcome" glowing amber at second 0 can read as "already behind" to a non-data user.
- "Copy current link": no error, but label never flips to "Copied" even with clipboard
  granted — facilitator gets no confirmation the snapshot link copied. (Verified handler
  fired; this is a real missing-feedback gap, not a clipboard env artifact.)

## (2) Value — Yes
Today I hand-build a Google Sheet with start-time formulas for my weekly 6-segment training
and babysit a phone timer. This replaces both: paste once, bookmark the link (agenda lives
in the URL), and the projected-end + per-item drift is computed for me live. Saves the
re-keying and the mental math every single week.

## (3) Advocacy — 8/10
I'd bring this up unprompted to other facilitators. The exact-parse + signed-overrun
transparency is exactly what a data person needs to trust an opaque timer. Not a 9/10
because: (a) the Copy-link gives no copied confirmation, and (b) no CSV/export of the
computed rundown — I live in CSV-in/CSV-out and I'd want to drop the projected schedule
into a sheet or share it as text, not just a bookmark URL.

```json
{"tester": 1, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["Copy current link shows no 'Copied' confirmation even with clipboard granted", "No CSV/text export of the computed rundown for sheet-native users"], "priorConcernsAddressed": "n/a"}
```
