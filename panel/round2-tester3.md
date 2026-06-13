```json
{"tester":3,"name":"Wen","clarity":"Yes","value":"Yes","advocacy":8,"prior_addressed":"Yes","biggest_blocker":"Display still shortens my typed label ('90 second teaser' renders as 'teaser') with no flag — harmless because the raw text is preserved in the link, but a data-hygiene user notices the on-screen label isn't what they typed."}
```

# Wen — Marketing data analyst (weekly 6-segment data-literacy training)

## PRIOR CONCERNS ADDRESSED — Yes
The dangerous silent MISPARSE is fixed. I retested my exact round-1 inputs:
- **"90 second teaser"** → parsed **2 min** (was 90 MIN). Correct sub-minute→~2m handling. Number is right now.
- **"1h" / "1 hour deep dive" / "2h"** → **60m / 60m / 120m**. Hours understood (was "couldn't parse"). "90 sec"/"90s" also → 2m.
- **Junk-unit / no-number line:** "Break" and "SegmentX 5 furlongs" are NOT silently dropped — in the edit view each shows a red **"couldn't parse — try '10' or '10 min'"** flag and is excluded from the timed run (0 contribution), so the clock doesn't shift. "Top 10 SQL mistakes" is also flagged rather than grabbing "10" as minutes — the round-1 first-number-grab footgun is gone. The presenter "ITEM 1 OF 9" count is just the parseable items; nothing vanished invisibly.

## 1. CLARITY — Yes
"Showclock / Know exactly how far behind you are — and what time everything starts now" plus the placeholder examples told me what it is and that it's mine in under 5s. Same clear read as round 1.

## 2. VALUE — Yes
Beats my Google Sheet + phone-timer combo for the live "am I behind" read: per-row planned→projected clock times (10:15 PM → 10:12 PM), a "2 min ahead" banner, transparent math. Two things now earn real trust: (a) unparseables are flagged not guessed, and (b) the shareable link stores my **verbatim** agenda text — I decoded the URL fragment and it contained `"90 second teaser\n1h deep dive\nQ&A 15"`, exactly what I typed, not the parsed form. For someone who distrusts invisible transforms, source-of-truth preservation is the thing that flips me. Copy link returned the real URL.

## 3. ADVOCACY — 8
Up from 7. The trust-killer is fixed. One remaining nit keeps it off 9–10: the on-screen label is silently shortened — "90 second teaser" displays as **"teaser"**, "Q&A 15" as "Q&A", "1 hour deep dive" as "deep dive". The parser strips the duration token wherever it sits and renders the remainder. It's consistent and the number is correct, and the raw text survives in the link, so it's cosmetic not corrupting — but a data-hygiene user does a double-take seeing a label that isn't what they typed, with no "(shortened from…)" hint. Show the original label, or flag that it was trimmed. Minor leftover: "ahead/behind" is still measured vs. the typed start time, not actual click time (starting early shows "2 min ahead" immediately) — defensible, worth a tooltip. Fix the label display and this is a 9 I'd bring up unprompted in my training slides.
