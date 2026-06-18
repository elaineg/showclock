# Round 3 — Priya

**1. Purpose clear in 5s? YES.** H1 "Showclock" + "Know exactly how far behind you are — and what time everything starts now." plus a prefilled agenda placeholder told me instantly it's a run-of-show timer. No jargon, no signup wall.

**2. Valuable to me? YES.** I run an 8-talk monthly demo day and currently fake it with a phone stopwatch + mental math on "are we still on schedule." This does the math: per-item overrun band + a whole-show drift badge + projected end time that reflows live. Paste-and-go, keyboard-first (Space=next, ←=back). And the thing I actually gate on: **provably client-side** — network tab showed only `GET /` for the entire session; share link encodes the whole agenda in the URL `#fragment` (base64 JSON), no DB, no beacon, no API. I'd trust this on the projector.

**3. Advocacy: 9** — It does the one honest thing competing free timers don't (live whole-show drift, no signup, client-side), and it survived my skeptic checks. Not a 10 only because the default start-time auto-rounds to a 5-min mark which silently banks you "ahead" before anything happens — mildly confusing the first time.

**Badge color AGREES with words? YES.** Rode an item from -:56 through +5:04 over without pressing Next: ahead→blue, on-time→green, behind→amber, in lockstep. Never red-while-"ahead" or green-while-"behind".
**Drift moved LIVE during overrun? YES.** Ticked ahead → "on time" → "1/2/3 min behind" each sample with no Next press; projected end & rundown reflowed too.
**Legit red-item + green-show case:** correctly internally consistent — red "+0:21 over" item band sat next to a blue "2 min ahead" badge clearly labeled WHOLE-SHOW DRIFT. The label disambiguates it well.
