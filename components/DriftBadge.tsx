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
  const color =
    m === 0
      ? "bg-emerald-600 text-white"
      : m < 0
        ? "bg-sky-600 text-white"
        : "bg-amber-500 text-black";
  const label = neutral ? "on time · 0 min" : driftLabel(driftMs);
  return (
    <span
      data-testid="drift-badge"
      className={`inline-block rounded-full font-bold ${color} ${
        big ? "px-5 py-2 text-2xl" : "px-3 py-1 text-sm"
      }`}
    >
      {label}
    </span>
  );
}
