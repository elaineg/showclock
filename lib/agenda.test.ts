import { describe, expect, it } from "vitest";
import {
  driftLabel,
  fmtCountdown,
  itemsOf,
  liveState,
  nextFiveMark,
  parseAgenda,
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
    expect(driftLabel(live.driftMs)).toBe("9 min ahead"); // -9.5 min rounds to 9 ahead
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

  it("trailing actual entry ends the show", () => {
    const p = plannedStarts(items, nine);
    const a = [nine, nine + 10 * 60_000, nine + 30 * 60_000, nine + 44 * 60_000];
    const live = liveState(items, p, a, nine + 50 * 60_000);
    expect(live.ended).toBe(true);
    expect(driftLabel(live.driftMs)).toBe("1 min ahead");
  });
});

describe("nextFiveMark", () => {
  it("rounds up to the next 5-minute mark", () => {
    expect(nextFiveMark(new Date(2026, 5, 12, 9, 1, 10).getTime())).toBe("09:05");
    expect(nextFiveMark(new Date(2026, 5, 12, 9, 0, 0, 0).getTime())).toBe("09:00");
    expect(nextFiveMark(new Date(2026, 5, 12, 23, 58, 1).getTime())).toBe("00:00");
  });
});
