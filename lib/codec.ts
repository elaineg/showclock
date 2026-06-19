// URL-hash codec: session state <-> base64url(JSON). No backend, no storage.

export type Session = {
  /** raw agenda text */
  t: string;
  /** planned start "HH:MM" (24h) */
  s: string;
  /** actual start epoch-ms per item; one extra trailing entry = show ended */
  a: number[];
  /** random session id minted at Start (used for presenter-tab ownership) */
  id?: string;
  /**
   * Pre-roll: epoch-ms of the planned start time (when the show should begin).
   * Present only while the show is in the "STARTS IN …" countdown state
   * (a is still empty). Absent once the show has started or if start was immediate.
   */
  pr?: number;
};

export function encodeSession(s: Session): string {
  const json = JSON.stringify(s);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSession(payload: string): Session | null {
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json) as Session;
    if (typeof obj.t !== "string" || typeof obj.s !== "string" || !Array.isArray(obj.a)) {
      return null;
    }
    if (!obj.a.every((x) => typeof x === "number" && Number.isFinite(x))) return null;
    return obj;
  } catch {
    return null;
  }
}

/** Hash layout: "#<payload>" or "#<payload>.ro" for the read-only flag. */
export function encodeHash(session: Session, ro: boolean): string {
  return "#" + encodeSession(session) + (ro ? ".ro" : "");
}

export function decodeHash(hash: string): { session: Session; ro: boolean } | null {
  const h = hash.replace(/^#/, "");
  if (!h) return null;
  const ro = h.endsWith(".ro");
  const payload = ro ? h.slice(0, -3) : h;
  const session = decodeSession(payload);
  return session ? { session, ro } : null;
}
