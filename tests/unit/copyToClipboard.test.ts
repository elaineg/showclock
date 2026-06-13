import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We test the copy helper logic by mocking globals (navigator, document).
// No jsdom needed — we stub the APIs directly.

describe("copyToClipboard", () => {
  let execCommandSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.fn>;
  let removeChildSpy: ReturnType<typeof vi.fn>;
  let fakeTextarea: Record<string, unknown>;

  beforeEach(() => {
    execCommandSpy = vi.fn().mockReturnValue(true);
    appendChildSpy = vi.fn();
    removeChildSpy = vi.fn();

    fakeTextarea = {
      value: "",
      style: {},
      setAttribute: vi.fn(),
      focus: vi.fn(),
      select: vi.fn(),
    };

    // Stub document
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(fakeTextarea),
      body: {
        appendChild: appendChildSpy,
        removeChild: removeChildSpy,
      },
      execCommand: execCommandSpy,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function importHelper() {
    // Re-import fresh each time so navigator stub is captured
    const mod = await import("../../lib/copyToClipboard?t=" + Math.random());
    return mod.copyToClipboard;
  }

  it("uses navigator.clipboard.writeText when available and resolves", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const { copyToClipboard } = await import("../../lib/copyToClipboard");
    const result = await copyToClipboard("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result).toBe(true);
    expect(appendChildSpy).not.toHaveBeenCalled();
  });

  it("falls back to execCommand when navigator.clipboard.writeText rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("permission denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const { copyToClipboard } = await import("../../lib/copyToClipboard");
    const result = await copyToClipboard("hello fallback");
    expect(writeText).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith("copy");
    expect(result).toBe(true);
  });

  it("falls back to execCommand when navigator.clipboard is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    const { copyToClipboard } = await import("../../lib/copyToClipboard");
    const result = await copyToClipboard("no clipboard");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith("copy");
    expect(result).toBe(true);
  });

  it("returns false when both paths fail", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("blocked"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    execCommandSpy.mockReturnValue(false);

    const { copyToClipboard } = await import("../../lib/copyToClipboard");
    const result = await copyToClipboard("will fail");
    expect(result).toBe(false);
  });
});
