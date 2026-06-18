import { describe, expect, it } from "vitest";
import { getCueState } from "./cueState";

// Worked examples from UX brief C1:
//   1-min item  → amberMs = max(60000, 12000) = 60000 → AMBER entire run, RED at 0:00
//   10-min item → amberMs = max(60000, 120000) = 120000 → GREEN 8 min, AMBER last 2, RED past 0
//   5-min item  → amberMs = max(60000, 60000) = 60000 → GREEN 4 min, AMBER last 1, RED past 0

describe("getCueState", () => {
  it("returns neutral when ended", () => {
    expect(getCueState(60_000, 10, true)).toBe("neutral");
    expect(getCueState(-5_000, 10, true)).toBe("neutral");
    expect(getCueState(0, 10, true)).toBe("neutral");
  });

  describe("1-minute item (amberMs = 60000 = full minute)", () => {
    const min = 1;
    it("is AMBER immediately at start (60s left)", () => {
      expect(getCueState(60_000, min, false)).toBe("amber");
    });
    it("is AMBER at 30s left", () => {
      expect(getCueState(30_000, min, false)).toBe("amber");
    });
    it("is AMBER at 1ms left", () => {
      expect(getCueState(1, min, false)).toBe("amber");
    });
    it("is RED at 0ms (time-up)", () => {
      expect(getCueState(0, min, false)).toBe("red");
    });
    it("is RED on overrun", () => {
      expect(getCueState(-5_000, min, false)).toBe("red");
    });
  });

  describe("10-minute item (amberMs = 120000 = 2 min)", () => {
    const min = 10;
    it("is GREEN at start (10 min left)", () => {
      expect(getCueState(10 * 60_000, min, false)).toBe("green");
    });
    it("is GREEN just above amber threshold (120001ms left)", () => {
      expect(getCueState(120_001, min, false)).toBe("green");
    });
    it("is AMBER exactly at amber threshold (120000ms left)", () => {
      expect(getCueState(120_000, min, false)).toBe("amber");
    });
    it("is AMBER at 1 min left", () => {
      expect(getCueState(60_000, min, false)).toBe("amber");
    });
    it("is AMBER at 1ms left", () => {
      expect(getCueState(1, min, false)).toBe("amber");
    });
    it("is RED at 0 (time-up)", () => {
      expect(getCueState(0, min, false)).toBe("red");
    });
    it("is RED at -30s (overrun)", () => {
      expect(getCueState(-30_000, min, false)).toBe("red");
    });
  });

  describe("5-minute item (amberMs = max(60000,60000) = 60000 = 1 min)", () => {
    const min = 5;
    it("is GREEN at start (5 min left)", () => {
      expect(getCueState(5 * 60_000, min, false)).toBe("green");
    });
    it("is GREEN at 4 min left", () => {
      expect(getCueState(4 * 60_000, min, false)).toBe("green");
    });
    it("is GREEN just above 60s (60001ms)", () => {
      expect(getCueState(60_001, min, false)).toBe("green");
    });
    it("is AMBER exactly at 60s", () => {
      expect(getCueState(60_000, min, false)).toBe("amber");
    });
    it("is AMBER at 30s left", () => {
      expect(getCueState(30_000, min, false)).toBe("amber");
    });
    it("is RED at 0", () => {
      expect(getCueState(0, min, false)).toBe("red");
    });
  });

  describe("30-minute item (amberMs = max(60000, 360000) = 360000 = 6 min)", () => {
    const min = 30;
    it("is GREEN at 7 min left (420000ms > 360000ms)", () => {
      expect(getCueState(7 * 60_000, min, false)).toBe("green");
    });
    it("is GREEN just above amber (360001ms)", () => {
      expect(getCueState(360_001, min, false)).toBe("green");
    });
    it("is AMBER at exactly 6 min left (360000ms)", () => {
      expect(getCueState(360_000, min, false)).toBe("amber");
    });
    it("is AMBER at 3 min left", () => {
      expect(getCueState(3 * 60_000, min, false)).toBe("amber");
    });
    it("is RED past 0", () => {
      expect(getCueState(-1, min, false)).toBe("red");
    });
  });
});
