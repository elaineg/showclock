```json
{"tester":2,"name":"Marcus","clarity":"Yes","value":"Yes","advocacy":8,"prior_addressed":"Yes","biggest_blocker":"Still no true live mirror (accepted given backend-free), and a past start time still renders a scary '493 min behind' with no guardrail."}
```

## Marcus — Frontend eng, 2 yrs, devtools open, MCs the bi-weekly sprint demo

**CLARITY — Yes.** Same instant read as round 1, and the subhead got sharper: "Know exactly how far behind you are — and what time everything starts now." plus "Paste your agenda. We track the drift and reflow every clock time live." The new above-the-fold line "After Start, copy the URL to give a co-facilitator a snapshot view" sets the share expectation *before* I even click — exactly what was missing. Forgiving parser still ate "Demo - 20 min", "15 Q&A", "Wrap-up 5" with no fuss.

**VALUE — Yes.** The presenter view is genuinely demo-screen-ready: the "planned → projected" rundown is a real upgrade over round 1 — every row shows 10:15 PM → 10:13 PM so my co-host and I can both see when Demo *actually* starts now, not just the original plan. Big-type countdown ticks 4:59→4:56 with no CLS, no font-swap, zero console errors with devtools open. Beats my phone-stopwatch-plus-Notion-tab setup outright.

**PRIOR CONCERNS ADDRESSED — Yes.** My round-1 blocker was that the view-only link was a frozen snapshot masquerading as a live mirror. The reframing lands honestly and completely:
- Presenter view has a persistent **"Copy current link"** button with subtext **"Shares a snapshot of right now."** I confirmed it stays put after hitting Next (item advanced 1→2 of 5, button still there — one Playwright re-query whiffed transiently, but the button is genuinely persistent).
- The co-host viewer opens with an amber banner: **"You're viewing a snapshot — ask the host to re-share, or refresh, to see the latest."** and is correctly stripped of Back/Next controls (read-only).
- Re-copying after Next produces a fresh URL, so the "re-share on each agenda item" loop is frictionless: one click, drop in Slack, co-host refreshes.

I still *want* a true live mirror — but I accept it's impossible with no backend, and the honest framing plus one-click re-copy makes the co-host workflow actually workable. The pitch and the behavior now match, which is what killed my trust last time.

**Remaining nits.** The past-start-time footgun from round 1 is NOT fixed: set start to 2:00 PM in the past, hit Start, and you get a front-and-center "493 min behind" with no nudge to use "next 5-min mark." On a shared demo screen that's still a heart-attack. It's a one-line guardrail (clamp/ warn when start < now). Minor, but it's the kind of jank I notice.

**ADVOCACY — 8/10.** I'd bring this up in team Slack now — the snapshot framing fixed the thing that made me hold back. Not a 9 only because (a) re-sharing per item is still manual vs. the magic live link I dreamed of, and (b) the past-start "X min behind" scare is an easy fix they left on the table. Patch that guardrail and this is a clean 9.
