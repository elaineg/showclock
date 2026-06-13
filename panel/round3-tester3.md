```json
{"tester":3,"name":"Wen","clarity":"Yes","value":"Yes","advocacy":9,"prior_addressed":"Yes","biggest_blocker":"Off perfect only because 'ahead/behind' is still measured vs the typed start time, not the actual clock — starting early shows '2 min ahead' before anything has happened; wants a tooltip."}
```

# Wen — Marketing data analyst (weekly 6-segment data-literacy training)

## PRIOR CONCERNS ADDRESSED — Yes
My round-2 nit was that the on-screen label silently shortened my typed text — "90 second
teaser" rendered as just "teaser" with no flag, which made a data-hygiene user double-take
("where did my words go?"). **Fixed, and fixed the right way.** Each rundown row now shows
the PARSED DURATION inline next to the trimmed name:
- "90 second teaser" → **teaser · 2m**
- "1h Keynote" → **Keynote · 60m**
- "Q&A 15" → **Q&A · 15m**
- "1 hour deep dive" → **deep dive · 60m**

The `· 2m` is exactly the missing piece. The label still renders the name minus the duration
token, but now I can SEE that the token wasn't dropped — it was consumed to produce the 2m
shown right beside it. The transform is no longer invisible; the math is on screen. That
satisfies my bar.

Junk lines stay honest: "Break", "SegmentX 5 furlongs", and "Top 10 SQL mistakes" are
struck through with a red "couldn't parse — try '10' or '10 min'" flag and excluded from the
header count ("RUNDOWN · 4 ITEMS · 137 MIN TOTAL"). "Top 10 SQL mistakes" is correctly NOT
grabbing the "10" as minutes — the first-number-grab footgun from round 1 is still gone.

## 1. CLARITY — Yes
Unchanged and clear: "Showclock / Know exactly how far behind you are — and what time
everything starts now." Under 5 seconds to explain to a colleague.

## 2. VALUE — Yes
Still beats my Sheet + phone-timer combo for the live "am I behind" read. Two trust anchors
confirmed this round: (a) the new inline `· Nm` makes every parse auditable at a glance, and
(b) I decoded the share-link fragment again — it stores `"t":"90 second teaser\n1h
Keynote\nQ&A 15"`, my verbatim text, not the parsed form. Copy link returned the real URL.
Source of truth is preserved AND the transform is now visible. That's the combination that
flips a distrustful analyst.

## 3. ADVOCACY — 9
Up from 8. The display-transparency leftover is resolved cleanly, so I'd now bring this up
unprompted in my training-ops crowd. Not a 10 because of one honest leftover: "ahead/behind"
is still measured against the TYPED start time, not the actual clock — I loaded a 10:35 start
and it immediately read "2 min ahead" before the session had even begun. It's a defensible
modeling choice, but for a literal-minded data person it reads as a phantom number until a
tooltip explains "drift vs. planned start." Add that one tooltip and it's a 10.
