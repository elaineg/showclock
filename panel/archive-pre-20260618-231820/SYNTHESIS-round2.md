# Showclock — Panel SYNTHESIS round2 (STAGE CUES, drift-badge contradiction fix)

Run: 20260617-170607-daily. Feature re-judged: the round-1 fix to the GREEN-header-vs-RED-band
contradiction — when the current item is RED, the top whole-show drift badge now also turns red,
shows the drift number, and carries a "WHOLE-SHOW DRIFT" sub-label subordinate to the item band.
Plus share-link copy corrected "snapshot" → "live read-only view". Tested COLD against
http://localhost:3210 by 10 personas.

## Score table

| Persona | In-aud? | Clarity | Value | Advocacy | Δ R1 | Note |
|---------|:---:|:---:|:---:|:---:|:---:|---|
| Priya (backend, demo day) | YES | Yes | Yes | 8 | 0 | Badge+band agree on overrun; verified client-side; still wants full-screen projector mode |
| Marcus (frontend, sprint demo MC) | YES | Yes | Yes | 9 | +1 | Contradiction closed; verified live mirror; only nit: landing-page footer still says "snapshot" |
| Wen (data analyst, 6-seg training) | YES | Yes | Yes | 9 | +1 | Parse fidelity exact; drift math reconciled 1:1; only nit: still no "Copied" confirm |
| Tomás (ops, strict 45-min) | YES | Yes | Yes | 8 | 0 | COLOR contradiction gone, but badge WORDS still say "on time" when only the item overruns |
| Dana (demand-gen, glance test) | YES | Yes | Yes | 8 | 0 | Double-take color-trap gone; NEW milder color-vs-WORDS mismatch (red wash + "ahead" text) |
| Jules (community, AMA, phone) | YES | Yes (↑) | Yes | 8 | +1 | Contradiction closed; share copy now accurate; landing blurb still says "snapshot"; H1 omits "timer" |
| Aisha (designer, FigJam workshops) | YES | Yes | Yes (↑) | 8 | +2 | Rogue chip gone, hierarchy considered; residual: "ahead" words inside red container (color inversion) |
| Elena (eng mgr, all-hands) | YES | Yes | Yes (marg) | 6 | −1 | NOT CLOSED — badge only updates at item boundaries, so live item-overrun never reddens it; words+color disagree |
| Sam (PM, sprint planning) | YES | Yes | Yes | 8 | 0 | Closed on big overrun; share copy verified live; first-overrun still needs a beat to grok |
| Rob (freelance, 2–3×/mo) | NO (holdout) | Yes | Marginal | 6 | 0 | Badge+band agree; cap is frequency-inherent, not a defect — KNOWN non-gating holdout |

## In-audience advocacy vs bar

Bar (audience-weighted DEEPEN): IN-AUDIENCE personas at advocacy **≥9**.
- In-audience personas: 9 (all except Rob, the known low-frequency holdout — non-gating).
- In-audience at ≥9: **2 of 9** (Marcus 9, Wen 9). Up from 0 of 9 in round 1.
- Cluster moved up (six at 8, one at 6, two at 9) but the bar is **NOT met**.

## Is the round-1 blocker CLOSED? PARTIALLY — it morphed, did not fully close.

The exact round-1 failure (a calm GREEN "on time" pill sitting above a pulsing RED item band)
is GONE: the badge now shares the band's red color language and is subordinated with a
"WHOLE-SHOW DRIFT" sub-label. Marcus, Wen, Jules, Aisha, Sam, Priya, Rob all confirm color-agreement
on overrun. That is real progress (0→2 at ≥9, Aisha +2, three personas +1).

BUT the fix introduced a SECOND-ORDER version of the same "two signals disagree" complaint, named
independently by FOUR in-audience personas (Tomás, Dana, Aisha, Elena):

**The badge COLOR now turns red with the item, but its WORDS still read "on time" / "N min ahead"
when the current item overruns while the whole show still has banked slack.** So a facilitator
glancing up sees a RED-WASHED badge that literally says "ahead" — red=panic, words=fine. The
collision moved from green-pill-vs-red-band to red-wash-vs-reassuring-words.

Elena reports it as flatly NOT CLOSED (and dropped 7→6): she observed the badge only recomputes at
item boundaries, so a *live, mid-item* overrun reddens the band but the top badge can still sit pale
"on time" until the item ends — the two genuinely disagree at the exact moment she's over.

## Single highest-leverage remaining blocker (named)

**Badge color is keyed to the ITEM's state, not to the badge's own drift sign — and it may lag live.**
This is the SAME family as round 1 (two glanceable timing signals disagreeing) but a DIFFERENT,
NEW manifestation created by the fix — not a pre-existing unrelated nit, and not the original defect
unfixed. It is a real legibility defect, not a surfacing miss.

One-pass fix for the builder (two coupled parts):
1. **Tint the badge by its OWN sign, not the item's.** If whole-show drift is ahead/on-time, the badge
   should read neutral/green-amber EVEN when the current item is red — let the dominant red ITEM BAND
   carry "this item is over," and let the subordinate badge honestly carry whole-show state in matching
   color+words. (Dana, Aisha, Tomás all converge on exactly this.) Red wash should appear only with a
   "behind" WORD.
2. **Update the whole-show drift live during the current item's overrun**, not only at item boundaries,
   so the badge can't sit stale-pale while the band is red (Elena's NOT-CLOSED case).

Secondary (carry to BACKLOG, non-gating — each 1 persona):
- Landing-page pre-start blurb / footer still says "snapshot" — the in-app share copy was corrected but
  the home-screen copy wasn't (Marcus, Jules). Quick copy fix.
- "Copied" confirmation still missing on copy-link (Wen).
- Full-screen projector-only stage mode (Priya); H1 still omits the word "timer" (Jules).

## Verdict: ITERATE (one named fix)

Do NOT call this SHIP-on-objective-met: although the literal round-1 artifact is closed, the cap did
NOT migrate to an unrelated craft nit — it migrated to a NEW, fix-induced instance of the SAME
disagreeing-signals defect, named by four in-audience personas, one of whom regressed. In-audience is
2 of 9 at ≥9, below bar. But it is ONE coherent fix (tint badge by its own sign + update drift live),
and the testers who named it explicitly put a 9 on the table once it lands (Tomás, Dana, Aisha, Elena
all said "and I'm at a 9"). Fix it, re-run the panel.

## Per-persona detail pointers
- apps/showclock/panel/round2-Priya.md
- apps/showclock/panel/round2-Marcus.md
- apps/showclock/panel/round2-Wen.md
- apps/showclock/panel/round2-Tomás.md
- apps/showclock/panel/round2-Dana.md
- apps/showclock/panel/round2-Jules.md
- apps/showclock/panel/round2-Aisha.md
- apps/showclock/panel/round2-Elena.md
- apps/showclock/panel/round2-Sam.md
- apps/showclock/panel/round2-Rob.md
