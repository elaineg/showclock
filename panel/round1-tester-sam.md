# Showclock — Round 1 — Tester: Sam (PM, mobile-heavy)

## 1. COLD OPEN (first 30s, 375px)
**Clarity: Partially.** Headline "Showclock — Know exactly how far behind you are — and what
time everything starts now" + "Paste your agenda. We track the drift and reflow every clock
time live." I'd tell a colleague: "it's a run-of-show timer — paste your agenda and it shows
live how far ahead/behind you are and reflows every start time." That's exactly my sprint/
roadmap-workshop pain. What CONFUSED me: the textarea looks PRE-FILLED with an agenda
(Welcome 5 / Intro - 10 min / …) but it's gray placeholder text, and "Start show" is greyed
out reading "Add at least one item to start." So my first instinct — "great, just hit Start"
— failed silently, and I don't know if I'm supposed to retype the example or what. The "See
a live example" button below would've helped if I'd noticed it first.
**Cold advocacy: 6.**

## 2. CORE TASK (paste → edit → reorder → copy → start)
- **Paste/enter:** Once I actually typed a real agenda ("Standup 5 / Sprint review - 20 min /
  Retro - 30 min / Planning poker - 25 min / Wrap-up 5"), Start enabled. The free-text parser
  handled "5", "- 20 min", "30 min" mixed formats. Good.
- **Edit duration + reorder:** No structured per-item editor — you edit by retyping lines in
  the textarea, then re-Start. I changed Retro 30→45 and moved Planning poker to last; on
  re-Start the rundown reflowed correctly (projected end moved 1:11 AM → 1:27 AM). The
  "planned → projected" table reflowing live is EXACTLY what I want the room to see. Worked.
- **Copy-as-text export: NOT FOUND.** The only copy action is **"Copy current link"** (copies
  a share URL — verified it lands on the clipboard, works). There is NO "Copy rundown as text"
  button anywhere. As someone who pastes rundowns into Notion/Slack constantly, a bare link
  to a live page is NOT a substitute for plain text I can drop into a doc.
- **Copy feedback:** the "Copy current link" button shows NO "Copied!" state — label never
  changes. It did copy, but I got zero reassurance and would tap it repeatedly.
- **Start timer:** Worked. "3 min ahead — WHOLE-SHOW DRIFT", big NOW/ITEM countdown,
  Back/Next, Space=next. Clean at 375px.

## 3. BIGGEST BLOCKER
The promised **"Copy rundown as text" export does not exist** — only a share-link copy. My
whole habit is paste-the-rundown-into-Notion/Slack so I look organized; a live link doesn't
fill that. Secondary: placeholder agenda masquerading as real content + no "Copied!"
confirmation. Edit-by-retyping (no drag/inline duration field) is acceptable but feels
clunky for a PM on mobile.

```json
{"tester": 1, "round": 1, "clarity": "Partially", "value": "Marginal",
 "advocacy": 6, "topComplaints": ["No 'Copy rundown as text' export — only a share-link copy; can't paste plain text into Notion/Slack", "Gray placeholder agenda looks pre-filled but Start stays disabled ('Add at least one item') — silent dead end on cold open", "Copy button gives no 'Copied!' confirmation; editing requires retyping textarea lines (no inline duration/drag reorder)"], "priorConcernsAddressed": "n/a"}
```
