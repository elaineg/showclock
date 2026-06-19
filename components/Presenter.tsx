"use client";

import { useEffect, useRef, useState } from "react";
import {
  driftMinutes,
  driftLabel,
  fmtClock,
  fmtCountdown,
  fmtDuration,
  liveState,
  plannedStarts,
  startMsFromHHMM,
  type Item,
} from "@/lib/agenda";
import type { Session } from "@/lib/codec";
import { encodeHash } from "@/lib/codec";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { setSession, useNow } from "@/lib/store";
import { getCueState } from "@/lib/cueState";
import { useSound } from "@/lib/useSound";
import CueBand from "./CueBand";
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
  // FIX B: Two planned-start arrays:
  // 1. displayPlanned — anchored to session.s (the user's wall-clock planned start).
  //    Used for the planned-schedule column so the host's built schedule still shows.
  // 2. driftPlanned — anchored to a[0] (the actual moment Start was pressed).
  //    Used for drift calculation so drift = 0 at the moment Start is pressed,
  //    regardless of whether planned start is in the future or past.
  //    As items over/under-run, drift accrues naturally from actual vs planned durations.
  const startMs = startMsFromHHMM(session.s, session.a[0]);
  const displayPlanned = plannedStarts(items, startMs);
  // Drift baseline: anchor item-0's planned start to the actual start time.
  const driftPlanned = plannedStarts(items, session.a[0]);
  // Use Date.now() as fallback (not the last actual) so the drift is correct even on the
  // initial render before useNow() hydrates. This fixes Defect C: a pre-positioned
  // overrunning session showed "on time" on first paint because the last actual (item start)
  // was used as "now", making drift = 0 at that instant.
  const live = liveState(items, driftPlanned, session.a, now || Date.now());
  // Use displayPlanned for the visible rundown column (shows host's 14:30, 14:40 times).
  const planned = displayPlanned;
  // Shift projected times into the display domain: projected is computed relative to a[0]
  // (drift domain), but the display column must be in the session.s domain.
  // Offset = displayPlanned[0] - driftPlanned[0] = startMs - a[0].
  const displayOffset = startMs - session.a[0];
  const displayProjected = live.projected.map((t) => t + displayOffset);
  const displayProjectedEnd = live.projectedEnd + displayOffset;
  const cur = items[live.current];
  const overtime = !live.ended && live.countdownMs < 0;

  // Stage cue state — single pure function of timing data.
  const cueState = getCueState(live.countdownMs, cur?.minutes ?? 1, live.ended);

  // Sound — WebAudio beep on RED transition and 30s overrun reminder.
  const { soundOn, soundBlocked, toggleSound, notifyCueState } = useSound();

  // Unique key for current item (resets beep counters on Next/Back).
  const itemKey = `${live.current}-${session.a[0] ?? 0}`;

  // Notify sound hook every tick.
  useEffect(() => {
    notifyCueState({ cueState, countdownMs: live.countdownMs, itemKey });
  }, [cueState, live.countdownMs, itemKey, notifyCueState]);

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
    // FIX 4: Always show the "✓ Copied!" confirmation flip regardless of clipboard
    // permission, so the user has consistent visual feedback on all environments.
    // Fall back to prompt only when clipboard completely failed AND we haven't confirmed.
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
    if (!ok) {
      // Clipboard failed — show prompt as a fallback (user can copy manually)
      // but still show the visual confirmation so the button doesn't look broken
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
          You&apos;re viewing a live read-only view — it reflows projected times from the link. Ask the host for a new link to pick up any agenda edits.
        </p>
      )}

      {/* G2: Drift badge is the topmost, largest element in presenter view.
          C4: Sound toggle pill — always visible in presenter top bar (labeled, not in a menu). */}
      <section className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* G4: neutral until clock is live (now=0 = SSR/pre-hydration) */}
          {/* Defect C fix: neutral=false always — drift is computed from Date.now() fallback
              so the badge is correct even on the initial SSR render. Never suppresses a real
              overrun as "on time". drift=0 at exact Start moment is still "on time" correctly. */}
          <DriftBadge
            driftMs={live.driftMs}
            big
            neutral={false}
          />
        </div>

        {/* C4 sound toggle — visible on cold load, labeled pill, min 44px tap target */}
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundOn ? "Sound: On. Click to turn off." : "Sound: Off. Click to turn on."}
          aria-pressed={soundOn}
          className="mt-1 flex min-h-[44px] min-w-[110px] shrink-0 items-center justify-center rounded-full border-2 border-gray-300 px-3 py-1 text-sm font-semibold dark:border-gray-600"
        >
          {soundOn ? "🔔 Sound: On" : "🔔 Sound: Off"}
        </button>
      </section>

      {/* Sound blocked hint */}
      {soundBlocked && (
        <p role="alert" className="mt-1 text-right text-xs text-amber-600">
          Sound blocked by browser
        </p>
      )}

      <div className="mt-4">
        {live.ended ? (
          <div className="rounded-xl bg-gray-100 px-4 py-5 text-center dark:bg-gray-800" data-cue-state="neutral">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Show complete
            </p>
            <h2 className="mt-1 text-4xl font-extrabold">That&apos;s a wrap</h2>
            <p className="mt-2 text-gray-500">
              Finished at {fmtClock(session.a[items.length])} · planned{" "}
              {fmtClock(displayPlanned[items.length - 1] + items[items.length - 1].minutes * 60_000)}
            </p>
          </div>
        ) : (
          /* C2: full-width color band wraps the whole current-item block */
          <CueBand cueState={cueState}>
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
              Now · item {live.current + 1} of {items.length}
            </p>
            <h2 className="mt-1 break-words text-4xl font-extrabold leading-tight">
              {cur.name}
            </h2>
            {/* G2: countdown is secondary — smaller, below the drift badge */}
            <div
              data-testid="countdown"
              className="mt-2 font-mono text-4xl font-bold tabular-nums"
            >
              {now ? fmtCountdown(live.countdownMs) : "–:––"}
            </div>
            <p className="mt-1 text-sm opacity-80">
              {overtime ? "over the planned " : "of "}
              {fmtDuration(cur.minutes)}{overtime ? "" : " planned"}
            </p>
          </CueBand>
        )}
      </div>

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
        {/* Sub-minute live drift cue: shows when current item is actively overrunning so
            the projected column doesn't look frozen between whole-minute flips.
            driftMs updates every 500ms tick; driftLabel returns seconds-precision for
            sub-minute values ("Ns behind"), so this ticks visibly every ~1s. */}
        {!live.ended && overtime && now > 0 && (
          <p
            data-testid="projected-live-drift"
            aria-live="polite"
            className="mt-0.5 text-right text-xs tabular-nums text-amber-600 dark:text-amber-400"
          >
            {driftLabel(live.driftMs)} — projections tracking live
          </p>
        )}
        <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {items.map((it, i) => {
            const done = i < live.current || live.ended;
            const isCur = i === live.current && !live.ended;
            const isUpcoming = !done && !isCur && !live.ended;
            // Use display-domain projected for the column and for the shifted check.
            const shifted = driftMinutes(displayProjected[i] - planned[i]) !== 0;
            // Sub-minute live drift annotation for upcoming items during an overrun.
            // live.driftMs ticks every 500ms; floor to whole seconds for a stable display.
            // Only shown when sub-minute (driftMs < 60s) so it doesn't duplicate the
            // whole-minute projected time that already shifted.
            const subMinDriftSec = isUpcoming && overtime && now > 0
              ? Math.floor(live.driftMs / 1000)
              : 0;
            return (
              <li
                key={i}
                className={`flex items-center justify-between gap-3 px-3 py-2 ${
                  isCur ? "bg-emerald-50 dark:bg-emerald-950" : done ? "opacity-50" : ""
                }`}
              >
                <span className="min-w-0 truncate">
                  <span className={`font-medium ${done ? "line-through" : ""}`}>{it.name}</span>{" "}
                  <span className="text-sm text-gray-500">{fmtDuration(it.minutes)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0 font-mono text-sm tabular-nums">
                  <span className="flex items-baseline gap-2">
                    <span className="text-gray-500">{fmtClock(planned[i])}</span>
                    <span aria-hidden>→</span>
                    <span
                      className={`font-semibold ${
                        i <= live.current
                          ? ""
                          : shifted
                            ? displayProjected[i] < planned[i]
                              ? "text-sky-600"
                              : "text-amber-600"
                            : "text-gray-500"
                      }`}
                    >
                      {fmtClock(displayProjected[i])}
                    </span>
                  </span>
                  {/* Live sub-minute overrun annotation — ticks every ~1s so the projected
                      column never looks frozen. Hidden once drift crosses a whole minute
                      (the fmtClock already shifted at that point). */}
                  {subMinDriftSec > 0 && subMinDriftSec < 60 && (
                    <span
                      data-testid="projected-subminute"
                      className="text-xs text-amber-500 dark:text-amber-400"
                    >
                      +{subMinDriftSec}s
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-right font-mono text-sm text-gray-500">
          projected end {now ? fmtClock(displayProjectedEnd) : "—"}
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
          {/* G7: live read-only view framing */}
          <span className="text-xs text-gray-400">Shares a live read-only view.</span>
          <button type="button" onClick={exit} className="text-sm text-gray-500 underline">
            End &amp; edit agenda
          </button>
        </section>
      )}
    </main>
  );
}
