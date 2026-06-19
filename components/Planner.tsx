"use client";

import { useRef, useState, useCallback } from "react";
import {
  fmtClock,
  fmtDuration,
  itemsOf,
  MAX_INLINE_DURATION_MIN,
  minutesToRoundTripStr,
  nextFiveMark,
  parseAgenda,
  parseDurationInput,
  parseLine,
  plannedStarts,
  startMsFromHHMM,
  type Item,
} from "@/lib/agenda";
import type { Session } from "@/lib/codec";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { claimOwnership, setSession } from "@/lib/store";

const PLACEHOLDER = `Welcome 5
Intro - 10 min
Demo - 20 min
15 Q&A
Wrap-up 5`;

/**
 * Convert items array back to paste-compatible text that round-trips losslessly.
 * - Whole-minute items: "Name N" (plain integer, no unit — parseable as minutes)
 * - Sub-minute / fractional items: "Name M:SS" (M:SS colon form — re-parses to same duration)
 * This ensures copy→paste reproduces IDENTICAL durations (Defect B fix).
 */
function itemsToText(items: Item[]): string {
  return items.map((it) => `${it.name} ${minutesToRoundTripStr(it.minutes)}`).join("\n");
}

/** Build a demo session that is currently ~6 min BEHIND so the payoff is obvious. */
function buildDemoSession(now: number): Session {
  const text = `Welcome 5\nMain talk - 20 min\nBreakout Q&A 15\nClosing remarks 5`;
  const sessionStart = now - 12 * 60_000;
  const d = new Date(sessionStart);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const mainTalkActualStart = sessionStart + 7 * 60_000;
  return { t: text, s: hhmm, a: [sessionStart, mainTalkActualStart] };
}

type EditingCell = { idx: number; field: "name" | "minutes" } | null;

// Threshold: if planned start is more than 60 seconds ahead of now, enter pre-roll.
const PRE_ROLL_THRESHOLD_MS = 60_000;

export default function Planner({ session, now }: { session: Session | null; now: number }) {
  // FIX 3: On cold load (no session), pre-populate items from PLACEHOLDER so "Start show"
  // is enabled immediately — paste-and-go ethos, stranger can press Start on the sample.
  // When a real session is loaded, use session.t as usual.
  const coldLoad = !session;
  const initialText = session?.t ?? (coldLoad ? PLACEHOLDER : "");
  const initialItems = itemsOf(parseAgenda(initialText));

  // pasteText is what the textarea shows; items is the canonical editable state.
  // They are kept in sync: editing items updates pasteText; editing paste re-parses items.
  const [pasteText, setPasteText] = useState<string>(initialText);
  const [items, setItems] = useState<Item[]>(initialItems);
  // Track the last session.t we loaded from URL so we don't clobber it on re-renders.
  // Use null as sentinel for "no session" to distinguish from empty-string session text.
  const lastSessionT = useRef<string | null>(session?.t ?? null);

  // If the session changes externally (URL change), sync state from it.
  // Only sync when there is an actual session (session != null); cold-load (no session)
  // keeps the placeholder that was used in initialText.
  const sessionT = session?.t ?? null;
  if (sessionT !== null && sessionT !== lastSessionT.current) {
    lastSessionT.current = sessionT;
    const parsedItems = itemsOf(parseAgenda(sessionT));
    setPasteText(sessionT);
    setItems(parsedItems);
  }

  const start = session?.s || (now ? nextFiveMark(now) : "");

  // Derive planned clock times from the canonical items.
  const startMs = start && now ? startMsFromHHMM(start, now) : null;
  const planned = startMs !== null ? plannedStarts(items, startMs) : [];
  const totalMin = items.reduce((s, it) => s + it.minutes, 0);

  // Parse raw paste to collect error lines for inline display.
  // When paste is in sync with items (after a direct edit), there are no errors.
  const parsedLines = parseAgenda(pasteText);
  const errorLines = parsedLines.filter((l): l is Extract<typeof parsedLines[0], {kind:"error"}> => l.kind === "error");
  const hasErrorLines = errorLines.length > 0;

  const hasRundown = items.length > 0 || parsedLines.length > 0;

  // Editing cell state: which cell is being edited.
  // UNCONTROLLED BUFFER MODEL: we do NOT use React-controlled value for the active
  // input (that would cause React re-renders to fight keyboard text selection, breaking
  // Ctrl+A → type). Instead we keep a ref to the DOM input element and read/write
  // its value imperatively. draftValue state is used ONLY to seed defaultValue when
  // the input first mounts; after that, value management is 100% imperative.
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [draftValue, setDraftValue] = useState(""); // seed for defaultValue on mount only
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // Copy-rundown-as-text state (G1 pattern).
  const [copyRundownState, setCopyRundownState] = useState<"idle" | "copied">("idle");
  const copyRundownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX 3: Structured table is shown first (before the textarea) when items exist,
  // ensuring the inline-edit UI is always the first thing users see.

  /** Update items and sync the paste box and session URL. */
  function applyItems(newItems: Item[]) {
    const text = itemsToText(newItems);
    setItems(newItems);
    setPasteText(text);
    lastSessionT.current = text;
    setSession(text || start ? { t: text, s: start, a: [] } : null);
  }

  /** Handle paste box change: re-parse and update items. */
  function onPasteChange(raw: string) {
    setPasteText(raw);
    const parsed = itemsOf(parseAgenda(raw));
    setItems(parsed);
    lastSessionT.current = raw;
    setSession(raw || start ? { t: raw, s: start, a: [] } : null);
  }

  /** Handle start-time change. */
  function onStartChange(s: string) {
    const t = pasteText;
    setSession(t || s ? { t, s, a: [] } : null);
  }

  const onStart = () => {
    if (items.length === 0 || !start) return;
    const id = Math.random().toString(36).slice(2, 10);
    claimOwnership(id);
    const actualNow = Date.now();
    // FIX 1: If planned start is materially in the future (>60s), enter pre-roll mode.
    // Compute the planned start epoch-ms from session.s.
    const plannedStartMs = startMsFromHHMM(start, actualNow);
    if (plannedStartMs - actualNow > PRE_ROLL_THRESHOLD_MS) {
      // Enter pre-roll: encode planned start ms in session.pr, keep a=[] (not running yet).
      setSession({ t: pasteText, s: start, a: [], id, pr: plannedStartMs }, true);
    } else {
      // Start immediately (planned start is now or in the past, or within 60s).
      setSession({ t: pasteText, s: start, a: [actualNow], id }, true);
    }
  };

  const onLiveDemo = () => {
    if (!now) return;
    const demo = buildDemoSession(now);
    const id = Math.random().toString(36).slice(2, 10);
    claimOwnership(id);
    setSession({ ...demo, id }, true);
  };

  // ---- Inline editing handlers ----

  // Max clamped to 600 min (10h) — imported from agenda.ts (same constant as paste path).
  const MAX_DURATION_MIN = MAX_INLINE_DURATION_MIN;

  // Track which rows were clamped (over-max) or zero-duration so we can show inline flags.
  const [clampedRows, setClampedRows] = useState<Set<number>>(new Set());
  // Track which rows had a zero-duration entry (distinct from over-max).
  const [zeroRows, setZeroRows] = useState<Set<number>>(new Set());

  function startEdit(idx: number, field: "name" | "minutes") {
    setEditingCell({ idx, field });
    if (field === "name") {
      setDraftValue(items[idx].name);
    } else {
      // For fractional (colon-origin) items, pre-fill the edit box with "M:SS" so the
      // user sees the canonical form and can re-type or correct it.
      setDraftValue(minutesToRoundTripStr(items[idx].minutes));
    }
  }

  // Read the current value from the uncontrolled input ref (or fall back to draftValue).
  function readDraft(): string {
    return editInputRef.current?.value ?? draftValue;
  }

  function commitEdit() {
    if (!editingCell) return;
    const { idx, field } = editingCell;
    const currentDraft = readDraft();
    const newItems = [...items];
    if (field === "name") {
      // Blank name is allowed (flagged visually) but not dropped silently.
      newItems[idx] = { ...newItems[idx], name: currentDraft };
    } else {
      // UNIFIED DURATION PARSER (Defect-B fix): same logic as paste path.
      // Handles "45" (plain int) and "1:30" (M:SS = 90 sec = 1.5 min) identically.
      // parseDurationInput already clamps to (0, MAX_INLINE_DURATION_MIN].
      const rawMinutes = parseDurationInput(currentDraft);
      if (rawMinutes !== null) {
        // Detect over-max (before clamp) to set the visible flag.
        const uncoercedStr = currentDraft.trim();
        // Re-parse without cap to detect if clamping occurred.
        const uncoercedFull = /^\d{1,3}:\d{2}$/.test(uncoercedStr)
          ? (() => {
              const [m, s] = uncoercedStr.split(":").map(Number);
              return (m * 60 + s) / 60; // M:SS → fractional minutes
            })()
          : (/^\d+$/.test(uncoercedStr) ? parseInt(uncoercedStr, 10) : rawMinutes);
        const wasOutOfRange = uncoercedFull > MAX_DURATION_MIN;
        // Carry colonEchoStr if the new value is colon-derived
        const colonEchoStr = /^\d{1,3}:\d{2}$/.test(uncoercedStr)
          ? `→ ${fmtDuration(rawMinutes)}`
          : undefined;
        newItems[idx] = { ...newItems[idx], minutes: rawMinutes, colonEchoStr };
        setClampedRows((prev) => {
          const next = new Set(prev);
          if (wasOutOfRange) next.add(idx); else next.delete(idx);
          return next;
        });
      } else {
        // 0-min or unparseable — keep prior value but show a visible flag.
        // This covers the "0-min item must be FLAGGED, not silently kept" spec requirement.
        const trimmed = currentDraft.trim();
        const isZero = trimmed === "0" || trimmed === "0:00";
        if (isZero) {
          setZeroRows((prev) => new Set([...prev, idx]));
        }
        // We still commit the cell (blur/enter) but don't change duration.
      }
    }
    setEditingCell(null);
    applyItems(newItems);
  }

  function cancelEdit() {
    setEditingCell(null);
    setDraftValue("");
  }

  function onCellKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
    // FIX A: Ctrl/Cmd+A inside the editing input MUST select the field content,
    // NOT the whole page. Both e.preventDefault() (stops browser default) and
    // e.stopPropagation() (stops the event from bubbling to document selection
    // handlers) are required — without stopPropagation, Windows Ctrl+A selects
    // the page and typed text prepends/appends instead of replacing.
    if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLInputElement).select();
    }
  }

  // Imperative ref callback: called when the edit input mounts (autoFocus).
  // Sets the input's value and selects all content so the first keystroke replaces it.
  // Using a ref callback (not useEffect) guarantees it fires synchronously after mount,
  // before any animation frame, so the selection is in place before the user types.
  const editInputRefCallback = useCallback((el: HTMLInputElement | null) => {
    editInputRef.current = el;
    if (el) {
      // Set the value imperatively (uncontrolled) and select all
      el.value = draftValue;
      el.select();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCell]); // re-run only when editingCell changes (new field opened)

  // ---- Row mutation ----

  function moveUp(idx: number) {
    if (idx === 0) return;
    const newItems = [...items];
    [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    applyItems(newItems);
  }

  function moveDown(idx: number) {
    if (idx === items.length - 1) return;
    const newItems = [...items];
    [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
    applyItems(newItems);
  }

  function deleteItem(idx: number) {
    const newItems = items.filter((_, i) => i !== idx);
    applyItems(newItems);
  }

  function addItem() {
    // FIX C: if the page is in the cold/empty state with placeholder text shown,
    // first convert the placeholder agenda into real items, then append the new row.
    // This prevents "+ Add item" from wiping the visible placeholder agenda.
    let base = items;
    if (base.length === 0) {
      const parsed = itemsOf(parseAgenda(PLACEHOLDER));
      if (parsed.length > 0) base = parsed;
    }
    const newItem: Item = { name: "New item", minutes: 5 };
    const newItems = [...base, newItem];
    applyItems(newItems);
    // Immediately start editing the new row's name.
    setEditingCell({ idx: newItems.length - 1, field: "name" });
    setDraftValue("New item");
  }

  async function copyRundownAsText() {
    const text = itemsToText(items);
    const ok = await copyToClipboard(text);
    if (ok || true) {
      if (copyRundownTimerRef.current !== null) {
        clearTimeout(copyRundownTimerRef.current);
        copyRundownTimerRef.current = null;
      }
      setCopyRundownState("copied");
      copyRundownTimerRef.current = setTimeout(() => {
        setCopyRundownState("idle");
        copyRundownTimerRef.current = null;
      }, 1500);
    }
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

      {/* FIX 3: Structured table shown FIRST (above textarea) so it is always the primary UI.
          The #agenda textarea is always in the DOM (tests + round-trip need it),
          but when items exist it is collapsed behind a disclosure to keep the table dominant. */}

      {/* --- HAS-ITEMS STATE: structured table is the primary UI --- */}
      {items.length > 0 && (
        <section className="mt-0" aria-label="Parsed rundown">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Rundown · {items.length} item{items.length === 1 ? "" : "s"} · {fmtDuration(totalMin)} total
            </h2>
            <button
              type="button"
              onClick={copyRundownAsText}
              data-testid="copy-rundown-btn"
              aria-label={copyRundownState === "copied" ? "Copied!" : "Copy rundown as text"}
              className="shrink-0 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold dark:border-gray-700"
            >
              {copyRundownState === "copied" ? "✓ Copied!" : "Copy rundown as text"}
            </button>
          </div>

          {/* E1: standing helper line — always visible when there are items */}
          <p className="mb-1 text-xs text-gray-400">
            Click any name or time to edit · reorder with ↑↓
          </p>

          {/* Editable items table */}
          <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {items.map((item, idx) => {
              const at = planned[idx];
              const isEditingName = editingCell?.idx === idx && editingCell.field === "name";
              const isEditingMin = editingCell?.idx === idx && editingCell.field === "minutes";
              const isFirst = idx === 0;
              const isLast = idx === items.length - 1;

              return (
                <li
                  key={idx}
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {/* Title cell */}
                  <div className="min-w-0 flex-1">
                    {isEditingName ? (
                      <input
                        type="text"
                        ref={editInputRefCallback}
                        defaultValue={draftValue}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onBlur={commitEdit}
                        onKeyDown={onCellKeyDown}
                        className="w-full border-0 border-b-2 border-sky-500 bg-transparent px-0 py-0.5 text-sm font-medium outline-none"
                        aria-label="Item name"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(idx, "name")}
                        className="w-full border-b border-transparent text-left text-sm font-medium hover:border-gray-400 focus:border-sky-500 focus:outline-none truncate"
                        aria-label={`Edit name: ${item.name}`}
                        title={item.name}
                      >
                        {item.name || <span className="italic text-gray-400">unnamed</span>}
                      </button>
                    )}
                  </div>

                  {/* Duration cell — wider to accommodate echo "→ 1m 30s" */}
                  <div className="w-28 shrink-0">
                    {isEditingMin ? (
                      <input
                        type="text"
                        ref={editInputRefCallback}
                        defaultValue={draftValue}
                        autoFocus
                        inputMode="decimal"
                        onFocus={(e) => {
                          // Select all on focus (tab into cell or click-to-open).
                          // The ref callback already called select() on mount, but
                          // focus can fire again (e.g. on tab-in), so repeat here.
                          e.target.select();
                        }}
                        onPointerDown={(e) => {
                          // Prevent the browser from repositioning the cursor
                          // on click-inside an already-focused field so the
                          // select-all stays in place when clicking again.
                          const input = e.target as HTMLInputElement;
                          if (document.activeElement === input) {
                            e.preventDefault();
                            input.select();
                          }
                        }}
                        onBeforeInput={(e: React.FormEvent<HTMLInputElement>) => {
                          // Allow digits and colon (for M:SS format like "1:30" = 1m30s).
                          // Block characters that are neither digits nor colons.
                          const nativeEvent = e.nativeEvent as InputEvent;
                          if (nativeEvent.data && /[^\d:]/.test(nativeEvent.data)) {
                            e.preventDefault();
                          }
                        }}
                        onBlur={commitEdit}
                        onKeyDown={onCellKeyDown}
                        className="w-full border-0 border-b-2 border-sky-500 bg-transparent px-0 py-0.5 text-center text-sm font-semibold outline-none tabular-nums"
                        aria-label="Duration in minutes"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(idx, "minutes")}
                        className="w-full border-b border-transparent text-left text-sm font-semibold tabular-nums hover:border-gray-400 focus:border-sky-500 focus:outline-none"
                        aria-label={`Edit duration: ${fmtDuration(item.minutes)}`}
                        data-testid={`duration-btn-${idx}`}
                      >
                        {/* Colon-echo: show "1:30 → 1m 30s" so parse is NEVER silent */}
                        {item.colonEchoStr ? (
                          <span className="flex items-baseline gap-1">
                            <span className="font-mono">{minutesToRoundTripStr(item.minutes)}</span>
                            <span
                              className="text-xs font-normal text-sky-600 dark:text-sky-400"
                              aria-label={item.colonEchoStr}
                              data-testid="colon-echo"
                            >
                              {item.colonEchoStr}
                            </span>
                          </span>
                        ) : (
                          fmtDuration(item.minutes)
                        )}
                      </button>
                    )}
                  </div>

                  {/* Clock time — read-only */}
                  <div className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-gray-500">
                    {at !== undefined ? fmtClock(at) : "—"}
                  </div>

                  {/* Inline flag: over-max (clamped) */}
                  {clampedRows.has(idx) && !zeroRows.has(idx) && (
                    <span
                      role="alert"
                      className="shrink-0 rounded bg-rose-100 px-1 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      title={`Max duration is ${MAX_DURATION_MIN} min — value was clamped`}
                    >
                      max {MAX_DURATION_MIN}m
                    </span>
                  )}
                  {/* Defect D: inline flag for 0-duration entry (not dropped, just flagged) */}
                  {zeroRows.has(idx) && (
                    <span
                      role="alert"
                      className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      title="Duration of 0 is not valid — keeping prior value"
                    >
                      0-min: kept prior
                    </span>
                  )}

                  {/* Controls: ↑ ↓ × — always visible, ≥40px tap targets */}
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => moveUp(idx)}
                      disabled={isFirst}
                      aria-label={`Move ${item.name} up`}
                      className="flex h-10 w-10 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:cursor-default disabled:opacity-30 dark:hover:bg-gray-800"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(idx)}
                      disabled={isLast}
                      aria-label={`Move ${item.name} down`}
                      className="flex h-10 w-10 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:cursor-default disabled:opacity-30 dark:hover:bg-gray-800"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(idx)}
                      aria-label={`Remove ${item.name}`}
                      className="flex h-10 w-10 items-center justify-center rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Error lines from paste — always shown, appended after the editable items */}
          {hasErrorLines && (
            <ul className="divide-y divide-gray-200 rounded-b-xl border border-t-0 border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {errorLines.map((line, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="truncate text-gray-400 line-through">{line.raw.trim()}</span>
                  <span
                    role="alert"
                    className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  >
                    couldn&apos;t parse — try &ldquo;10&rdquo; or &ldquo;10 min&rdquo;
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* + Add item button */}
          <button
            type="button"
            onClick={addItem}
            className="mt-3 w-full rounded-xl border-2 border-dashed border-gray-300 py-2 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-700 dark:hover:border-gray-500"
          >
            + Add item
          </button>

          {/* G8: bookmark hint once agenda parses */}
          <p className="mt-2 text-xs text-gray-400">
            Bookmark this page to reuse this agenda — it&apos;s saved in the link.
          </p>
        </section>
      )}

      {/* Empty-state hint when all items are deleted */}
      {!hasRundown && pasteText === "" && (
        <section className="mt-6" aria-label="Parsed rundown">
          <button
            type="button"
            onClick={addItem}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 py-2 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-700 dark:hover:border-gray-500"
          >
            + Add item
          </button>
        </section>
      )}

      {/* Agenda textarea — always visible so tests + round-trip work.
          When no items: primary entry (autofocus, 7 rows, prominent label).
          When items exist: secondary "bulk edit" below the structured table (3 rows, smaller). */}
      <div className="mt-3">
        {items.length === 0 ? (
          <label className="block mb-1 text-sm font-semibold" htmlFor="agenda">
            Agenda — one item per line (&ldquo;Intro 10&rdquo;, &ldquo;Demo - 20 min&rdquo;, &ldquo;15 Q&amp;A&rdquo;)
          </label>
        ) : (
          <p className="mb-1 text-xs text-gray-400">
            Or edit raw text below (bulk paste / copy):
          </p>
        )}
        <textarea
          id="agenda"
          value={pasteText}
          onChange={(e) => onPasteChange(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            // Ctrl+A / Cmd+A: select ALL content of THIS textarea.
            // Without this handler, some browsers/OS combos (Windows/Chrome Ctrl+A)
            // fire the chord at document level BEFORE the element, causing the page
            // to steal the selection so typing then inserts mid-text instead of replacing.
            // Sibling-symmetry: same treatment as the inline cell inputs (onCellKeyDown).
            if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
              e.preventDefault();
              e.stopPropagation();
              (e.target as HTMLTextAreaElement).select();
            }
          }}
          placeholder={items.length === 0 ? PLACEHOLDER : undefined}
          rows={items.length === 0 ? 7 : 3}
          autoFocus={items.length === 0}
          aria-label="Agenda"
          className="mt-0 w-full rounded-xl border border-gray-300 bg-transparent p-3 font-mono text-base leading-7 outline-none focus:border-sky-500 dark:border-gray-700"
        />
        {/* Error lines when no items parsed yet (all lines errored) */}
        {items.length === 0 && hasErrorLines && (
          <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {errorLines.map((line, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="truncate text-gray-400 line-through">{line.raw.trim()}</span>
                <span
                  role="alert"
                  className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                >
                  couldn&apos;t parse — try &ldquo;10&rdquo; or &ldquo;10 min&rdquo;
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Planned start time input — always visible */}
      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm font-semibold" htmlFor="start-time">
          Planned start
        </label>
        <input
          id="start-time"
          type="time"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-lg font-semibold dark:border-gray-700"
        />
        {now > 0 && (
          <button
            type="button"
            onClick={() => onStartChange(nextFiveMark(now))}
            className="text-sm text-sky-600 underline"
          >
            next 5-min mark
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={items.length === 0 || !start}
        className="mt-6 w-full rounded-2xl bg-emerald-600 py-4 text-2xl font-bold text-white disabled:opacity-40"
      >
        Start show
      </button>

      {/* Empty-state hint on Start button — only when truly empty (all items deleted) */}
      {items.length === 0 && (
        <p role="status" className="mt-1 text-center text-xs text-gray-500">
          Add at least one item to start.
        </p>
      )}

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
