# Showclock — Panel SYNTHESIS Round 4

Target: http://localhost:3000 (local prod, all R3 fixes shipped). All 10 personas in-audience; bar = advocate at 9+.

## Per-tester (advocacy R3→R4, one-line blocker)

| Persona | R3 | R4 | Δ | Blocker (one line) |
|---|---|---|---|---|
| Priya  | 6 | 8 | +2 | Shared-link timezone not stated; overrun/behind state unconfirmed |
| Marcus | 8 | 8 | 0  | No fullscreen/present mode — countdown small in a 550px column on a shared screen |
| Wen    | 6 | 5 | -1 | **Colon durations silently mangled** (`Keynote 0:05`→name "Keynote 0", 5m) — silently-wrong-output |
| Tomás  | 6 | 7 | +1 | **Ctrl+A-then-type duration → "2512", clamped 600m, no error** |
| Dana   | 8 | 8 | 0  | Drift measured from Next tap, not wall clock — says "on time" while actually overrunning |
| Jules  | 8(R3 listed)→6 | 6 | -2 | **Ctrl+A-then-type corrupts duration ("2520") AND name ("KeynoteDemo")** |
| Aisha  | 8 | 8 | 0  | Can't edit/re-timebox the rundown while the show is live |
| Rob    | 6 | 6 | 0  | "Copy rundown as text" copies bare unitless text, mismatches on-screen display |
| Elena  | 8 | 8 | 0  | No named presets for recurring weekly agendas (bookmark-only reuse) |
| Sam    | 8 | 8 | 0  | Bare copy-as-text output; weak "tap to edit" cue on mobile |

(Jules R3 was 8 per the seed list; her R4 is 6 — counted as a regression below.)

## In-audience-at-9 count: **0 / 10**

No tester reached 9. Top of the distribution is a wall of 8s held back by **the Ctrl+A/select-all editing bug** (FIX 2 did NOT land for several) and assorted feature-completeness asks.

## Did the 4 round-3 fixes resolve their complaints?

- **FIX 1 — future planned start → real pre-roll countdown + "Start now":** LANDED for everyone. Wen, Tomás, Marcus, Rob, Sam, Dana, Jules, Priya, Elena, Aisha ALL set a future start, pressed Start, and got a clean "STARTS IN HH:MM:SS" + "Start now" override with auto-begin. No bogus "822 min ahead", no "future but starts immediately" contradiction. **The R3 top blocker is genuinely CLOSED.**
- **FIX 2 — duration cell REPLACES on every gesture incl. Ctrl+A-then-type:** **DID NOT LAND.** Tomás, Jules, and Wen reproduced the exact R3 failure: Ctrl+A does NOT select the existing value; typing APPENDS → "2512"/"2520", silently clamped to 600m. Jules also got it on the NAME field ("KeynoteDemo"). Click-in + retype and triple-click + retype and Meta+A (Mac) work, but Ctrl+A (Windows/Excel muscle memory) still corrupts. This is a regression on the headline R3 fix.
- **FIX 3 — Start enabled on cold load:** LANDED. Every tester started from the prefilled sample with no empty-state block. No complaints.
- **FIX 4 — copy buttons flip to "✓ Copied!":** LANDED. Marcus, Aisha, Sam, Dana confirmed the flip on both buttons.

## Grouped friction (mapped + classified)

### A. Ctrl+A / select-all does NOT replace in editable fields → silent garbage — **TARGET-FEATURE defect** (Tomás, Jules, Wen-adjacent)
The R3 FIX 2 claimed "REPLACES on every gesture incl. keyboard Ctrl+A-then-type." It does not. Ctrl+A appends; result clamps to 600m silently (duration) or concatenates (name). match-fix-signal-self-consistency: the shipped fix's own stated behavior is contradicted by the live app. This is the editing feature's own correctness, and it's the single most-cited blocker.

### B. Colon/`h:mm`/`mm:ss` durations silently mangled — **TARGET-FEATURE defect** (Wen)
`Keynote 0:05` → name becomes "Keynote 0", duration 5m; `1:30` → "Keynote 1", 30m. The orphaned digit is merged into the NAME. Parser CAN refuse (it flags no-number lines) but doesn't refuse the dangerous colon case. silently-wrong-output: user would present a wrong rundown with wrong names. Run-of-show docs use h:mm/mm:ss constantly. This is parse correctness of the core paste flow.

### C. Drift only updates on Next tap, not wall clock — **TARGET-FEATURE defect / feature gap** (Dana, partially Priya)
Set planned start 8 min ago, press Start without advancing → still "on time", fresh 5:00. The behind/ahead signal — the product's headline value ("know how far behind you are") — ignores real elapsed time until you advance. The current segment should count UP into red overrun past its planned duration. This is the drift feature's own correctness for the most important state (behind).

### D. Copy-as-text is bare/unitless, mismatches display — **TARGET-FEATURE nit** (Rob, Sam, Dana, Tomás, Jules)
Copies `Welcome 5` with no "min", no clock times, no title, while screen shows `Welcome 5m · 1:50 AM`. Widely cited but secondary. Part of the editing/share feature surface.

### E. No fullscreen/present mode — **PRE-EXISTING/UNRELATED feature gap** (Marcus)
UI pinned in ~550px column; countdown smaller than the drift badge on a 1920px screen. Presenter-surface optimization, not the editing/start feature. Migrate to backlog.

### F. No named presets for recurring agendas — **PERSONA-INHERENT / feature gap** (Elena)
Wants saved reusable agendas; bookmark-only today. localStorage-preset feature, unrelated to editing/start contract. Migrate to backlog.

### G. Can't edit rundown while live — **feature gap** (Aisha)
Must "End & edit agenda" to change a timebox mid-show. Separate from the cold-edit feature shipped. Backlog.

### H. Shared-link timezone unstated — **PRE-EXISTING nit** (Priya). Backlog.

### I. Mobile 375px — NO breakage. Jules and Sam both ran the live podium view at 375px: huge item name, big countdown, fat Next, 40px arrow tap targets all good. mobile-375 clean.

## VERDICT: **NEEDS-FIX (round 5)**

The in-audience bar (0/10 at 9) is not met, and — decisively — **the top remaining blocker is still a TARGET-feature defect**, so SHIP-ON-OBJECTIVE-MET is NOT available. The editing feature's own correctness is broken three ways:
1. **Ctrl+A-then-type still corrupts (Friction A)** — the exact thing R3 FIX 2 claimed to fix. This is a fix-signal self-consistency failure and the most-cited R4 blocker.
2. **Colon durations silently mangled (Friction B)** — new, and a silently-wrong-output defect on the core paste path.
3. **Drift ignores wall clock until Next (Friction C)** — the headline "how far behind are you" value is wrong in the one state that matters.

The future-start contract (R3 FIXES 1/3/4) IS closed, so progress is real, but the editing/parse/drift feature still owns the top defect.

### Round-5 plan (concrete)
1. **Select-on-focus + true replace** in BOTH duration and name editable fields: on focus, select all content; intercept Ctrl/Cmd+A to select the field; ensure typed input replaces selection. Verifier must assert click→Ctrl+A→type yields the typed value (not concatenation) in BOTH fields, on a layout where the native select-all is intercepted.
2. **Parse colon durations safely**: support `h:mm` and `mm:ss` (decide one canonical meaning and SHOW it), OR if ambiguous, FLAG the line as un-parsed instead of merging the digit into the name. Never silently drop/merge. Verifier: input-variety test incl. `0:05`, `1:30`, `90 sec`.
3. **Wall-clock drift**: once the show is running, current segment counts up past planned duration into a red overrun state and whole-show drift reflects real elapsed time even before the user advances. Verifier: start with planned-start in the past, do not advance, assert drift != "on time".
4. (Stretch, lifts the wall of 8s toward 9) Match copy-as-text to the displayed rundown (units + clock times + title) — Friction D, five testers.

### Caps that MIGRATE to backlog (not round-5 blockers)
- E (fullscreen/present mode), F (named presets), G (live editing), H (shared-link timezone). All pre-existing/persona-inherent/unrelated to the editing+start objective.
