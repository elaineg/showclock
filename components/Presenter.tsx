"use client";

import { useState } from "react";
import {
  driftMinutes,
  fmtClock,
  fmtCountdown,
  liveState,
  plannedStarts,
  startMsFromHHMM,
  type Item,
} from "@/lib/agenda";
import type { Session } from "@/lib/codec";
import { encodeHash } from "@/lib/codec";
import { setSession, useNow } from "@/lib/store";
import DriftBadge from "./DriftBadge";

export default function Presenter({
  session,
  items,
  readOnly,
}: {
  session: Session;
  items: Item[];
  readOnly: boolean;
}) {
  const now = useNow();
  const [copied, setCopied] = useState(false);
  const startMs = startMsFromHHMM(session.s, session.a[0]);
  const planned = plannedStarts(items, startMs);
  const live = liveState(items, planned, session.a, now || session.a[session.a.length - 1]);
  const cur = items[live.current];
  const overtime = !live.ended && live.countdownMs < 0;

  const next = () => setSession({ ...session, a: [...session.a, Date.now()] }, true);
  const back = () => {
    if (session.a.length <= 1) {
      setSession({ t: session.t, s: session.s, a: [] }, true);
    } else {
      setSession({ ...session, a: session.a.slice(0, -1) }, true);
    }
  };
  const exit = () => setSession({ t: session.t, s: session.s, a: [] }, true);

  const copyViewLink = async () => {
    const url =
      window.location.origin + window.location.pathname + encodeHash(session, true);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this view-only link:", url);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col p-4 pb-10">
      {readOnly && (
        <p className="mb-3 rounded-lg bg-gray-100 px-3 py-2 text-center text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
          Snapshot view (read-only) — shows the session as of when this URL was made.
          Re-copy the presenter&apos;s URL for the latest Next/Back state.
        </p>
      )}

      <section className="text-center">
        {live.ended ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Show complete
            </p>
            <h2 className="mt-1 text-4xl font-extrabold">That&apos;s a wrap</h2>
            <p className="mt-2 text-gray-500">
              Finished at {fmtClock(session.a[items.length])} · planned{" "}
              {fmtClock(planned[items.length - 1] + items[items.length - 1].minutes * 60_000)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Now · item {live.current + 1} of {items.length}
            </p>
            <h2 className="mt-1 break-words text-4xl font-extrabold leading-tight">
              {cur.name}
            </h2>
            <div
              data-testid="countdown"
              className={`mt-2 font-mono text-8xl font-bold tabular-nums ${
                overtime ? "text-rose-600" : ""
              }`}
            >
              {now ? fmtCountdown(live.countdownMs) : "–:––"}
            </div>
            <p className="text-sm text-gray-500">
              {overtime ? "over the planned " : "of "}
              {cur.minutes} min{overtime ? "" : " planned"}
            </p>
          </>
        )}
        <div className="mt-3">
          <DriftBadge driftMs={live.driftMs} big />
        </div>
      </section>

      {!readOnly && (
        <section className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={back}
            className="w-1/3 rounded-2xl border-2 border-gray-300 py-4 text-xl font-bold dark:border-gray-700"
          >
            Back
          </button>
          {!live.ended ? (
            <button
              type="button"
              onClick={next}
              className="w-2/3 rounded-2xl bg-emerald-600 py-4 text-2xl font-bold text-white"
            >
              {live.current === items.length - 1 ? "Finish" : "Next"}
            </button>
          ) : (
            <button
              type="button"
              onClick={exit}
              className="w-2/3 rounded-2xl bg-gray-800 py-4 text-2xl font-bold text-white dark:bg-gray-200 dark:text-black"
            >
              New show
            </button>
          )}
        </section>
      )}

      <section className="mt-8" aria-label="Rundown">
        <div className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Rundown</span>
          <span className="font-mono normal-case">planned → projected</span>
        </div>
        <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {items.map((it, i) => {
            const done = i < live.current || live.ended;
            const isCur = i === live.current && !live.ended;
            const shifted = driftMinutes(live.projected[i] - planned[i]) !== 0;
            return (
              <li
                key={i}
                className={`flex items-center justify-between gap-3 px-3 py-2 ${
                  isCur ? "bg-emerald-50 dark:bg-emerald-950" : done ? "opacity-50" : ""
                }`}
              >
                <span className="min-w-0 truncate">
                  <span className={`font-medium ${done ? "line-through" : ""}`}>{it.name}</span>{" "}
                  <span className="text-sm text-gray-500">{it.minutes}m</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2 font-mono text-sm tabular-nums">
                  <span className="text-gray-500">{fmtClock(planned[i])}</span>
                  <span aria-hidden>→</span>
                  <span
                    className={`font-semibold ${
                      i <= live.current
                        ? ""
                        : shifted
                          ? live.projected[i] < planned[i]
                            ? "text-sky-600"
                            : "text-amber-600"
                          : "text-gray-500"
                    }`}
                  >
                    {fmtClock(live.projected[i])}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-right font-mono text-sm text-gray-500">
          projected end {now ? fmtClock(live.projectedEnd) : "—"}
        </p>
      </section>

      {!readOnly && (
        <section className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={copyViewLink}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-700"
          >
            Copy view-only link
          </button>
          <span
            aria-live="polite"
            className={`text-sm text-emerald-600 ${copied ? "" : "invisible"}`}
          >
            Copied
          </span>
          <button type="button" onClick={exit} className="text-sm text-gray-500 underline">
            End &amp; edit agenda
          </button>
        </section>
      )}
    </main>
  );
}
