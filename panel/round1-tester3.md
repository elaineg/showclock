```json
{"tester":3,"name":"Wen","clarity":"Yes","value":"Yes","advocacy":7,"biggest_blocker":"Silent misparse: '90 second teaser' read as 90 MIN with the label mutated, no flag — the one thing I came to verify, it fails on."}
```

# Wen — Marketing data analyst (run-of-show for weekly data-literacy training)

## 1. CLARITY — Yes
Headline "Showclock" plus "Paste your run-of-show, hit Start, and always know if you're ahead or behind. No accounts — the whole session lives in the URL." told me exactly what it is and that it's for me in under 5 seconds. The placeholder examples ("Intro 10", "Demo - 20 min", "15 Q&A") immediately signaled the input format. I run a weekly 6-segment training; this is squarely my use case.

## 2. VALUE — Yes (with a real caveat)
Today I keep my rundown in a Google Sheet with a manual cumulative-time column and glance at a phone timer. This recomputes projected clock times for every segment live, and the presenter view's "planned → projected" column (9:55 PM → 9:52 PM per row) is exactly the drift transparency I want — I can see the math, not just a verdict. Unparseable lines ("Break", "this line has no number at all") are FLAGGED with a red "couldn't parse" pill and shown struck-through, not silently dropped, and they correctly contribute 0 min so the clock doesn't shift. That earns trust. State living in an inspectable base64 URL fragment, copyable as a view-only link (copy verified — clipboard returned the link), fits my no-account, CSV-portable instinct. This beats my sheet for the live "am I behind" read.

## 3. ADVOCACY — 7
I distrust invisible transforms, and I caught two:
- **TRUST-KILLER:** I typed `90 second teaser`. It parsed **90 MIN** and silently rewrote the label to "second teaser" — no "couldn't parse" flag, and it inflated my total to 148 min. It grabs the first number and assumes minutes when there's no trailing number. For a tool whose whole pitch is "match what I pasted," guessing wrong AND mutating my label with no warning is the exact thing I won't forgive.
- `Looker walkthrough 1h` → "couldn't parse." It doesn't understand hours, a completely normal duration format. At least it flagged this one, but a 60-min segment vanishing is a footgun.

Also minor: "ahead/behind" is measured against the planned start time you typed, not when you actually clicked Start, so starting early shows you "2 min ahead" out of the gate — defensible but worth a tooltip.

What it does right (flagging unparseables, transparent per-row drift, clean presenter view) is genuinely good. But for MY core need — "the parsed rundown matches exactly what I pasted, no silent reinterpretation" — it fails on units/ambiguity. Fix the silent number-grab (flag ambiguous lines, support "1h"/"90s", never mutate a label without surfacing it) and this jumps to a 9. As is, I'd use it but I'd double-check every line, which undercuts the time savings.
