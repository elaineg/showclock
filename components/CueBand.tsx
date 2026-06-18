"use client";

// Full-width color band wrapping the current-item block.
// Color derived from getCueState; data-cue-state attr for deterministic testing.
// RED band pulses (CSS animation); respects prefers-reduced-motion.

import type { CueState } from "@/lib/cueState";

const bandClass: Record<CueState, string> = {
  green: "bg-emerald-500 text-white",
  amber: "bg-amber-400 text-amber-950",
  red: "bg-rose-600 text-white cue-band-pulse",
  neutral: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function CueBand({
  cueState,
  children,
}: {
  cueState: CueState;
  children: React.ReactNode;
}) {
  return (
    <div
      data-cue-state={cueState}
      className={`w-full rounded-xl px-4 py-5 transition-colors duration-300 ${bandClass[cueState]}`}
    >
      {children}
    </div>
  );
}
