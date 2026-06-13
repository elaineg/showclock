/**
 * One-shot probe script for the copy-button timing and blocked-clipboard case.
 * Run: node tests/e2e/copy-timing-probe.mjs
 * Requires: @playwright/test installed, `npx playwright install chromium` done.
 */
import { chromium } from "@playwright/test";

const PREVIEW = "https://showclock-awtvc75a5-elainegao.vercel.app";
const AGENDA = "Intro 10\nDemo 20\nQ&A 15";

async function waitForMinuteBoundary(page) {
  return page.evaluate(async () => {
    let d = new Date();
    if (d.getSeconds() >= 54) {
      await new Promise((r) => setTimeout(r, (61 - d.getSeconds()) * 1000));
      d = new Date();
    }
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
}

async function startSession(page) {
  await page.goto(PREVIEW);
  await page.locator("#agenda").fill(AGENDA);
  const hhmm = await waitForMinuteBoundary(page);
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  // Confirm presenter view loaded
  await page.waitForSelector('[data-testid="countdown"]', { timeout: 10000 });
  // Wait ~2.2 seconds so countdown has ticked at least 4 times (500ms interval)
  await page.waitForTimeout(2200);
}

async function probe1_normalClipboard(browser) {
  console.log("\n=== PROBE 1: Normal clipboard path ===");
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await ctx.newPage();
  await startSession(page);

  const copyBtn = page.getByTestId("copy-link-btn");
  // Confirm initial text
  const initialText = await copyBtn.textContent();
  console.log(`Button text before click: "${initialText}"`);

  // Click and sample at +100ms, +800ms, +2000ms
  const clickTime = Date.now();
  await copyBtn.click();

  await page.waitForTimeout(100);
  const at100 = await copyBtn.textContent();
  console.log(`Button text at +100ms: "${at100}"`);

  await page.waitForTimeout(700); // total ~800ms
  const at800 = await copyBtn.textContent();
  console.log(`Button text at +800ms: "${at800}"`);

  await page.waitForTimeout(1200); // total ~2000ms
  const at2000 = await copyBtn.textContent();
  console.log(`Button text at +2000ms: "${at2000}"`);

  // Check aria-live element
  const ariaLive = page.locator('[aria-live="polite"]');
  const ariaText = await ariaLive.textContent().catch(() => null);
  console.log(`aria-live content at +2000ms: "${ariaText}"`);

  // Check if countdown still ticking (regression check)
  const countdown = await page.getByTestId("countdown").textContent();
  console.log(`Countdown still visible: "${countdown}"`);

  await ctx.close();
  return { at100, at800, at2000 };
}

async function probe2_blockedClipboard(browser) {
  console.log("\n=== PROBE 2: Blocked clipboard (execCommand fallback) ===");
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await ctx.newPage();
  await startSession(page);

  // Override navigator.clipboard.writeText to reject BEFORE clicking
  await page.addInitScript(() => {
    // Will run on next navigation — for current page use evaluate
  });
  // Override on current page
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.reject(new Error("NotAllowedError: blocked")),
      },
      configurable: true,
    });
  });

  const copyBtn = page.getByTestId("copy-link-btn");

  // Dismiss any prompt that may appear (prompt fallback for total failure)
  page.on("dialog", async (dialog) => {
    console.log(`Dialog appeared: "${dialog.message()}" — accepting`);
    await dialog.accept();
  });

  await copyBtn.click();
  await page.waitForTimeout(300);
  const textAfter = await copyBtn.textContent();
  console.log(`Button text after blocked-clipboard click (+300ms): "${textAfter}"`);

  // If execCommand fallback works, text should be "✓ Copied!"
  // If a prompt appeared instead, it means both paths failed
  await ctx.close();
  return { textAfter };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const r1 = await probe1_normalClipboard(browser);
    const r2 = await probe2_blockedClipboard(browser);

    console.log("\n=== SUMMARY ===");
    const pass1 =
      r1.at100 &&
      (r1.at100.includes("Copied") || r1.at100.includes("✓")) &&
      r1.at800 &&
      (r1.at800.includes("Copied") || r1.at800.includes("✓")) &&
      r1.at2000 === "Copy current link";
    const pass2 = r2.textAfter && (r2.textAfter.includes("Copied") || r2.textAfter.includes("✓"));

    console.log(`Probe 1 (normal clipboard): ${pass1 ? "PASS" : "FAIL"}`);
    console.log(`  +100ms: "${r1.at100}"`);
    console.log(`  +800ms: "${r1.at800}"`);
    console.log(`  +2000ms: "${r1.at2000}"`);
    console.log(`Probe 2 (blocked clipboard): ${pass2 ? "PASS" : "FAIL"}`);
    console.log(`  +300ms: "${r2.textAfter}"`);

    if (!pass1 || !pass2) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
})();
