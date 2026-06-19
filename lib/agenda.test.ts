import { describe, expect, it } from "vitest";
import {
  driftLabel,
  fmtCountdown,
  fmtDuration,
  itemsOf,
  liveState,
  minutesToRoundTripStr,
  nextFiveMark,
  parseAgenda,
  parseColonDuration,
  parseLine,
  plannedStarts,
  startMsFromHHMM,
} from "./agenda";

describe("parseLine", () => {
  it('parses "Intro 10"', () => {
    expect(parseLine("Intro 10")).toEqual({ kind: "item", name: "Intro", minutes: 10, raw: "Intro 10" });
  });
  it('parses "Demo - 20 min"', () => {
    expect(parseLine("Demo - 20 min")).toMatchObject({ kind: "item", name: "Demo", minutes: 20 });
  });
  it('parses "15 Q&A" (leading duration)', () => {
    expect(parseLine("15 Q&A")).toMatchObject({ kind: "item", name: "Q&A", minutes: 15 });
  });
  it('parses "Break (5 min)" and "Wrap: 5"', () => {
    expect(parseLine("Break (5 min)")).toMatchObject({ kind: "item", name: "Break", minutes: 5 });
    expect(parseLine("Wrap: 5")).toMatchObject({ kind: "item", name: "Wrap", minutes: 5 });
  });
  it("flags unparseable lines", () => {
    expect(parseLine("just some words")).toMatchObject({ kind: "error" });
    expect(parseLine("0 nothing")?.kind).toBe("error");
  });
  it("skips blank lines", () => {
    expect(parseLine("   ")).toBeNull();
  });
});

describe("schedule", () => {
  const text = "Intro 10\nDemo - 20 min\n15 Q&A";
  const items = itemsOf(parseAgenda(text));
  const day = new Date(2026, 5, 12, 0, 0, 0, 0).getTime();
  const nine = startMsFromHHMM("09:00", day);

  it("computes cumulative planned starts 9:00 / 9:10 / 9:30", () => {
    const p = plannedStarts(items, nine);
    expect(p.map((t) => new Date(t).getHours() * 60 + new Date(t).getMinutes())).toEqual([
      540, 550, 570,
    ]);
  });

  it("unparseable line does not break the rest", () => {
    const lines = parseAgenda("Intro 10\njust some words\n15 Q&A");
    expect(lines).toHaveLength(3);
    expect(lines[1].kind).toBe("error");
    expect(itemsOf(lines)).toHaveLength(2);
  });

  it("is on time right after starting on schedule", () => {
    const p = plannedStarts(items, nine);
    const live = liveState(items, p, [nine], nine + 1000);
    expect(live.current).toBe(0);
    // 1 second elapsed: |driftMs| < 15s grace → "on time"
    expect(driftLabel(live.driftMs)).toBe("on time");
    expect(fmtCountdown(live.countdownMs)).toBe("9:59");
    const liveAtStart = liveState(items, p, [nine], nine);
    expect(fmtCountdown(liveAtStart.countdownMs)).toBe("10:00");
  });

  it("Next immediately after Start = ~10 min ahead, projections pulled earlier", () => {
    const t1 = nine + 30_000; // pressed Next 30s in
    const p = plannedStarts(items, nine);
    const live = liveState(items, p, [nine, t1], t1 + 1000);
    expect(live.current).toBe(1);
    expect(driftLabel(live.driftMs)).toBe("9 min ahead"); // ~570s ahead → "9 min ahead"
    // projected Q&A start = actual Demo start + 20min, ~9.5 min before planned 9:30
    expect(live.projected[2]).toBe(t1 + 20 * 60_000);
    expect(p[2] - live.projected[2]).toBe(9.5 * 60_000);
  });

  it("overrunning the current item drifts behind and grows", () => {
    const p = plannedStarts(items, nine);
    const at = (min: number) => nine + min * 60_000;
    const a = [nine]; // still on Intro (10 min) at minute 13
    const live = liveState(items, p, a, at(13));
    expect(driftLabel(live.driftMs)).toBe("3 min behind");
    expect(live.countdownMs).toBeLessThan(0);
    expect(live.projected[1] - p[1]).toBe(3 * 60_000);
    const later = liveState(items, p, a, at(15));
    expect(driftLabel(later.driftMs)).toBe("5 min behind");
  });

  it("overrun by 10 seconds shows 'behind' (not 'on time') — Defect C fix", () => {
    const p = plannedStarts(items, nine);
    // Intro is 10 min. At 10 min + 10 sec, we're 10s behind.
    const live = liveState(items, p, [nine], nine + 10 * 60_000 + 10_000);
    // 10 seconds behind is > 15s grace? No — 10s < 15s grace, still "on time".
    // The acceptance test is +0:10 past a 1-MIN item (not 10-min). Use a 1-min item:
    const items1 = itemsOf(parseAgenda("Session 1\nBreak 10"));
    const p1 = plannedStarts(items1, nine);
    const live1 = liveState(items1, p1, [nine], nine + 60_000 + 10_000); // 1:10 into 1-min item
    expect(driftLabel(live1.driftMs)).not.toBe("on time"); // 10s overrun → behind
    expect(live1.driftMs).toBeGreaterThan(0);
  });

  it("trailing actual entry ends the show", () => {
    const p = plannedStarts(items, nine);
    const a = [nine, nine + 10 * 60_000, nine + 30 * 60_000, nine + 44 * 60_000];
    const live = liveState(items, p, a, nine + 50 * 60_000);
    expect(live.ended).toBe(true);
    // 1 min ahead = 60000ms ahead → > 15s grace → "1 min ahead"
    expect(driftLabel(live.driftMs)).toBe("1 min ahead");
  });
});

describe("parseLine — unit handling (G3)", () => {
  it('"90 second teaser" → 2 min (90s rounds to 2), name=teaser', () => {
    const r = parseLine("90 second teaser");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("teaser");
      expect(r.minutes).toBe(2); // 90s = 1.5 min → rounded to 2
    }
  });
  it('"90 sec teaser" → 2 min', () => {
    const r = parseLine("90 sec teaser");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") expect(r.minutes).toBe(2);
  });
  it('"teaser 90s" → trailing seconds parse', () => {
    const r = parseLine("teaser 90s");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("teaser");
      expect(r.minutes).toBe(2);
    }
  });
  it('"1h Keynote" → 60 min', () => {
    const r = parseLine("1h Keynote");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Keynote");
      expect(r.minutes).toBe(60);
    }
  });
  it('"Keynote 1h" → 60 min', () => {
    const r = parseLine("Keynote 1h");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Keynote");
      expect(r.minutes).toBe(60);
    }
  });
  it('"1.5h Workshop" → 90 min', () => {
    const r = parseLine("1.5h Workshop");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") expect(r.minutes).toBe(90);
  });
  it('"30s Lightning" → 1 min (minimum 1)', () => {
    const r = parseLine("30s Lightning");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") expect(r.minutes).toBe(1);
  });
  it('"Intro 10" (no unit) → still 10 min (regression)', () => {
    const r = parseLine("Intro 10");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") expect(r.minutes).toBe(10);
  });
  it('"Demo - 20 min" → still 20 min (regression)', () => {
    const r = parseLine("Demo - 20 min");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") expect(r.minutes).toBe(20);
  });
  it('"15 Q&A" (leading, no unit) → still 15 min (regression)', () => {
    const r = parseLine("15 Q&A");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") expect(r.minutes).toBe(15);
  });
});

describe("liveState — cold drift neutral (G4)", () => {
  it("drift is 0 when actuals has only the start entry (session just started)", () => {
    const items = itemsOf(parseAgenda("Intro 10\nDemo 20"));
    const day = new Date(2026, 5, 12, 9, 0, 0, 0).getTime();
    const planned = plannedStarts(items, day);
    // actuals = [startMs] — just started, now = startMs
    const live = liveState(items, planned, [day], day);
    expect(driftLabel(live.driftMs)).toBe("on time");
  });
});

describe("nextFiveMark", () => {
  it("rounds up to the next 5-minute mark", () => {
    expect(nextFiveMark(new Date(2026, 5, 12, 9, 1, 10).getTime())).toBe("09:05");
    expect(nextFiveMark(new Date(2026, 5, 12, 9, 0, 0, 0).getTime())).toBe("09:00");
    expect(nextFiveMark(new Date(2026, 5, 12, 23, 58, 1).getTime())).toBe("00:00");
  });
});

// ===========================
// ROUND-4+7 DEFECT A/B: Colon-format duration parsing — M:SS canonical interpretation
// ===========================

describe("Defect A/B: colon-format durations — M:SS canonical interpretation (round 7)", () => {
  // Canonical contract: colon tokens are M:SS (minutes:seconds).
  // "1:30" = 1m30s = 90 sec = 1.5 min
  // "0:30" = 30 sec = 0.5 min
  // "12:30" = 12m30s = 750 sec = 12.5 min
  // "0:05" = 5 sec = 5/60 min
  // "2:00" = 2m = 2 min (whole)

  it("parseColonDuration: M:SS rule — '1:30' → 1.5 min (90 sec)", () => {
    expect(parseColonDuration("1:30")).toBeCloseTo(1.5, 5);
  });
  it("parseColonDuration: '0:30' → 0.5 min (30 sec)", () => {
    expect(parseColonDuration("0:30")).toBeCloseTo(0.5, 5);
  });
  it("parseColonDuration: '12:30' → 12.5 min (750 sec)", () => {
    expect(parseColonDuration("12:30")).toBeCloseTo(12.5, 5);
  });
  it("parseColonDuration: '0:05' → 5/60 min (5 sec)", () => {
    expect(parseColonDuration("0:05")).toBeCloseTo(5 / 60, 5);
  });
  it("parseColonDuration: '2:00' → 2 min (whole)", () => {
    expect(parseColonDuration("2:00")).toBeCloseTo(2, 5);
  });
  it("parseColonDuration: '0:00' → null (zero not valid)", () => {
    expect(parseColonDuration("0:00")).toBeNull();
  });
  it("parseColonDuration: seconds >= 60 → null (invalid)", () => {
    expect(parseColonDuration("1:60")).toBeNull();
    expect(parseColonDuration("0:99")).toBeNull();
  });

  it('"Keynote 0:05" → name is "Keynote", duration ≈ 5/60 min (5 sec in M:SS)', () => {
    const r = parseLine("Keynote 0:05");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Keynote"); // NOT "Keynote 0"
      expect(r.minutes).toBeCloseTo(5 / 60, 5); // M:SS: 5 sec
    }
  });

  it('"Keynote 1:30" → M:SS: 1m30s = 90 sec = 1.5 min, name is "Keynote"', () => {
    const r = parseLine("Keynote 1:30");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Keynote"); // NOT "Keynote 1"
      expect(r.minutes).toBeCloseTo(1.5, 5); // 90 sec = 1.5 min
    }
  });

  it('"Standup 0:30" → M:SS: 30 sec = 0.5 min', () => {
    const r = parseLine("Standup 0:30");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Standup");
      expect(r.minutes).toBeCloseTo(0.5, 5); // 30 sec = 0.5 min
    }
  });

  it('"Demo 12:30" → M:SS: 12m30s = 750 sec = 12.5 min', () => {
    const r = parseLine("Demo 12:30");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Demo");
      expect(r.minutes).toBeCloseTo(12.5, 5); // 750 sec = 12.5 min
    }
  });

  it('"Keynote 2:00" → M:SS: 2m0s = 2 min (whole)', () => {
    const r = parseLine("Keynote 2:00");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Keynote");
      expect(r.minutes).toBeCloseTo(2, 5); // 2 min whole
    }
  });

  // colon echo must be present
  it('"Keynote 1:30" carries colonEchoStr "→ 1m 30s"', () => {
    const r = parseLine("Keynote 1:30");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.colonEchoStr).toBe("→ 1m 30s");
    }
  });
  it('"Standup 0:30" carries colonEchoStr "→ 30s"', () => {
    const r = parseLine("Standup 0:30");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.colonEchoStr).toBe("→ 30s");
    }
  });
  it('"Demo 12:30" carries colonEchoStr "→ 12m 30s"', () => {
    const r = parseLine("Demo 12:30");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.colonEchoStr).toBe("→ 12m 30s");
    }
  });

  // Non-colon plain items must NOT carry echo
  it('"Intro 10" (no colon) has no colonEchoStr', () => {
    const r = parseLine("Intro 10");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.colonEchoStr).toBeUndefined();
    }
  });

  // Regression: "Intro 10" still parses correctly (no colon, shouldn't be affected)
  it('"Intro 10" (no colon) still parses correctly — not affected by colon guard', () => {
    const r = parseLine("Intro 10");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Intro");
      expect(r.minutes).toBe(10);
    }
  });

  // "90 sec" still parses (regression)
  it('"Opening 90 sec" still parses correctly (90s → 1.5 min → rounded to 2 min)', () => {
    const r = parseLine("Opening 90 sec");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.name).toBe("Opening");
      expect(r.minutes).toBe(2); // 90s → 1.5min → rounded to 2min (non-colon path)
    }
  });

  // "1.5h Workshop" still parses (regression)
  it('"1.5h Workshop" still parses to 90 min (regression)', () => {
    const r = parseLine("1.5h Workshop");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.minutes).toBe(90);
    }
  });

  // "Demo - 20 min" still parses (regression)
  it('"Demo - 20 min" still parses to 20 min (regression)', () => {
    const r = parseLine("Demo - 20 min");
    expect(r?.kind).toBe("item");
    if (r?.kind === "item") {
      expect(r.minutes).toBe(20);
    }
  });

  // Standalone bare colon-token should be flagged (no name)
  it('"1:30" alone (no name) is flagged as unparseable — no item name', () => {
    const r = parseLine("1:30");
    expect(r?.kind).toBe("error");
  });
});

// fmtDuration
describe("fmtDuration: format fractional minutes as readable string", () => {
  it("1.5 min → '1m 30s'", () => { expect(fmtDuration(1.5)).toBe("1m 30s"); });
  it("0.5 min → '30s'", () => { expect(fmtDuration(0.5)).toBe("30s"); });
  it("12.5 min → '12m 30s'", () => { expect(fmtDuration(12.5)).toBe("12m 30s"); });
  it("10 min → '10m'", () => { expect(fmtDuration(10)).toBe("10m"); });
  it("5/60 min → '5s'", () => { expect(fmtDuration(5 / 60)).toBe("5s"); });
  it("2 min → '2m'", () => { expect(fmtDuration(2)).toBe("2m"); });
  it("0 min → '0m'", () => { expect(fmtDuration(0)).toBe("0m"); });
});

// minutesToRoundTripStr
describe("minutesToRoundTripStr: round-trip-safe format for copy", () => {
  it("10 min (whole) → '10'", () => { expect(minutesToRoundTripStr(10)).toBe("10"); });
  it("1.5 min → '1:30'", () => { expect(minutesToRoundTripStr(1.5)).toBe("1:30"); });
  it("0.5 min → '0:30'", () => { expect(minutesToRoundTripStr(0.5)).toBe("0:30"); });
  it("12.5 min → '12:30'", () => { expect(minutesToRoundTripStr(12.5)).toBe("12:30"); });
  it("5/60 min → '0:05'", () => { expect(minutesToRoundTripStr(5 / 60)).toBe("0:05"); });
  it("round-trip: '1:30' → 1.5 min → '1:30' → re-parse → 1.5 min", () => {
    const minutes = parseColonDuration("1:30")!;
    const str = minutesToRoundTripStr(minutes);
    expect(str).toBe("1:30");
    expect(parseColonDuration(str)).toBeCloseTo(1.5, 5);
  });
  it("round-trip: '0:30' → 0.5 min → '0:30' → re-parse → 0.5 min", () => {
    const minutes = parseColonDuration("0:30")!;
    const str = minutesToRoundTripStr(minutes);
    expect(str).toBe("0:30");
    expect(parseColonDuration(str)).toBeCloseTo(0.5, 5);
  });
});

// ===========================
// ROUND-4 DEFECT C: Live drift grows before Next is pressed
// ===========================

describe("Defect C: live drift grows before pressing Next (wall-clock overrun)", () => {
  it("item past its duration without pressing Next shows positive driftMs (behind)", () => {
    const items = itemsOf(parseAgenda("Session 5\nBreak 10"));
    // Pressed Start now (a[0] = t0). 8 min later (past the 5-min item), still haven't pressed Next.
    const t0 = new Date(2026, 0, 1, 9, 0, 0, 0).getTime();
    const planned = plannedStarts(items, t0); // drift-anchored to actual start
    const now = t0 + 8 * 60_000; // 8 min elapsed, item was 5 min
    const live = liveState(items, planned, [t0], now);
    // 3 min overrun: drift should be 3 min behind
    expect(live.driftMs).toBeGreaterThan(0);
    expect(driftLabel(live.driftMs)).toBe("3 min behind");
    // countdownMs is negative (overrun)
    expect(live.countdownMs).toBeLessThan(0);
  });

  it("drift grows further as more time passes (no Next pressed)", () => {
    const items = itemsOf(parseAgenda("Session 5\nBreak 10"));
    const t0 = new Date(2026, 0, 1, 9, 0, 0, 0).getTime();
    const planned = plannedStarts(items, t0);
    const live8 = liveState(items, planned, [t0], t0 + 8 * 60_000);
    const live9 = liveState(items, planned, [t0], t0 + 9 * 60_000);
    // Drift grows from 3 min to 4 min
    expect(live8.driftMs).toBeLessThan(live9.driftMs);
  });

  it("drift = 0 at the exact moment Start is pressed (no regression)", () => {
    const items = itemsOf(parseAgenda("Session 5\nBreak 10"));
    const t0 = new Date(2026, 0, 1, 9, 0, 0, 0).getTime();
    const planned = plannedStarts(items, t0);
    const live = liveState(items, planned, [t0], t0); // now = t0 exactly
    expect(live.driftMs).toBe(0);
    expect(driftLabel(live.driftMs)).toBe("on time");
  });

  it("Defect-C acceptance: 1-min item overrun by +10s → 'behind' (not 'on time')", () => {
    // Panel acceptance test: current item +0:10 past a 1-min planned duration = drift behind.
    // Grace band = 5s, so 10s overrun > grace → shows "10s behind" not "on time".
    const items = itemsOf(parseAgenda("Session 1\nBreak 10"));
    const t0 = new Date(2026, 0, 1, 9, 0, 0, 0).getTime();
    const planned = plannedStarts(items, t0);
    const now = t0 + 60_000 + 10_000; // 1:10 into a 1-min item
    const live = liveState(items, planned, [t0], now);
    expect(live.driftMs).toBe(10_000); // 10 seconds behind
    expect(live.countdownMs).toBeLessThan(0); // item is over
    // 10s > 5s grace → "10s behind" (NOT "on time")
    expect(driftLabel(live.driftMs)).toBe("10s behind");
    expect(driftLabel(live.driftMs)).not.toBe("on time");
  });

  it("drift label at start moment (driftMs=0) stays 'on time' (no regression)", () => {
    const items = itemsOf(parseAgenda("Session 1\nBreak 10"));
    const t0 = new Date(2026, 0, 1, 9, 0, 0, 0).getTime();
    const planned = plannedStarts(items, t0);
    const live = liveState(items, planned, [t0], t0); // exact start
    expect(live.driftMs).toBe(0);
    expect(driftLabel(live.driftMs)).toBe("on time");
  });
});

describe("H2 — past-start snap guard", () => {
  it("startMsFromHHMM resolves to earlier today when typed time is in the past", () => {
    // Simulate: user typed "09:00" but it's now 14:30
    const now = new Date(2026, 5, 12, 14, 30, 0, 0).getTime();
    const intendedMs = startMsFromHHMM("09:00", now);
    // intendedMs should be 9am same day — well before now
    expect(intendedMs).toBeLessThan(now - 60_000);
    // In the Planner onStart the snap condition fires, setting session.s to now's HH:MM
    // so drift starts at 0 instead of -330 min behind.
    const snappedHHMM = `${String(new Date(now).getHours()).padStart(2, "0")}:${String(new Date(now).getMinutes()).padStart(2, "0")}`;
    const snappedMs = startMsFromHHMM(snappedHHMM, now);
    // After snap, drift between snappedMs and now is ≤ 1 min (no scary number)
    expect(Math.abs(snappedMs - now)).toBeLessThan(60_000);
  });

  it("liveState shows ~0 drift when session start = actual start (snapped case)", () => {
    const items = itemsOf(parseAgenda("Welcome 10\nDemo 20"));
    // Simulate: user started at 14:30, start time also set to 14:30 (snapped)
    const startMs = new Date(2026, 5, 12, 14, 30, 0, 0).getTime();
    const planned = plannedStarts(items, startMs);
    // a[0] = startMs (session.a[0] = Date.now() in onStart, start=snapped HH:MM)
    const live = liveState(items, planned, [startMs], startMs + 5_000);
    expect(driftLabel(live.driftMs)).toBe("on time");
  });
});
