# Round 3 — Wen

**1. Purpose clear in 5s? YES.** "Know exactly how far behind you are — and what time everything starts now" + a pasteable agenda box told me instantly: a run-of-show timer for facilitators. "Paste your agenda. We track the drift and reflow every clock time live" nailed it.

**2. Valuable to me? YES.** I run a weekly 6-segment data-literacy training and currently eyeball a Google Sheet of start times + a phone timer. This reflows projected end times automatically and the planned→projected rundown is exactly the CSV-in/CSV-out transparency I demand. I'd use it weekly.

**3. Advocacy: 8.** The parse and drift math are honest and auditable — my main fear (silent reinterpretation) didn't happen. Held back from 9 by no real CSV/text export and no way to set per-item start without re-pasting.

## Badge / parsing checks (this round's protocol)
- **Parsing matched exactly.** Mixed formats ("- 5 min", bare "10", "Break 8 min", "- 15") all read correctly: 5/12/10/8/15/10 = 60 min total. Labels preserved verbatim, incl. "Segment 2: Dimensions vs metrics". No silent reinterpretation.
- **Color AGREES with words: YES.** "ahead" → blue, "on time" → green, and the by-design case (item RED "+0:40 over planned 1 min" while badge stays blue "2 min ahead") is clearly labeled WHOLE-SHOW DRIFT — internally consistent, not contradictory.
- **Drift moved LIVE during overrun WITHOUT pressing Next: YES.** As item 1 overran past 0, the badge dropped 3→2 min ahead on its own; NOW card flipped to red "+0:40 over the planned 1 min". Cushion shrinking each minute of overrun = correct, transparent math I could reconcile against the planned→projected column.

```json
{"tester": 3, "round": 3, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["No CSV/text export of the projected rundown for my records", "Can't set or nudge a per-item time without re-pasting the whole agenda"], "priorConcernsAddressed": "n/a"}
```
