// Agenda parsing and schedule math. Pure functions, no React.

export type ParsedLine =
  | { kind: "item"; name: string; minutes: number; raw: string; colonEchoStr?: string }
  | { kind: "error"; raw: string };

export type Item = { name: string; minutes: number; colonEchoStr?: string };

// ---- unit helpers ----

// Map a unit string (already lower-cased, trimmed) to minutes-per-unit, or null if unknown.
function unitToMinutes(unit: string): number | null {
  if (!unit || /^m(in(s|ute|utes)?)?$/.test(unit)) return 1;           // min / mins / minute / minutes / m / (no unit)
  if (/^s(ec(s|ond|onds)?)?$/.test(unit)) return 1 / 60;               // s / sec / secs / second / seconds
  if (/^h(r(s)?|our(s)?)?$/.test(unit)) return 60;                     // h / hr / hrs / hour / hours
  return null; // unrecognized unit
}

// Returns minutes (may be fractional) or null if unit is unrecognized.
function parseQuantity(num: string, unit: string): number | null {
  const n = parseFloat(num);
  if (!Number.isFinite(n) || n <= 0) return null;
  const factor = unitToMinutes(unit.toLowerCase().trim());
  if (factor === null) return null;
  return n * factor;
}

// Regex patterns — number (int or decimal) followed by optional unit, surrounded by separators.
// Group 1: leading number, Group 2: leading unit (may be empty), Group 3: rest name
const LEADING_RE =
  /^(\d+(?:\.\d+)?)\s*(s(?:ec(?:s|ond|onds)?)?|h(?:r(?:s)?|our(?:s)?)?|m(?:in(?:s|ute|utes)?)?)?\b[\s\-–—:·]*(.+)$/i;

// Group 1: name text, Group 2: trailing number, Group 3: trailing unit (may be empty)
const TRAILING_RE =
  /^(.+?)[\s\-–—:·]*\(?\s*(\d+(?:\.\d+)?)\s*(s(?:ec(?:s|ond|onds)?)?|h(?:r(?:s)?|our(?:s)?)?|m(?:in(?:s|ute|utes)?)?)?\s*\)?\s*\.?$/i;

// If a line has an explicit unrecognized unit we must flag it, not silently reinterpret.
// Match: number + unrecognized-word-unit pattern at start or end.
const EXPLICIT_UNIT_RE = /\b\d+(?:\.\d+)?\s*([a-z]{1,10})\b/gi;

function hasUnrecognizedExplicitUnit(line: string): boolean {
  EXPLICIT_UNIT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EXPLICIT_UNIT_RE.exec(line)) !== null) {
    const unit = m[1].toLowerCase();
    // skip recognized units and common false-positives (words that are part of a name)
    if (unitToMinutes(unit) !== null) continue;
    // If the word immediately follows a number it's likely intended as a unit
    return true;
  }
  return false;
}

/**
 * Attempt to parse a colon-format duration token at the END of a line.
 * Canonical interpretation: MINUTES:SECONDS (m:ss).
 * Examples:
 *   "0:05"  → 0m05s = 5 sec  = 5/60 min
 *   "0:30"  → 0m30s = 30 sec = 0.5 min
 *   "1:30"  → 1m30s = 90 sec = 1.5 min
 *   "12:30" → 12m30s = 750 sec = 12.5 min
 *   "2:00"  → 2m00s = 120 sec = 2 min
 * Returns fractional minutes (> 0) or null if the token doesn't look like a colon duration.
 * The LEFT part of a colon token is NEVER silently merged into the item name.
 */
export function parseColonDuration(token: string): number | null {
  const m = token.match(/^(\d{1,3}):(\d{2})$/);
  if (!m) return null;
  const minutes = parseInt(m[1], 10);
  const seconds = parseInt(m[2], 10);
  if (seconds >= 60) return null; // invalid seconds field
  const totalSec = minutes * 60 + seconds;
  if (totalSec <= 0) return null;
  return totalSec / 60; // fractional minutes
}

/**
 * Format fractional minutes as a human-readable string.
 * Examples: 1.5 → "1m 30s", 0.5 → "30s", 12.5 → "12m 30s", 10 → "10m", 0.0833... → "5s"
 */
export function fmtDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const totalSec = Math.round(minutes * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/**
 * Convert fractional minutes back to a round-trip-safe string for itemsToText.
 * Whole minutes → plain integer "N".
 * Sub-minute or mixed → "M:SS" colon form that re-parses identically (M:SS).
 */
export function minutesToRoundTripStr(minutes: number): string {
  const totalSec = Math.round(minutes * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (s === 0) return String(m); // whole minutes — plain integer
  return `${m}:${String(s).padStart(2, "0")}`; // M:SS
}

/**
 * Generate the echo text for a colon-format token, e.g. "1:30" → "→ 1m 30s".
 * Returns null if the token is not a colon format or parses to 0.
 */
export function colonEcho(token: string): string | null {
  const minutes = parseColonDuration(token);
  if (minutes === null) return null;
  return `→ ${fmtDuration(minutes)}`;
}

/**
 * Parse a raw duration string typed into the inline duration editor.
 * Canonical contract (same as paste path):
 *   "45"    → 45 min (plain integer)
 *   "1:30"  → 1m30s = 1.5 min (M:SS)
 *   "0:30"  → 30s = 0.5 min
 *   "0:05"  → 5s ≈ 0.083 min
 *   "12:30" → 12m30s = 12.5 min
 * Returns clamped fractional minutes in (0, MAX_INLINE_DURATION_MIN], or null if unparseable.
 * Used by Planner's commitEdit so the inline-edit path and the paste path use
 * the SAME logic (Defect-B fix: the two paths previously diverged).
 */
export const MAX_INLINE_DURATION_MIN = 600;

export function parseDurationInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Colon format first: M:SS
  if (/^\d{1,3}:\d{2}$/.test(trimmed)) {
    const result = parseColonDuration(trimmed);
    if (result !== null) {
      return Math.min(MAX_INLINE_DURATION_MIN, result);
    }
    return null;
  }
  // Plain integer (possibly with leading/trailing spaces)
  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n <= 0 || !/^\d+$/.test(trimmed)) return null;
  return Math.min(MAX_INLINE_DURATION_MIN, Math.max(1, n));
}

export function parseLine(raw: string): ParsedLine | null {
  const line = raw.trim();
  if (!line) return null;

  // COLON-DURATION GUARD: detect a trailing colon-format token (e.g. "0:05", "1:30", "12:00")
  // BEFORE running the generic TRAILING_RE which would split the colon and silently merge
  // the left digit into the item name (the "Keynote 0:05" → name "Keynote 0" bug).
  // Canonical interpretation: H:MM (hours:minutes). "1:30" = 90 min, "0:45" = 45 min.
  // Pattern: optional-name + optional-separator + colon-token at end.
  const colonTrailingMatch = line.match(/^(.*?)\s*[\-–—\s]*(\d{1,3}:\d{2})\s*$/);
  if (colonTrailingMatch) {
    const namePart = colonTrailingMatch[1].trim();
    const colonToken = colonTrailingMatch[2];
    // Only treat as a duration if the name part is non-empty and non-numeric
    if (namePart && !/^\d+$/.test(namePart)) {
      const minutes = parseColonDuration(colonToken);
      if (minutes !== null) {
        // Store the echo string so the UI can display "→ 1m 30s" next to the duration.
        // This makes the M:SS interpretation VISIBLE and never silent.
        const echo = `→ ${fmtDuration(minutes)}`;
        return { kind: "item", name: namePart, minutes, raw, colonEchoStr: echo };
      }
      // Colon token present but unrecognized → flag as error rather than mangle the name
      return { kind: "error", raw };
    }
    // Standalone colon-format (no name part): flag as error (not a bare duration line)
    if (!namePart) {
      const minutes = parseColonDuration(colonToken);
      // A bare "1:30" with no name → flag as unparseable (ambiguous)
      if (minutes !== null) {
        return { kind: "error", raw };
      }
    }
  }

  // Try TRAILING pattern first: "Intro 10", "Demo - 20 min", "90 second teaser", "Q&A 1h"
  let m = line.match(TRAILING_RE);
  if (m) {
    const namePart = m[1].trim();
    const numStr = m[2];
    const unitStr = (m[3] ?? "").toLowerCase().trim();
    if (namePart && !/^\d+$/.test(namePart)) {
      const minutes = parseQuantity(numStr, unitStr);
      if (minutes !== null && minutes > 0) {
        // round fractional minutes to nearest whole minute (e.g. 90s = 1.5 → 2, but ≤1 stays 1)
        const mins = Math.max(1, Math.round(minutes));
        return { kind: "item", name: namePart, minutes: mins, raw };
      }
    }
  }

  // Try LEADING pattern: "10 Intro", "10 min Intro", "1h Keynote"
  m = line.match(LEADING_RE);
  if (m) {
    const numStr = m[1];
    const unitStr = (m[2] ?? "").toLowerCase().trim();
    const namePart = m[3].trim();
    if (namePart && !/^\d+$/.test(namePart)) {
      const minutes = parseQuantity(numStr, unitStr);
      if (minutes !== null && minutes > 0) {
        const mins = Math.max(1, Math.round(minutes));
        return { kind: "item", name: namePart, minutes: mins, raw };
      }
    }
  }

  return { kind: "error", raw };
}

export function parseAgenda(text: string): ParsedLine[] {
  return text
    .split("\n")
    .map(parseLine)
    .filter((l): l is ParsedLine => l !== null);
}

export function itemsOf(lines: ParsedLine[]): Item[] {
  return lines
    .filter((l): l is Extract<ParsedLine, { kind: "item" }> => l.kind === "item")
    .map((l) => {
      const item: Item = { name: l.name, minutes: l.minutes };
      if (l.colonEchoStr) item.colonEchoStr = l.colonEchoStr;
      return item;
    });
}

/** Epoch ms for HH:MM on the same calendar day as `ref`. */
export function startMsFromHHMM(hhmm: string, ref: number): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(ref);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}

/** Next 5-minute wall-clock mark at or after `now`, as "HH:MM" (24h, for <input type=time>). */
export function nextFiveMark(now: number): string {
  const d = new Date(now);
  const total = d.getHours() * 60 + d.getMinutes() + (d.getSeconds() > 0 || d.getMilliseconds() > 0 ? 1 : 0);
  const next = (Math.ceil(total / 5) * 5) % 1440;
  const h = Math.floor(next / 60);
  const m = next % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Cumulative planned start times (epoch ms) for each item. */
export function plannedStarts(items: Item[], startMs: number): number[] {
  const out: number[] = [];
  let t = startMs;
  for (const it of items) {
    out.push(t);
    t += it.minutes * 60_000;
  }
  return out;
}

export type LiveState = {
  current: number; // index of current item
  ended: boolean;
  countdownMs: number; // time left in current item; negative = overtime
  driftMs: number; // positive = behind plan, negative = ahead
  projected: number[]; // per item: actual start (past/current) or projected start (future)
  projectedEnd: number; // projected end of the whole show
};

/**
 * actuals[i] = actual start of item i; an extra trailing entry (length n+1)
 * marks the recorded end of the show.
 * Drift = actual minus planned start of the current item, and once the current
 * item overruns its duration it keeps growing live (now vs planned end).
 */
export function liveState(
  items: Item[],
  planned: number[],
  actuals: number[],
  now: number
): LiveState {
  const n = items.length;
  const k = Math.min(actuals.length, n + 1);
  const ended = k > n;
  const current = ended ? n - 1 : k - 1;
  const durMs = (i: number) => items[i].minutes * 60_000;

  const projected: number[] = new Array(n);
  for (let i = 0; i <= current; i++) projected[i] = actuals[i];

  const plannedEndCurrent = planned[current] + durMs(current);
  let cursor: number; // projected start of the item after `current`
  if (ended) {
    cursor = actuals[n];
  } else {
    cursor = Math.max(now, actuals[current] + durMs(current));
  }
  const driftMs = cursor - plannedEndCurrent;
  for (let i = current + 1; i < n; i++) {
    projected[i] = cursor;
    cursor += durMs(i);
  }
  const projectedEnd = ended ? actuals[n] : cursor;
  // clamp `now` to >= the actual start so a slightly stale clock tick can never
  // show more than the item's full duration right after Start/Next
  const countdownMs = ended
    ? 0
    : actuals[current] + durMs(current) - Math.max(now, actuals[current]);
  return { current, ended, countdownMs, driftMs, projected, projectedEnd };
}

export function driftMinutes(driftMs: number): number {
  // truncate toward zero: drift is shown in whole minutes, so sub-minute
  // wobble around the planned time reads as "on time"
  return Math.trunc(driftMs / 60_000);
}

/**
 * Human-readable drift label with magnitude.
 * Grace band: |driftMs| < 5 seconds reads as "on time" to absorb sub-tick clock jitter,
 * while a real 10-second overrun IS surfaced ("10s behind").
 * Shows seconds when under 1 minute so the value is never "0 min behind/ahead".
 */
export function driftLabel(driftMs: number): string {
  const GRACE_MS = 5_000; // 5s grace — absorbs clock jitter, shows +10s overruns
  if (Math.abs(driftMs) < GRACE_MS) return "on time";
  if (driftMs < 0) {
    // ahead — negative driftMs
    const totalSec = Math.round(-driftMs / 1000);
    if (totalSec < 60) return `${totalSec}s ahead`;
    const m = Math.floor(totalSec / 60);
    return `${m} min ahead`;
  }
  // behind — positive driftMs
  const totalSec = Math.round(driftMs / 1000);
  if (totalSec < 60) return `${totalSec}s behind`;
  const m = Math.floor(totalSec / 60);
  return `${m} min behind`;
}

export function fmtClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtCountdown(ms: number): string {
  const over = ms < 0;
  const totalSec = over ? Math.floor(-ms / 1000) : Math.ceil(ms / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${over ? "+" : ""}${mm}:${String(ss).padStart(2, "0")}`;
}
