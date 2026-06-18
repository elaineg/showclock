```json
{"tester":1,"name":"Priya","clarity":"Yes","value":"Yes","advocacy":9,"prior_addressed":"Yes","biggest_blocker":"None that blocks — minor: projected-time column ordering reads oddly for a second; would like a 'fullscreen' key too."}
```

# Priya — Senior backend engineer, demo-day MC (round 2)

## Prior concern: keyboard shortcuts — FIXED
My round-1 8 had exactly one thing holding it back: no keyboard control for a tool used
hands-on-keyboard at a lectern. Re-checked that first, cold.

Drove the full flow and tested every key with the focus on the page, not a button:
- **Space = Next** — advanced. Verified view changed.
- **→ = Next** — advanced.
- **← = Back** — went back.
- **Backspace = Back** — went back.

And the hint is right there under the Next button: `Space = next · ← = back`. That's the
discoverability I'd want at a podium — I don't have to remember it, it's on screen. This is
the single change that moves me. I can now run all 8 talks without ever reaching for the
trackpad.

## Re-answered fresh
- **Clarity — Yes.** Header "Showclock" + "Paste your run-of-show, hit Start, and always
  know if you're ahead or behind. No accounts — the whole session lives in the URL." Still
  legible in under five seconds.
- **Value — Yes.** Pasted my mixed-format agenda (`Welcome 3`, `Talk 1 - 8 min`, `Talk 2 8`,
  `Buffer 5`, `Wrap-up 4`) — parsed all 5, "RUNDOWN · 5 ITEMS · 28 MIN", giant countdown,
  "3 min ahead" pill, planned→projected recompute. Beats my phone-timer + hand-computed
  spreadsheet, which I lose the thread of by talk 5.
- **Trust still holds.** Zero network requests after interaction (re-captured: 0). Console
  clean (0 errors). State stays in the URL fragment. I'd still put this on the projector.

## Remaining nits (none are blockers)
- The projected column briefly reads oddly — Talk 1's projected time printed earlier than
  Welcome's projected end on my first glance. It's the live wall-clock drift math, same
  thing I flagged round 1; a one-word label would kill the double-take. Cosmetic.
- I'd love a "fullscreen" keypress for the lectern, but that's a want, not a need.

## Verdict
Prior blocker resolved cleanly and visibly. Moving from 8 to **9** — I'd bring this up
unprompted at our next demo-day planning. The only reason it's not a 10 is the projected-
time label ambiguity, which is purely cosmetic.
