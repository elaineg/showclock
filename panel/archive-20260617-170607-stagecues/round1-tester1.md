```json
{"tester":1,"name":"Priya","clarity":"Yes","value":"Yes","advocacy":8,"biggest_blocker":"No keyboard shortcuts for Next/Back — I'm driving this from the lectern, not the trackpad."}
```

# Priya — Senior backend engineer, demo-day MC

## What I did
Landed cold. Header "Showclock" + subhead "Paste your run-of-show, hit Start, and always
know if you're ahead or behind. No accounts — the whole session lives in the URL." told me
exactly what it is in under five seconds. The "lives in the URL" claim is a bold one, so my
first instinct (per usual) was to call BS and watch the network tab.

I pasted my real demo-day agenda — 8 lightning talks plus a buffer and wrap, in deliberately
inconsistent formats: `Welcome 3`, `Talk 1 - 8 min`, `Buffer 5`, `Wrap-up 4`. It parsed
every one correctly, gave me a live "RUNDOWN · 11 ITEMS · 76 MIN TOTAL" and computed clock
times (9:55 → 11:07 PM). The `next 5-min mark` helper to snap the start time is a nice
keyboard-saver. Hit Start show, got a giant countdown, a "2 min ahead" pill, and a
planned→projected rundown that recomputes the whole schedule from my actual drift. Next
struck through the finished item and shifted every projected time. This is exactly the
"keep the slots honest" behavior I run demo day for.

## The trust check (this is what sold me)
Captured all network traffic across the full flow. **Zero third-party requests. Zero requests
of any kind after initial load.** State is base64 in the URL *fragment* (`#eyJ0...`), which by
spec never leaves the browser — it doesn't even reach Vercel's server. Console clean, no
errors. I'd put this on the projector without hesitation. The "Copy view-only link" produced
a full self-contained URL (verified the string; clipboard read confirmed). I reopened that URL
in a second tab and it rehydrated the exact same show. That's a legit co-facilitator handoff
with no backend.

## What frustrates me
- **No keyboard shortcuts.** I'm standing at a lectern advancing slides; reaching for a
  trackpad to click Next is the one thing that'll annoy me live. Spacebar = Next, arrow keys
  = Back/Next would make this a 9.
- The share URL is ~337 chars of base64. Functional, but I can't eyeball-verify or hand-type
  it; fine since I copy it, just noting it's not human-readable.
- Minor: "projected end 11:08 PM" vs Wrap-up projected 11:04 PM read as inconsistent for a
  second until I realized one tracks live wall-clock. A tiny label would remove the
  double-take.

## Verdict
Today I'd cobble this together with a phone timer plus a hand-computed spreadsheet of slot
times, then mentally re-add drift after every overrun — error-prone and I always lose the
thread by talk 5. Showclock does the drift recomputation for me, client-side, no signup. It
genuinely saves me real effort every month. The only thing keeping it off my "9, tell the
team unprompted" shelf is the lack of keyboard control for a tool that's literally used
hands-on-keyboard at a podium.
