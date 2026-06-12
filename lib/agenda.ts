// Agenda parsing and schedule math. Pure functions, no React.

export type ParsedLine =
  | { kind: "item"; name: string; minutes: number; raw: string }
  | { kind: "error"; raw: string };

export type Item = { name: string; minutes: number };

// "Intro 10", "Intro - 10 min", "Intro (10 min)", "Demo: 20"
const TRAILING =
  /^(.+?)[\s\-–—:·]*\(?\s*(\d{1,3})\s*(?:m|min|mins|minute|minutes)?\s*\)?\s*\.?$/i;
// "10 Intro", "10 min Intro", "10 - Intro"
const LEADING =
  /^(\d{1,3})\s*(?:m|min|mins|minute|minutes)?\b[\s\-–—:·]*(.+)$/i;

export function parseLine(raw: string): ParsedLine | null {
  const line = raw.trim();
  if (!line) return null;
  let m = line.match(TRAILING);
  if (m) {
    const name = m[1].trim();
    const minutes = parseInt(m[2], 10);
    if (name && !/^\d+$/.test(name) && minutes > 0) {
      return { kind: "item", name, minutes, raw };
    }
  }
  m = line.match(LEADING);
  if (m) {
    const minutes = parseInt(m[1], 10);
    const name = m[2].trim();
    if (name && minutes > 0) return { kind: "item", name, minutes, raw };
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
