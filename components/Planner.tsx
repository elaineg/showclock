"use client";

import {
  fmtClock,
  itemsOf,
  nextFiveMark,
  parseAgenda,
  plannedStarts,
  startMsFromHHMM,
} from "@/lib/agenda";
import type { Session } from "@/lib/codec";
import { claimOwnership, setSession } from "@/lib/store";

const PLACEHOLDER = `Welcome 5
Intro - 10 min
Demo - 20 min
15 Q&A
Wrap-up 5`;

/** Build a demo session that is currently ~6 min BEHIND so the payoff is obvious. */
function buildDemoSession(now: number): Session {
  const text = `Welcome 5\nMain talk - 20 min\nBreakout Q&A 15\nClosing remarks 5`;
  // Session "started" 12 min ago
  const sessionStart = now - 12 * 60_000;
  // HH:MM for that start time
  const d = new Date(sessionStart);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  // Welcome ran 7 min (2 min over its 5-min slot) → started main talk late
  const mainTalkActualStart = sessionStart + 7 * 60_000;
  return { t: text, s: hhmm, a: [sessionStart, mainTalkActualStart] };
}

export default function Planner({ session, now }: { session: Session | null; now: number }) {
  const text = session?.t ?? "";
  const start = session?.s || (now ? nextFiveMark(now) : "");
  const lines = parseAgenda(text);
  const items = itemsOf(lines);
  const startMs = start && now ? startMsFromHHMM(start, now) : null;
  const planned = startMs !== null ? plannedStarts(items, startMs) : [];
  const totalMin = items.reduce((s, it) => s + it.minutes, 0);
  const hasRundown = lines.length > 0;

  const update = (t: string, s: string) => setSession(t || s ? { t, s, a: [] } : null);

  const onStart = () => {
    if (items.length === 0 || !start) return;
    const id = Math.random().toString(36).slice(2, 10);
    claimOwnership(id);
    setSession({ t: text, s: start, a: [Date.now()], id }, true);
  };

  // G5: load a live-behind demo session directly into presenter view
  const onLiveDemo = () => {
    if (!now) return;
    const demo = buildDemoSession(now);
    const id = Math.random().toString(36).slice(2, 10);
    claimOwnership(id);
    setSession({ ...demo, id }, true);
  };

  // G1: copy link confirmation for the "copy link" on planner
  // (planner doesn't have a share button yet — this is here in case we add one)

  // map each parsed line to its item index (errors -> -1)
  const lineItemIdx: number[] = [];
  {
    let n = 0;
    for (const l of lines) lineItemIdx.push(l.kind === "item" ? n++ : -1);
  }

  return (
    <main className="mx-auto w-full max-w-xl p-4 pb-10">
      <header className="py-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Showclock</h1>
        <p className="mt-1 text-sm text-gray-500">
          Know exactly how far behind you are — and what time everything starts now.
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          Paste your agenda. We track the drift and reflow every clock time live.
        </p>
      </header>

      <label className="block text-sm font-semibold" htmlFor="agenda">
        Agenda — one item per line (&ldquo;Intro 10&rdquo;, &ldquo;Demo - 20 min&rdquo;, &ldquo;15 Q&amp;A&rdquo;)
      </label>
      <textarea
        id="agenda"
        value={text}
        onChange={(e) => update(e.target.value, start)}
        placeholder={PLACEHOLDER}
        rows={7}
        autoFocus
        className="mt-2 w-full rounded-xl border border-gray-300 bg-transparent p-3 font-mono text-base leading-7 outline-none focus:border-sky-500 dark:border-gray-700"
      />

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm font-semibold" htmlFor="start-time">
          Start time
        </label>
        <input
          id="start-time"
          type="time"
          value={start}
          onChange={(e) => update(text, e.target.value)}
          className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-lg font-semibold dark:border-gray-700"
        />
        {now > 0 && (
          <button
            type="button"
            onClick={() => update(text, nextFiveMark(now))}
            className="text-sm text-sky-600 underline"
          >
            next 5-min mark
          </button>
        )}
      </div>

      {hasRundown && (
        <section className="mt-6" aria-label="Parsed rundown">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Rundown · {items.length} item{items.length === 1 ? "" : "s"} · {totalMin} min total
          </h2>
          <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {lines.map((line, i) => {
              if (line.kind === "error") {
                return (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate text-gray-400 line-through">{line.raw.trim()}</span>
                    <span
                      role="alert"
                      className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    >
                      couldn&apos;t parse — try &ldquo;10&rdquo; or &ldquo;10 min&rdquo;
                    </span>
                  </li>
                );
              }
              const at = planned[lineItemIdx[i]];
              return (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate font-medium">{line.name}</span>
                  <span className="flex shrink-0 items-baseline gap-3">
                    <span className="text-sm text-gray-500">{line.minutes} min</span>
                    <span className="font-mono text-base font-semibold tabular-nums">
                      {at !== undefined ? fmtClock(at) : "—"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          {/* G8: bookmark hint once agenda parses */}
          <p className="mt-2 text-xs text-gray-400">
            Bookmark this page to reuse this agenda — it&apos;s saved in the link.
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={items.length === 0 || !start}
        className="mt-6 w-full rounded-2xl bg-emerald-600 py-4 text-2xl font-bold text-white disabled:opacity-40"
      >
        Start show
      </button>

      {/* G5: one-tap live demo */}
      <button
        type="button"
        onClick={onLiveDemo}
        disabled={!now}
        className="mt-3 w-full rounded-2xl border-2 border-sky-500 py-3 text-lg font-semibold text-sky-600 hover:bg-sky-50 disabled:opacity-40 dark:hover:bg-sky-950"
      >
        See a live example
      </button>
      <p className="mt-1 text-center text-xs text-gray-400">
        Loads a sample session already running behind — no setup needed.
      </p>

      <p className="mt-3 text-center text-xs text-gray-500">
        After Start, copy the URL to give a co-facilitator a snapshot view.
      </p>
    </main>
  );
}
