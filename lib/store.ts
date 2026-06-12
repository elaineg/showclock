"use client";

// Two tiny external stores consumed via useSyncExternalStore (hydration-safe,
// no set-state-in-effect): a shared 500ms clock, and the URL-hash session store.

import { useSyncExternalStore } from "react";
import { decodeHash, encodeHash, type Session } from "./codec";

// ---------------------------------------------------------------- clock store

let nowCache = 0;
const nowListeners = new Set<() => void>();
let nowTimer: ReturnType<typeof setInterval> | null = null;

function nowSubscribe(cb: () => void): () => void {
  nowListeners.add(cb);
  if (!nowTimer) {
    nowCache = Date.now();
    nowTimer = setInterval(() => {
      nowCache = Date.now();
      nowListeners.forEach((l) => l());
    }, 500);
  }
  return () => {
    nowListeners.delete(cb);
    if (nowListeners.size === 0 && nowTimer) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
  };
}

function getNow(): number {
  if (nowCache === 0) nowCache = Date.now();
  return nowCache;
}

/** Current epoch ms, ticking ~2x/s. Returns 0 during SSR/hydration. */
export function useNow(): number {
  return useSyncExternalStore(nowSubscribe, getNow, () => 0);
}

// -------------------------------------------------------------- session store

export type HashState = { session: Session | null; ro: boolean };

const EMPTY: HashState = { session: null, ro: false };
let cache: HashState = EMPTY;
let hashRead = false;
const sessionListeners = new Set<() => void>();
let hashListenerAttached = false;
let writePending: ReturnType<typeof setTimeout> | null = null;

function readHashIntoCache(): void {
  const decoded = decodeHash(window.location.hash);
  cache = decoded ?? EMPTY;
}

function emitSession(): void {
  sessionListeners.forEach((l) => l());
}

function sessionSubscribe(cb: () => void): () => void {
  sessionListeners.add(cb);
  if (!hashListenerAttached) {
    hashListenerAttached = true;
    window.addEventListener("hashchange", () => {
      readHashIntoCache();
      emitSession();
    });
  }
  return () => {
    sessionListeners.delete(cb);
  };
}

function getSessionSnapshot(): HashState {
  if (!hashRead && typeof window !== "undefined") {
    hashRead = true;
    readHashIntoCache();
  }
  return cache;
}

/** Session state decoded from the URL hash. Empty during SSR/hydration. */
export function useHashState(): HashState {
  return useSyncExternalStore(sessionSubscribe, getSessionSnapshot, () => EMPTY);
}

function flushHashWrite(): void {
  writePending = null;
  const url = cache.session
    ? window.location.pathname + window.location.search + encodeHash(cache.session, cache.ro)
    : window.location.pathname + window.location.search;
  history.replaceState(null, "", url);
}

/**
 * Update the session; serializes into the URL hash. `flush` writes the URL
 * synchronously (use for Start/Next/Back so a copied URL is always current);
 * otherwise writes are debounced to be gentle on history.replaceState while typing.
 */
export function setSession(session: Session | null, flush = false): void {
  hashRead = true;
  cache = session ? { session, ro: cache.ro } : EMPTY;
  emitSession();
  if (typeof window === "undefined") return;
  if (writePending) clearTimeout(writePending);
  if (flush) flushHashWrite();
  else writePending = setTimeout(flushHashWrite, 250);
}

// ------------------------------------------------------- presenter ownership

const OWNER_PREFIX = "showclock-owner-";

/** Mark this browser tab as the presenter for the given session id. */
export function claimOwnership(id: string): void {
  try {
    sessionStorage.setItem(OWNER_PREFIX + id, "1");
  } catch {
    // private mode quota etc. — degrade to read-only on reload
  }
}

/** True only in the tab that pressed Start (sessionStorage is per-tab). */
export function isOwner(session: Session): boolean {
  if (typeof window === "undefined" || !session.id) return false;
  try {
    return sessionStorage.getItem(OWNER_PREFIX + session.id) === "1";
  } catch {
    return false;
  }
}
