```json
{"tester":2,"name":"Marcus","clarity":"Yes","value":"Yes","advocacy":6,"biggest_blocker":"The 'view-only link' is a frozen snapshot, not a live mirror — my co-host won't see Next/Back without me re-pasting, which kills the one-link-in-Slack workflow I came for."}
```

## Marcus — Frontend eng, 2 yrs, devtools open, MCs the sprint demo

**CLARITY — Yes.** Five seconds in I knew exactly what this is. The h1 "Showclock" plus the subhead "Paste your run-of-show, hit Start, and always know if you're ahead or behind. No accounts — the whole session lives in the URL" did all the work. "No accounts" + "lives in the URL" is catnip for me — I instantly trusted I could just paste and share. The placeholder showing three input formats ("Intro 10", "Demo - 20 min", "15 Q&A") told me the parser was forgiving before I tested it. Zero confusion.

**VALUE — Yes (with a caveat).** Today I run sprint demos off a phone stopwatch and a Notion agenda in another tab, eyeballing whether I'm over. This computes per-item clock times the moment I paste — the live RUNDOWN preview (5 ITEMS · 45 MIN TOTAL, each row stamped with a wall-clock time) appeared *before* I even hit Start. That's genuinely better than what I do. The big-type countdown is the standout: clean monospace digits, no jank, no layout reflow when seconds tick (I watched 5:00 → 4:57 with devtools open — no CLS, no font-swap flash). That would look great on the shared demo screen. The parser ate "Intro & sprint goal 5", "Frontend demo - 15 min", and "15 Q&A"-style lines without complaint. Solid.

**What frustrated me.** Two things.

1. **The share is a snapshot, not a sync.** I copied the "view-only link" and opened it as my co-host in a clean context. It loads with a gray banner: "Snapshot view — shows the session as of when this URL was made. Re-copy the presenter's URL for the latest Next/Back state." That's the *exact* workflow I came for — drop ONE link in Slack so my co-host tracks along live — and it doesn't do it. Every time I hit Next, the link goes stale. I'd have to re-paste the URL into Slack on every agenda item. Honest labeling, but it quietly defeats the headline pitch.

2. **"472 min behind" the instant I started.** I set Start time to 2:00 PM and started the show late afternoon, and it immediately screamed an orange "472 min behind" pill on the big screen. Technically correct (I started 472 min after my planned 2 PM) but there's no guardrail when the start time is in the past — on a live demo screen that orange pill is a heart-attack. When I instead clicked the "next 5-min mark" helper it read a sane "2 min ahead." So the right path works, but the app lets you footgun yourself with no nudge, and the scary state renders front-and-center.

CSS-wise it's clean — good type scale, the green Start/Next buttons have proper contrast, the disabled-looking pale-green Start button before focus was the only slightly-off moment but it's fine. No console errors anywhere. Clipboard copy verified (returned the full hash URL).

**ADVOCACY — 6/10.** I genuinely like the countdown and the auto-computed rundown — I'd use it solo for my next demo. But I won't bring it up unprompted in team Slack until the view-only link is a *live* mirror, because "share the presenter link with a co-host" is the literal reason I'd reach for this, and right now that link freezes. Fix the live-sync (even a 5s poll of the hash, or a tiny shared-state backend) and the scary past-start-time pill, and this jumps to an 8–9.
