"use client";

import { driftLabel, driftMinutes } from "@/lib/agenda";

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
  const m = neutral ? 0 : driftMinutes(driftMs);
  // H4: calm color treatment — softer tones, no harsh contrast
  const color =
    m === 0
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      : m < 0
        ? "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  const label = neutral ? "on time · 0 min" : driftLabel(driftMs);
  return (
    <span
      data-testid="drift-badge"
      className={`inline-block rounded-2xl font-semibold tracking-tight ${color} ${
        big ? "px-8 py-4 text-6xl" : "px-3 py-1 text-sm"
      }`}
    >
      {label}
    </span>
  );
}
