# Showclock — Round 1, Tomás (Ops analyst, Edge/Windows, Excel+Tableau+Jira)

## 1. COLD OPEN (advocacy 8/10)
**Yes, clear in 30s.** Headline "Know exactly how far behind you are — and what time
everything starts now" + "Paste your agenda. We track the drift and reflow every clock
time live" told me immediately: it's a run-of-show timer for someone facilitating a
timed meeting. That IS me — I run a strict 45-min weekly ops review. The placeholder
agenda ("Intro 10", "Demo - 20 min") made the input format obvious. I'd use it today.
Two small cold-open snags: the greyed sample text in the box looked like real content,
but "Start show" was disabled with "Add at least one item to start" — mildly confusing
until I typed. Also "showclock" reads slightly broadcast/AV, not "meeting," but the
subhead recovers it.

## 2. CORE TASK — paste, edit, reorder, add/remove, start: ALL WORKED
Pasted my real 6-item ops rundown ("Roll call & last week actions 5 / KPI dashboard
review - 10 min / ..."). It instantly parsed all 6, computed "6 ITEMS · 45 MIN TOTAL"
and projected a clock time per item. It read both "5" trailing and "- 10 min" formats
correctly — no re-entry, which is the whole win over my current method.
- **Edit duration:** clicked "12m" → inline editable field (aria "Edit duration:
  12 minutes"). Replaced with 20 → total recomputed 45→53 min, all downstream clock
  times reflowed. Discoverable via "Click any name or time to edit."
- **Reorder:** ↑/↓ arrows per row, properly aria-labeled. Moved Incident retro above
  KPI — and it updated BOTH the table AND the raw paste box in sync. Excellent: no
  ambiguity about which view is the source of truth.
- **Add / remove:** "+ Add item" appended an editable "New item" row (6→7); "×"
  removed cleanly. Both reflected in the textarea too.
- **Start:** running view is exactly my lane — giant "on time" drift badge, current
  item with 5:00 countdown, "NOW · ITEM 1 OF 7", Next/Back (Space/← shortcuts),
  full planned→projected clock table + "projected end 12:39 AM". Zero console/page
  errors throughout.
Note: an earlier select-all-replace produced "2012m" — that was MY keystroke quirk,
not the app; a clean replace gave the right number. Not a defect.

## 3. BLOCKER (what caps me at 8, not 9-10)
**The data-safety story is real but undersold for a wary corporate user.** I verified
it myself: agenda lives in the URL hash, ZERO server/POST requests — genuinely
client-side, which is exactly why a browser tool clears my IT bar. But the app never
SAYS this. For someone pasting internal agendas, "no login, nothing sent to a server"
should be stated on the front page; right now I had to trust it. Secondary: the shared
link is only base64-encoded (not encrypted) and the full agenda sits in my browser
history — fine for a read-only co-facilitator share, but I'd want a heads-up before I
paste anything sensitive. Fix those two and this is a 9 I'd push to my whole ops team.

```json
{"tester": 1, "round": 1, "clarity": "Yes", "value": "Yes",
 "advocacy": 8, "topComplaints": ["No visible 'client-side / nothing sent to a server' assurance for a data-wary corporate user — I had to verify the network myself", "Shared link is base64 (not encrypted) and agenda persists in browser history; no warning before pasting sensitive content"], "priorConcernsAddressed": "n/a"}
```
