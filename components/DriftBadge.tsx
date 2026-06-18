"use client";

import { driftLabel, driftMinutes } from "@/lib/agenda";

// Badge own-sign thresholds for behind severity (in minutes)
const BEHIND_RED_THRESHOLD_MIN = 5;

/**
 * Derive the badge's own color/state from the whole-show drift value.
 * Color always agrees with words — never red while saying "ahead".
 *
 * States:
 *   on-time      : driftMs rounds to 0 min
 *   ahead        : driftMs < 0 (negative = ahead)
 *   behind-amber : driftMs > 0, < BEHIND_RED_THRESHOLD_MIN min
 *   behind-red   : driftMs >= BEHIND_RED_THRESHOLD_MIN min
 */
export type BadgeDriftState = "on-time" | "ahead" | "behind-amber" | "behind-red";

export function badgeDriftState(driftMs: number, neutral: boolean): BadgeDriftState {
  if (neutral) return "on-time";
  const m = driftMinutes(driftMs);
  if (m === 0) return "on-time";
  if (m < 0) return "ahead";
  return m >= BEHIND_RED_THRESHOLD_MIN ? "behind-red" : "behind-amber";
}

export default function DriftBadge({
  driftMs,
  big = false,
  neutral = false,
}: {
  driftMs: number;
  big?: boolean;
  /** When true, always render as on-time (session not yet started). */
  neutral?: boolean;
}) {
  const state = badgeDriftState(driftMs, neutral);

  const color =
    state === "on-time"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      : state === "ahead"
        ? "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
        : state === "behind-amber"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200";

  const label = neutral ? "on time · 0 min" : driftLabel(driftMs);

  // Secondary micro-label identifies this as whole-show drift so it's
  // never misread as the item-level signal.
  const subLabel = big ? "whole-show drift" : null;

  return (
    <span
      data-testid="drift-badge"
      data-header-cue-state={state}
      className={`inline-flex flex-col items-start rounded-2xl font-semibold tracking-tight ${color} ${
        big ? "px-8 py-4" : "px-3 py-1"
      }`}
    >
      <span className={big ? "text-6xl" : "text-sm"}>{label}</span>
      {subLabel && (
        <span className="mt-0.5 text-xs font-normal uppercase tracking-widest opacity-70">
          {subLabel}
        </span>
      )}
    </span>
  );
}
