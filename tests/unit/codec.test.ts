import { describe, expect, it } from "vitest";
import { decodeHash, decodeSession, encodeHash, encodeSession, type Session } from "../../lib/codec";

const session: Session = {
  t: "Intro 10\nDemo - 20 min\n15 Q&A",
  s: "09:00",
  a: [1765500000000, 1765500030000],
  id: "abc12345",
};

describe("codec", () => {
  it("round-trips a session through base64url", () => {
    expect(decodeSession(encodeSession(session))).toEqual(session);
  });

  it("encodes/decodes the hash with and without the read-only flag", () => {
    const rw = decodeHash(encodeHash(session, false));
    expect(rw).toEqual({ session, ro: false });
    const ro = decodeHash(encodeHash(session, true));
    expect(ro).toEqual({ session, ro: true });
    expect(encodeHash(session, true).endsWith(".ro")).toBe(true);
  });

  it("survives unicode agenda text (Q&A, dashes, emoji)", () => {
    const s: Session = { ...session, t: "Démo — 10\n🎤 MC bit 5" };
    expect(decodeSession(encodeSession(s))).toEqual(s);
  });

  it("rejects garbage and malformed payloads", () => {
    expect(decodeHash("#not-base64!!!")).toBeNull();
    expect(decodeHash("#")).toBeNull();
    expect(decodeSession(btoa(JSON.stringify({ t: 1, s: 2, a: "x" })))).toBeNull();
    expect(decodeSession(btoa(JSON.stringify({ t: "x", s: "y", a: [NaN] })))).toBeNull();
  });
});
