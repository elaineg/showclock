"use client";

// WebAudio sound hook for stage cues.
// - Default OFF; preference persisted in localStorage (NOT in the URL).
// - AudioContext created/resumed on the first user gesture (toggle click).
// - Fires at most 2 beeps per item: once at RED transition, once at ~30s overrun.
// - useSound is SSR-safe: never reads window/localStorage in render.

import { useCallback, useEffect, useRef, useState } from "react";

const LS_KEY = "showclock-sound-enabled";

/** Play a two-tone beep (440→660 Hz, ~250ms total) on the given AudioContext. */
function playBeep(ctx: AudioContext, volume = 0.35): void {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  gain.connect(ctx.destination);

  // Tone 1: 440 Hz for 120ms
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(440, now);
  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + 0.12);

  // Tone 2: 660 Hz for 130ms (starts at 120ms)
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(660, now + 0.12);
  osc2.connect(gain);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.25);
}

/** Tiny confirmation blip (220 Hz, 80ms) played when the user turns sound on. */
function playBlip(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, now);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.08);
}

export type UseSoundReturn = {
  soundOn: boolean;
  soundBlocked: boolean;
  toggleSound: () => void;
  /** Call from the timing loop; fires at most 2 beeps per item. */
  notifyCueState: (args: {
    cueState: "green" | "amber" | "red" | "neutral";
    countdownMs: number;
    /** Unique key for the current item (e.g. index + session start). Resets per-item beep counters. */
    itemKey: string;
  }) => void;
};

export function useSound(): UseSoundReturn {
  // SSR-safe: init false; real value loaded in useEffect.
  const [soundOn, setSoundOn] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  // Per-item beep tracking: { key, redFired, reminderFired }
  const beepRef = useRef<{ key: string; redFired: boolean; reminderFired: boolean }>({
    key: "",
    redFired: false,
    reminderFired: false,
  });

  // Load preference from localStorage after mount (SSR-safe).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored === "true") setSoundOn(true);
    } catch {
      // private mode / blocked — degrade silently
    }
  }, []);

  const getOrCreateCtx = useCallback(async (): Promise<AudioContext | null> => {
    try {
      if (!ctxRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        ctxRef.current = new AC();
      }
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const toggleSound = useCallback(async () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundBlocked(false);
    try {
      window.localStorage.setItem(LS_KEY, String(next));
    } catch {
      // ignore
    }
    if (next) {
      // The toggle click IS the user gesture — create/resume and play a blip.
      const ctx = await getOrCreateCtx();
      if (ctx) {
        playBlip(ctx);
      } else {
        setSoundBlocked(true);
        setSoundOn(false);
        try { window.localStorage.setItem(LS_KEY, "false"); } catch { /* ignore */ }
      }
    }
  }, [soundOn, getOrCreateCtx]);

  const notifyCueState = useCallback(
    ({
      cueState,
      countdownMs,
      itemKey,
    }: {
      cueState: "green" | "amber" | "red" | "neutral";
      countdownMs: number;
      itemKey: string;
    }) => {
      if (!soundOn) return;

      // Reset per-item beep state when item changes.
      if (beepRef.current.key !== itemKey) {
        beepRef.current = { key: itemKey, redFired: false, reminderFired: false };
      }

      if (cueState !== "red") return;

      const ctx = ctxRef.current;
      if (!ctx || ctx.state !== "running") return;

      // Beep 1: at RED transition (countdownMs just crossed 0).
      if (!beepRef.current.redFired) {
        beepRef.current.redFired = true;
        playBeep(ctx);
        return;
      }

      // Beep 2: ~30s into overrun (countdownMs <= -29_000, i.e. 29s overrun as a safe threshold).
      if (!beepRef.current.reminderFired && countdownMs <= -29_000) {
        beepRef.current.reminderFired = true;
        playBeep(ctx);
      }
    },
    [soundOn],
  );

  return { soundOn, soundBlocked, toggleSound, notifyCueState };
}
