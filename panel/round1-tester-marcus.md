# Showclock — Round 1 — Marcus (frontend eng, 2yr, desktop/Chrome devtools)

## 1. Cold open (30s) — advocacy 8/10
Clear immediately. "Showclock" + "Know exactly how far behind you are — and what time
everything starts now" + "Paste your agenda. We track the drift and reflow every clock time
live." I'd tell a colleague: "Paste your rundown, it gives you a big-type presenter
countdown that shows if you're running ahead/behind and recalcs every item's real clock
time live — and you can share a read-only link to a co-host." That is EXACTLY my sprint-demo
MC job. The "See a live example" affordance is a great cold-open — I clicked it, it loaded a
session already running behind, no setup. Would I use it Thursday? Yes.

## 2. Core task — in-place editing: discoverable AND works
Pasting an agenda instantly produced a parsed RUNDOWN ("5 ITEMS · 55 MIN TOTAL") with the
hint "Click any name or time to edit · reorder with ↑↓". Highly discoverable.
- Edit duration: clicked "20m" on Sprint review, typed 25, Enter → total recalced to 60 min. Works.
- Edit name: clicked "Welcome", became a text input. Works (and writes back to the textarea).
- Reorder: ↑ on Demo moved it above Sprint review, textarea + start times reflowed. Works.
- Add item / × remove: item count went 5→6→5 correctly. Works.
- Start show → clean presenter view: huge "3 min ahead / WHOLE-SHOW DRIFT" badge, big NOW
  card (item + 5:00 countdown), Back/Next, Space/arrow hints, planned→projected reflow,
  projected end. Looks sharp on a shared screen. No janky CSS, 0 console errors anywhere.
- Share: "Copy current link" → label flips to "✓ Copied!", clipboard has full URL (agenda
  encoded in the hash, no signup). Opening it as a co-host = READ-ONLY (no Back/Next/End),
  shows live NOW + drift. This nails my "drop link in Slack for a co-host" need.

Minor jank: clicking a duration/name field does NOT select-all on focus — cursor lands at
end, so to change "20" I have to manually clear it first. Fast typers will fat-finger this
(I initially produced "2025"). Auto-select-on-focus would make inline edit feel native.

## 3. Biggest blocker on advocacy
The share URL is an ugly, long base64 hash (`/#eyJ0IjoiV2VsY29tZSA1...`, 190 chars). It works,
but when I paste that in team Slack it looks sketchy/untrustworthy next to a normal link, and
Slack will mangle/unfurl it oddly. For a tool whose whole pitch is "share the presenter link,"
the link itself should look clean. Combined with the no-select-on-focus edit nit, that's what
keeps me at 8 instead of 9. No correctness bugs — I'd still share it today.

```json
{"tester": 7, "round": 1, "clarity": "Yes", "value": "Yes", "advocacy": 8, "topComplaints": ["Share link is a long ugly base64 hash — looks sketchy pasted in Slack", "Inline edit fields don't select-all on focus, so changing a duration/name appends instead of replaces unless you manually clear"], "priorConcernsAddressed": "n/a"}
```
