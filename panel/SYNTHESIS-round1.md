# Showclock — Panel SYNTHESIS Round 1 (new feature: edit-the-rundown-in-place)

Feature under test: inline-edit each rundown item's title/duration, add/delete/reorder rows
with per-row ↑/↓/× controls, "Copy rundown as text" export, all reflowing planned clock
times live; edits round-trip into Start/share-URL/presenter.

## Per-tester verdicts

| Tester | Audience | Score | One-line blocker |
|--------|----------|-------|------------------|
| Priya (backend eng, demo day) | IN | 8 | No live in-place editing DURING a running show — must "End & edit" + restart to nudge a slot |
| Marcus (frontend eng, sprint demo MC) | IN | 8 | Share URL is a long ugly ~190-char base64 hash — looks sketchy pasted in Slack |
| Wen (data analyst, weekly training) | IN | 7 | **Start show IGNORES the Start-time field** — plans off set time, runs off wall-clock with no warning; + duration cell no select-all-on-focus → "3020m" |
| Tomás (ops analyst, weekly ops review) | IN | 8 | Client-side/no-server data-safety story is true but invisible — never stated up front |
| Dana (demand-gen, monthly webinars) | IN | 8 | **Start-time field silently ignored** (reflows off wall-clock); + duration no select-all → "3020" on tap |
| Jules (community marketer, weekly AMA) | IN | 9 | Co-host read-only link is a static hash snapshot — goes stale when agenda edited mid-show |
| Aisha (product designer, FigJam workshops) | IN | 8 | **Duration edit does NOT select-all on focus** → click "5m" + type "8" = "85m"; fumbles the core action |
| Rob (brand designer, client walkthroughs) | IN | 7 | **Duration edit no select-all** → "2520" = 42-hour item, silently blows up projected times, no max guard |
| Elena (eng manager, weekly all-hands) | IN | 8 | **Duration edit no select-all** → click "15m" + type "20" = "1520m" garbage total; the edit she'd make most weekly is a trap |
| Sam (PM, sprint/roadmap workshops) | IN | 6 | **"Copy rundown as text" export NOT FOUND** — only a share link; + structured inline editor not seen (edited via textarea) |

## In-audience-at-9 count: 1/10 in-audience at advocacy ≥9 (Jules only). NEEDS-FIX.

All 10 personas are IN-AUDIENCE (every one runs paced/timed multi-segment sessions —
demo days, sprint demos, trainings, ops reviews, webinars, AMAs, design workshops, client
walkthroughs, all-hands). No out-of-audience non-fits this round. Bar = in-audience ≥9; only
Jules cleared it. Scores cluster 6–9 with a tight, fixable defect set.

## Grouped friction

### TARGET-FEATURE defects (the new editing feature)

1. **[P0] Duration inline-edit does NOT select-all on focus → silently-wrong output.**
   Cited by Aisha, Rob, Elena, Wen, Dana (5/10, all in-audience). Clicking a duration cell
   lands the cursor at the END of the existing value, so typing "20" over "15" yields
   "1520m" — a garbage total with NO max-value guard, silently corrupting every downstream
   projected clock time. This is the single most-cited blocker AND maps directly to the
   silently-wrong-output friction lesson (wrong clock time after an edit = P0). It bites the
   single most common edit (changing a duration) and on mobile-by-tap (Dana). Name edits are
   fine; only the numeric duration field is affected.

2. **[P0] "Start show" IGNORES the Start-time field → silently-wrong output / broken trust.**
   Cited by Wen and Dana (2/10, both in-audience, both run scheduled sessions). The editor
   plans clock times off the entered Start time (e.g. 14:30), but hitting Start runs the live
   show off the current wall-clock with no warning. The planned clocks the user built and may
   have shared do not appear live. Either honor the field at Start, or relabel it "preview only."

3. **[P1] "Copy rundown as text" export appears MISSING / undiscoverable.**
   Cited by Sam (in-audience; share-to-Notion/Slack is his core habit). The prompt's feature
   set includes a "Copy rundown as text" export, but Sam found only "Copy current link" (a
   share URL) and no plain-text copy anywhere. Either the export was not built, or it is
   buried/conditional on a view Sam didn't reach — maps to added-feature-buried. NOTE
   CONFLICT below.

4. **[P1 / CONFLICT] Structured inline editor not seen by 2 testers — discoverability/entry-path gap.**
   Sam reports "no structured/inline editor — you edit by retyping lines in the textarea";
   Priya reports "free-text-only, no per-row inline edit, no drag handles." The other 8
   testers (Marcus, Wen, Tomás, Dana, Jules, Aisha, Rob, Elena) all clearly describe a
   structured RUNDOWN table with the hint "Click any name or time to edit · reorder with ↑↓"
   and working ↑/↓/× per row. This strongly implies the structured editor EXISTS but does not
   surface in every entry path/state (Sam & Priya appear to have stayed in/returned to a
   textarea-only view). Discoverability of the structured editor is inconsistent — maps to
   added-feature-buried. Builder must confirm the editor renders on the path these two took
   (and after "End & edit agenda").

5. **[P2] Live editing during a RUNNING show not supported.**
   Cited by Priya (and echoed by Jules re: stale share link). To nudge a slot mid-show you
   must "End & edit agenda" and restart; the round-trip works but isn't live. Real enhancement
   request, not a defect of the planning-view feature under test.

### PRE-EXISTING / UNRELATED nits

- **Ugly base64 share URL** (~190 chars) — Marcus. Pre-existing share mechanism, not the edit feature.
- **No "Copied!" confirmation on Copy-link** — Sam (Marcus saw "✓ Copied!" — possibly path-dependent). Minor.
- **Empty-state dead end**: greyed placeholder agenda looks pre-filled but Start stays
  disabled with "Add at least one item" — Sam, Jules, Aisha. Brief cold-open confusion; pre-existing empty state.
- **Data-safety story invisible** (no "nothing sent to a server" statement) — Tomás (and Priya
  verified it client-side herself). Pre-existing copy gap, not the edit feature.
- **Pasted formats normalize** ("Warmup - 5 min" → "Warmup 5") — Aisha. Surprising but correct; pre-existing parser.

### PERSONA-INHERENT non-fits
- None. All 10 are genuine in-audience fits.

### Mobile-375
- Dana and Jules both edited the rundown by tap at 375px successfully (reorder, edit, add,
  delete). The select-all-on-focus duration bug (#1) ALSO reproduced on mobile by tap (Dana).
  No 375px-specific layout breakage reported.

## Fix plan for Round 2 (in-audience bar 1/10 → not met)

1. **(motivated by #1, Aisha/Rob/Elena/Wen/Dana — 5 testers) Select-all-on-focus for the
   duration (and name) inline-edit fields.** On focus, select the entire existing value so
   typing overwrites instead of appending. ADD a sane max/validation guard on duration
   (reject/clamp absurd values like 2520) so a fat-finger can never silently produce a
   42-hour item or garbage projected clocks. This single fix lifts the largest cluster.

2. **(motivated by #2, Wen/Dana — 2 testers) Make "Start show" honor the Start-time field.**
   Run the live show's planned clocks off the entered Start time; if the design intends
   wall-clock-now, relabel the field "preview only / planning display" and warn on Start.
   Killing this silently-wrong behavior is required (P0 trust).

3. **(motivated by #3 & #4, Sam/Priya) Ensure the structured inline editor AND the "Copy
   rundown as text" export are present and discoverable on ALL entry paths** (initial paste,
   after "End & edit agenda", and whatever path Sam/Priya took). Add/verify a visible "Copy
   rundown as text" button alongside "Copy current link"; confirm the ↑/↓/× structured table
   always renders once items parse. If the text-export was never built, build it.

4. **(motivated by Marcus — P2, optional) Consider a shorter/cleaner share URL** if cheap;
   otherwise backlog.

Round-2 target: re-run the same 10 in-audience testers; expect the select-all fix +
Start-time honesty + text-export to move the 6–8 cluster to ≥9.
