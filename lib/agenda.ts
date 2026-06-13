// Agenda parsing and schedule math. Pure functions, no React.

export type ParsedLine =
  | { kind: "item"; name: string; minutes: number; raw: string }
  | { kind: "error"; raw: string };

export type Item = { name: string; minutes: number };

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

export function parseLine(raw: string): ParsedLine | null {
  const line = raw.trim();
  if (!line) return null;

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
    if (namePart) {
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
  return lines.filter((l): l is Extract<ParsedLine, { kind: "item" }> => l.kind === "item");
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

export function driftLabel(driftMs: number): string {
  const m = driftMinutes(driftMs);
  if (m === 0) return "on time";
  return m < 0 ? `${-m} min ahead` : `${m} min behind`;
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
