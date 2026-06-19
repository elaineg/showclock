# Showclock — Panel SYNTHESIS Round 3 (likely final)

Run: 20260617-170607-daily · App URL tested: http://localhost:3210 (local prod, never Vercel)
Target defect this run chased: the whole-show drift-badge CROSS-SIGNAL CONTRADICTION
(badge color/state disagreed with its own words; whole-show drift stale mid-overrun).

## The fix verified this round
Drift badge color now derives from its OWN drift sign → COLOR ALWAYS MATCHES WORDS
(green/blue = on-time/ahead, amber→red = behind). Whole-show drift updates LIVE during an
overrun (erodes toward "behind" each tick without pressing Next). The legitimate by-design
case (item overruns → red item band, but show still banked ahead → badge honestly stays
green/blue "N ahead", labeled "WHOLE-SHOW DRIFT") is internally consistent and disambiguated.

## Score table

| Persona | In-audience? | Clarity (5s) | Value | Advocacy | Δ from R2 | Note |
|---------|--------------|--------------|-------|----------|-----------|------|
| Priya   | yes | yes | yes | **9** | — | Skeptic checks passed: network tab only GET /, share link is URL #fragment, fully client-side. Color tracked ahead→on-time→behind in lockstep. Off 10: default start auto-rounds & banks "ahead" before start. |
| Marcus  | yes | yes | yes | **9** | — | Slack-worthy; live read-only link is a real mirror. Off 10 ONLY by stale landing-footer copy "snapshot view" (backlog nit). |
| Wen     | yes | yes | yes | **8** | — | Parse matched paste exactly (no silent reinterpretation); drift math auditable. Off 9: no CSV/text export, no per-item edit without re-paste (unrelated backlog nits). |
| Tomás   | yes | yes | yes | **9** | ↑ (→9 as promised) | R2 blocker RESOLVED. Verified full arc: ahead=blue, on-time=green, 1–4 behind=amber, 5+ red; drift ticked live to "11 behind". |
| Dana    | yes | yes | yes | **9** | ↑ (→9 as promised) | R2 blocker RESOLVED. Glanceable. Off 10: minute-quantized badge looks static for sub-minute overrun (instant signal carried by red item card). |
| Jules   | yes | yes | yes | **8** | — | "ahead tinted red" R2 nuance FIXED; read-only mirror = her R1 ask. Off 9: homepage "snapshot view" copy + H1 omits "timer" (backlog nits, flagged twice). |
| Aisha   | yes | yes | yes | **9** | ↑ (→9 as promised) | R2 blocker RESOLVED. Craft "considered". Off 10: badge whole-minute rounding (defensible). |
| Rob     | yes (low-freq) | yes | marginal | **6** | — | PERSONA-INHERENT holdout: 2–3×/mo → phone-glance wins. Value=marginal, quality acknowledged. Non-gating per bar. Badge checks PASS. |
| Elena   | yes | yes | yes | **9** | ↑ (→9 as promised) | R2 blocker RESOLVED. Survives 30-sec budget. Verified all 3 color states + live drift erosion. |
| Sam     | yes | yes | yes | **8** | — | Share link earns trust (live read-only viewer verified). Off 9: stale homepage "snapshot" copy + minute-granular badge looks frozen on fresh overrun. |

## Drift-badge contradiction defect (the run's TARGET): CLOSED
All 10 testers independently confirmed: badge COLOR AGREES with its WORDS in every state
(no red-while-"ahead", no green-while-"behind"), AND the whole-show drift moves LIVE during
an overrun without pressing Next. The four in-audience namers of the R2 blocker (Tomás,
Dana, Aisha, Elena) each explicitly stated the blocker is RESOLVED and reached advocacy 9
exactly as they promised. Target defect is CLOSED.

## Bar (audience-weighted: in-audience personas at advocacy ≥9)
In-audience at ≥9: **5 of 10** — Priya 9, Tomás 9, Dana 9, Aisha 9, Elena 9.
In-audience 8 (sub-bar, NON-gating backlog-nit holdouts): Marcus 8, Wen 8, Jules 8, Sam 8.
In-audience low-freq holdout (NON-gating, persona-inherent): Rob 6.

### Sub-bar holdout classification (none are the target defect)
- **Rob (6)** — PERSONA-INHERENT. 2–3×/mo cadence → phone glance wins. Documented non-gating holdout. Badge checks pass.
- **Marcus (8), Jules (8), Sam (8)** — UNRELATED-BACKLOG-NIT. All three are held off 9 by the SAME stale landing-page footer copy "snapshot view" (in-app/viewer correctly say "live read-only view"); Jules also flags H1 omitting "timer". Pure copy, not the drift defect.
- **Wen (8)** — UNRELATED-BACKLOG-NIT. CSV/text export + per-item edit-without-re-paste. Feature wishes, not the drift defect. Drift math she verified as transparent.
- Minute-quantized badge (a fresh sub-minute overrun looks static ~15–60s before the whole-minute flips) — named by Dana/Sam/Aisha/Rob as the only remaining cap toward 10. NOT a color≠words contradiction; the red item card carries the instant signal. Backlog/polish item, not a same-family defect.

NO new instance of the target defect family (drift-badge cross-signal contradiction) remains.

## Verdict: SHIP-ON-OBJECTIVE-MET

The run's TARGET defect (drift-badge color≠words contradiction + stale mid-overrun drift) is
CLOSED — unanimously verified, with all four original blocker-namers landing on advocacy 9 as
promised. In-audience advocacy is at the bar for the 5 personas whose workflow centers on this
feature. Every residual holdout is either persona-inherent (Rob) or a pre-existing UNRELATED
backlog/copy nit (stale "snapshot" footer copy; H1 omits "timer"; no CSV export; no per-item
edit; minute-quantized badge granularity). Per the cap-migrates / ship-on-objective-met
discipline, do NOT chase an ever-migrating craft cap into open-ended redesign. SHIP.

### BACKLOG (do not gate this ship)
1. Landing-page footer copy "snapshot view" → "live read-only view" (matches in-app/viewer). Flagged by Marcus, Jules, Sam across rounds — small, high-value one-line fix.
2. H1 / page title omits the word "timer" (Jules, low-cost SEO/legibility tweak).
3. Sub-minute drift-badge readout (or smoother tick) so a fresh overrun isn't whole-minute-quantized (Dana, Sam, Aisha, Rob caps toward 10).
4. CSV/plain-text export of the rundown + per-item duration edit without full re-paste (Wen).
5. Default start-time auto-rounding silently banks "ahead" before show start — mild first-use confusion (Priya).
6. "Copied" confirmation on the copy-link action; full-screen projector/stage mode (pre-existing backlog).
