// Pure cue-state function — single source of truth for the green/amber/red band.
// No React, fully unit-testable.

export type CueState = "green" | "amber" | "red" | "neutral";

/**
 * Derive the stage-cue state from live timing data.
 *
 * @param countdownMs - Time left in current item (ms). Negative means overrun.
 * @param minutes     - Planned duration of the current item (minutes).
 * @param ended       - True when the entire show is complete.
 *
 * Rules (from UX brief C1):
 *   durMs    = minutes * 60_000
 *   amberMs  = max(60_000, 0.2 * durMs)
 *   GREEN    : countdownMs > amberMs
 *   AMBER    : 0 < countdownMs <= amberMs
 *   RED      : countdownMs <= 0
 *   NEUTRAL  : ended (show complete)
 */
export function getCueState(
  countdownMs: number,
  minutes: number,
  ended: boolean,
): CueState {
  if (ended) return "neutral";
  const durMs = minutes * 60_000;
  const amberMs = Math.max(60_000, 0.2 * durMs);
  if (countdownMs <= 0) return "red";
  if (countdownMs <= amberMs) return "amber";
  return "green";
}
