"use client";

import { useEffect, useRef, useState } from "react";
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
import { copyToClipboard } from "@/lib/copyToClipboard";
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
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  // Ref-stable timeout so the per-500ms re-render from useNow() cannot clobber
  // the "Copied!" state: we clear+reset on each click, never derive from now.
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startMs = startMsFromHHMM(session.s, session.a[0]);
  const planned = plannedStarts(items, startMs);
  const live = liveState(items, planned, session.a, now || session.a[session.a.length - 1]);
  const cur = items[live.current];
  const overtime = !live.ended && live.countdownMs < 0;

  // G4: session is "started" only once there is at least 1 actual timestamp.
  // session.a[0] = Start was pressed. But before Start this component isn't rendered
  // (page.tsx only renders Presenter when running = a.length > 0).
  // Inside Presenter: drift is live from Start. Nothing to clamp here — already correct.

  const next = () => setSession({ ...session, a: [...session.a, Date.now()] }, true);
  const back = () => {
    if (session.a.length <= 1) {
      setSession({ t: session.t, s: session.s, a: [] }, true);
    } else {
      setSession({ ...session, a: session.a.slice(0, -1) }, true);
    }
  };
  const exit = () => setSession({ t: session.t, s: session.s, a: [] }, true);

  // G1 + G7: persistent "copy current link" button with "Copied!" inline confirmation.
  // The timeout is stored in a ref so the per-500ms useNow() re-render cannot clobber
  // the copied state — we clear+reset the timer on each click.
  const copyViewLink = async () => {
    const url =
      window.location.origin + window.location.pathname + encodeHash(session, true);
    const ok = await copyToClipboard(url);
    if (ok) {
      // Clear any in-flight revert timer before setting copied state
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
      setCopyState("copied");
      copyTimerRef.current = setTimeout(() => {
        setCopyState("idle");
        copyTimerRef.current = null;
      }, 1500);
    } else {
      window.prompt("Copy this snapshot link:", url);
    }
  };

  // G6: keyboard shortcuts — Space/→ = Next, ←/Backspace = Back
  useEffect(() => {
    if (readOnly) return;
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when focus is inside a form element
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        if (!live.ended) next();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, live.ended, session]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col p-4 pb-10">
      {/* G7: read-only snapshot banner */}
      {readOnly && (
        <p
          role="status"
          className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-center text-xs text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200"
        >
          You&apos;re viewing a snapshot — ask the host to re-share, or refresh, to see the latest.
        </p>
      )}

      {/* G2: Drift badge is the topmost, largest element in presenter view */}
      <section className="text-center">
        {/* G4: neutral until clock is live (now=0 = SSR/pre-hydration) */}
        <div className="mb-4">
          <DriftBadge driftMs={live.driftMs} big neutral={now === 0} />
        </div>

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
            {/* G2: countdown is secondary — smaller, below the drift badge */}
            <div
              data-testid="countdown"
              className={`mt-2 font-mono text-4xl font-bold tabular-nums ${
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
      </section>

      {!readOnly && (
        <section className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="w-1/3 rounded-2xl border-2 border-gray-300 py-4 text-xl font-bold dark:border-gray-700"
          >
            Back
          </button>
          {!live.ended ? (
            <button
              type="button"
              onClick={next}
              aria-label={live.current === items.length - 1 ? "Finish" : "Next"}
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

      {/* G6: keyboard shortcut hint */}
      {!readOnly && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Space = next · ← = back
        </p>
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

      {/* G1 + G7: persistent copy snapshot link — always visible to presenter, with inline confirmation */}
      {/* Visually-hidden aria-live node announces the copy confirmation to screen readers */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {copyState === "copied" ? "Link copied to clipboard" : ""}
      </span>

      {!readOnly && (
        <section className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={copyViewLink}
            data-testid="copy-link-btn"
            aria-label={copyState === "copied" ? "Copied!" : "Copy current link"}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-700"
          >
            {copyState === "copied" ? "✓ Copied!" : "Copy current link"}
          </button>
          {/* G7: snapshot framing */}
          <span className="text-xs text-gray-400">Shares a snapshot of right now.</span>
          <button type="button" onClick={exit} className="text-sm text-gray-500 underline">
            End &amp; edit agenda
          </button>
        </section>
      )}
    </main>
  );
}
