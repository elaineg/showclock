/**
 * Robust clipboard copy helper.
 * 1. Tries navigator.clipboard.writeText (async Clipboard API).
 * 2. Falls back to a hidden textarea + document.execCommand('copy').
 * Returns true on success, false if both paths fail.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Primary: async Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand fallback
    }
  }

  // Fallback: hidden textarea + execCommand
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    ta.setAttribute("aria-hidden", "true");
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
