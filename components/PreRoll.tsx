"use client";

import { useEffect, useRef, useState } from "react";
import { fmtClock, fmtDuration, itemsOf, parseAgenda, plannedStarts, startMsFromHHMM } from "@/lib/agenda";
import type { Session } from "@/lib/codec";
import { claimOwnership, setSession } from "@/lib/store";

/** Format remaining ms as HH:MM:SS */
function fmtCountdownHMS(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function PreRoll({
  session,
}: {
  session: Session;
}) {
  // pr is the epoch-ms when the show should begin
  const plannedStartMs = session.pr!;
  const [remaining, setRemaining] = useState<number>(() => plannedStartMs - Date.now());

  // Tick every second using an interval tied to a ref so React re-renders don't reset it
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  function beginShow() {
    if (firedRef.current) return;
    firedRef.current = true;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const actualNow = Date.now();
    setSession({ ...session, a: [actualNow], pr: undefined }, true);
  }

  // Also claim ownership so this tab becomes the presenter
  function beginShowWithOwnership() {
    if (firedRef.current) return;
    firedRef.current = true;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const id = session.id ?? Math.random().toString(36).slice(2, 10);
    claimOwnership(id);
    const actualNow = Date.now();
    setSession({ ...session, id, a: [actualNow], pr: undefined }, true);
  }

  useEffect(() => {
    function tick() {
      const r = plannedStartMs - Date.now();
      setRemaining(r);
      if (r <= 0 && !firedRef.current) {
        beginShow();
      }
    }
    // Run immediately to sync
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedStartMs]);

  // Build the planned rundown for display
  const items = itemsOf(parseAgenda(session.t));
  const startMs = startMsFromHHMM(session.s, plannedStartMs);
  const planned = plannedStarts(items, startMs);
  const totalMin = items.reduce((s, it) => s + it.minutes, 0);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <main className="mx-auto w-full max-w-xl p-4 pb-10">
      <header className="py-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Showclock</h1>
        <p className="mt-1 text-sm text-gray-500">
          Show starts at {fmtClock(plannedStartMs)}
        </p>
      </header>

      {/* Large countdown hero */}
      <section
        aria-label="Pre-show countdown"
        className="mt-4 rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          Starts in
        </p>
        <div
          data-testid="preroll-countdown"
          aria-live="off"
          className={`mt-2 font-mono text-6xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100 ${
            !reducedMotion && remaining > 0 ? "transition-all duration-500" : ""
          }`}
        >
          {remaining > 0 ? fmtCountdownHMS(remaining) : "00:00:00"}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Planned start: {fmtClock(plannedStartMs)}
        </p>

        {/* Start now override button */}
        <button
          type="button"
          data-testid="start-now-btn"
          onClick={beginShowWithOwnership}
          className="mt-6 w-full rounded-2xl bg-emerald-600 py-4 text-2xl font-bold text-white hover:bg-emerald-700 active:bg-emerald-800"
        >
          Start now
        </button>
        <p className="mt-2 text-xs text-gray-400">
          The show will begin automatically when the countdown reaches zero.
        </p>
      </section>

      {/* Planned rundown — read-only, so host can verify while waiting */}
      {items.length > 0 && (
        <section className="mt-8" aria-label="Planned rundown">
          <div className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Planned rundown</span>
            <span className="font-mono normal-case tabular-nums">{fmtDuration(totalMin)} total</span>
          </div>
          <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0 truncate font-medium">{item.name}</span>
                <span className="flex shrink-0 items-baseline gap-2 font-mono text-sm tabular-nums text-gray-500">
                  <span>{fmtDuration(item.minutes)}</span>
                  <span className="text-gray-400">·</span>
                  <span>{planned[i] !== undefined ? fmtClock(planned[i]) : "—"}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
