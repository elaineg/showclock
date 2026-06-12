"use client";

import { driftLabel, driftMinutes } from "@/lib/agenda";

export default function DriftBadge({ driftMs, big = false }: { driftMs: number; big?: boolean }) {
  const m = driftMinutes(driftMs);
  const color =
    m === 0
      ? "bg-emerald-600 text-white"
      : m < 0
        ? "bg-sky-600 text-white"
        : "bg-amber-500 text-black";
  return (
    <span
      data-testid="drift-badge"
      className={`inline-block rounded-full font-bold ${color} ${
        big ? "px-5 py-2 text-2xl" : "px-3 py-1 text-sm"
      }`}
    >
      {driftLabel(driftMs)}
    </span>
  );
}
