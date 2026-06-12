# Showclock
Purpose: a paste-and-go run-of-show timer for workshop facilitators and event MCs that shows live ahead/behind drift and auto-reflows the clock times of remaining agenda items.
Problem: A workshop facilitator, trainer, or event MC runs multi-segment sessions weekly and does mental math mid-session ("we started Q&A 7 minutes late — what do I cut?").
Beats alternative: stagetimer.io free tier (verified: no session-length cap, but max 3 timers per room — a 6–12 item agenda needs Pro at $210/yr), Ontime (free, open source, genuinely capable, but a desktop/self-hosted install aimed at broadcast — real friction for a casual facilitator on a phone podium), or a spreadsheet of start times (free, stale the moment one segment runs long). Closest free no-signup threat is MeetingTimer.eu (re-verified 2026-06-12): multi-item agenda with auto-advance and a view-only link, but NO computed clock times, NO ahead/behind drift, NO auto-reflow of remaining items, and manual item-by-item entry only — drift + reflow + paste-to-parse + wall-clock times are exactly what this app adds.

Core flows:
1. Paste-to-plan: paste a free-text agenda (one item per line; parser tolerates "Intro 10", "Intro - 10 min", and "10 Intro"), pick a start time (defaults to the next 5-minute mark), and instantly see the parsed rundown — item name, duration, and planned wall-clock start time for every item, recomputed live as the text or start time changes. Unparseable lines are flagged inline without breaking the rest.
2. Presenter view with drift + reflow: hit Start to enter a large-type presenter view showing the current item, its countdown, a signed drift badge ("on time", "N min ahead", "N min behind"), and the remaining items with BOTH planned and projected wall-clock start times. Pressing Next records the actual start of the following item; drift = actual minus planned start (and keeps growing live once the current item overruns its duration), and all remaining projected times reflow by the current drift. A Back control undoes an accidental Next.
3. Share URL for co-facilitators: agenda, start timestamp, and per-item actual-start marks are all encoded in the URL (updated on every Start/Next), so copying the address into another tab or device shows a read-only view — same current item, countdown, drift, and reflowed times, derived entirely client-side with no controls and no backend. Reloading the presenter URL restores the running session.

Success checks:
- Pasting "Intro 10\nDemo - 20 min\n15 Q&A" shows three rows named Intro, Demo, Q&A with durations 10, 20, 15 and cumulative planned clock times (with a 9:00 AM start: 9:00, 9:10, 9:30) before Start is pressed.
- Adding a line "just some words" flags that line as unparsed while the other rows keep their computed clock times.
- Changing the start time from 9:00 to 9:30 immediately shifts every planned clock time by 30 minutes.
- Clicking Start shows a presenter view with "Intro" as the current item, a countdown ticking down from 10:00, and a drift badge reading on time / 0 min.
- Clicking Next about 9 minutes early (i.e. immediately after Start on the agenda above) shows a drift badge of "9 min ahead" (±1 min) and remaining items whose projected clock times are ~9 minutes earlier than their still-visible planned times.
- Letting the current item run past its duration flips the drift badge to "behind" and increases it as time passes, with remaining projected times shifting later accordingly.
- Copying the presenter URL into a second browser tab (or incognito window) shows the same current item, drift, and reflowed times with no Start/Next/Back controls visible.
- Reloading the presenter tab mid-session restores the same current item and drift from the URL alone (works with the network tab showing no API calls for state).

Out of scope:
- No accounts, login, or saved rundown library; no backend or database — all state lives in the URL.
- No live sync server: the co-facilitator view reflects the URL it was opened with (refresh/re-copy to update), not a real-time socket feed.
- No editing the agenda mid-show (beyond Back/Next), no pause, no per-item time adjustments after Start.
- No audio cues, speaker messages, themes, or CSV/ICS import-export.
- No sub-minute drift precision guarantees; drift is displayed in whole minutes.

Production URL: https://showclock-nu.vercel.app
