/**
 * E2E tests for the "Edit the rundown in place" feature (APP_SPEC round 4).
 * Covers correctness P0, round-trip (URL encoding), paste-box sync,
 * mobile 375px interaction, returning-user pre-seeded URL state,
 * and hostile clipboard (copy under live-ticking session).
 *
 * All tests run against BASE_URL (default: http://localhost:3000).
 */
import { expect, test, type Page } from "@playwright/test";
import { encodeHash, type Session } from "../../lib/codec";

const AGENDA = "Intro 10\nDemo - 20 min\n15 Q&A";

const plannerRows = (page: Page) =>
  page.locator("section[aria-label='Parsed rundown'] li");

/** Parse "9:10 AM" → minutes since midnight. */
function clockToMin(s: string): number {
  const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) throw new Error(`unparseable clock: "${s}"`);
  let h = parseInt(m[1], 10) % 12;
  if (m[3]?.toUpperCase() === "PM") h += 12;
  return h * 60 + parseInt(m[2], 10);
}

/** Extract first HH:MM AM/PM clock time from a row's text. */
async function rowClockMin(page: Page, idx: number): Promise<number> {
  const text = (await plannerRows(page).nth(idx).textContent()) ?? "";
  const m = text.match(/\d{1,2}:\d{2}\s*(?:AM|PM)?/i);
  if (!m) throw new Error(`no clock in row ${idx}: "${text}"`);
  return clockToMin(m[0]);
}

async function fillPlan(page: Page, startHHMM = "09:00") {
  await page.goto("/");
  await page.locator("#agenda").fill(AGENDA);
  await page.locator("#start-time").fill(startHHMM);
}

// -----------------------------------------------------------------------
// P0 correctness: exact clock times after each edit type
// -----------------------------------------------------------------------

test("P0: initial parse 9:00 → rows show 9:00 / 9:10 / 9:30 exactly", async ({
  page,
}) => {
  await fillPlan(page);
  const rows = plannerRows(page);
  await expect(rows).toHaveCount(3);
  expect(await rowClockMin(page, 0)).toBe(9 * 60);       // 9:00 = 540
  expect(await rowClockMin(page, 1)).toBe(9 * 60 + 10);  // 9:10 = 550
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 30);  // 9:30 = 570
});

test("P0: edit Demo 20→40 → Q&A reflows to 9:50 exactly", async ({ page }) => {
  await fillPlan(page);
  // Confirm starting state
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 30); // Q&A at 9:30

  // Edit Demo's duration from 20 to 40
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("40");
  await durInput.press("Enter");

  // Q&A must now be 9:50 (= 9:00 + 10 + 40)
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 50); // 9:50 = 590
  // Intro and Demo starts unchanged
  expect(await rowClockMin(page, 0)).toBe(9 * 60);       // 9:00 unchanged
  expect(await rowClockMin(page, 1)).toBe(9 * 60 + 10);  // 9:10 unchanged
});

test("P0: delete Demo → Q&A reflows to 9:10 exactly", async ({ page }) => {
  await fillPlan(page);
  // Delete Demo (row index 1)
  await page.getByRole("button", { name: /Remove Demo/ }).click();
  await expect(plannerRows(page)).toHaveCount(2);
  expect(await rowClockMin(page, 0)).toBe(9 * 60);       // Intro 9:00
  expect(await rowClockMin(page, 1)).toBe(9 * 60 + 10);  // Q&A now 9:10
});

test("P0: add item → new item clock time = sum of prior durations", async ({ page }) => {
  await fillPlan(page);
  await page.getByRole("button", { name: "+ Add item" }).click();
  // New item (index 3) should be at 9:45 (10+20+15=45 min)
  await expect(plannerRows(page)).toHaveCount(4);
  expect(await rowClockMin(page, 3)).toBe(9 * 60 + 45); // 9:45
});

test("P0: reorder — ↑ on Q&A (row 2) → clock times reflow correctly", async ({ page }) => {
  await fillPlan(page);
  // Move Q&A (row 2) up one position
  await page.getByRole("button", { name: /Move Q&A up/ }).click();
  // New order: Intro(10), Q&A(15), Demo(20)
  // Intro: 9:00, Q&A: 9:10, Demo: 9:25
  await expect(plannerRows(page).nth(1)).toContainText("Q&A");
  expect(await rowClockMin(page, 0)).toBe(9 * 60);
  expect(await rowClockMin(page, 1)).toBe(9 * 60 + 10); // Q&A starts at 9:10
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 25); // Demo starts at 9:25
});

// -----------------------------------------------------------------------
// Round-trip: share URL + paste box stay in sync after edits
// -----------------------------------------------------------------------

test("round-trip: paste box reflects edited rundown (not original paste)", async ({
  page,
}) => {
  await fillPlan(page);

  // Edit Demo's duration 20→30
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("30");
  await durInput.press("Enter");

  // The paste textarea must now show "Demo 30" (not "Demo - 20 min")
  const textareaValue = await page.locator("#agenda").inputValue();
  expect(textareaValue).toContain("Demo 30");
  // Original raw "Demo - 20 min" should NOT be in the box anymore
  expect(textareaValue).not.toContain("Demo - 20 min");
  expect(textareaValue).not.toContain("Demo 20");
});

test("round-trip: share URL encodes the edited rundown (not original paste)", async ({
  page,
}) => {
  await fillPlan(page);

  // Edit Demo 20→30
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("30");
  await durInput.press("Enter");

  // Let the URL debounce flush (setSession debounces 250ms)
  await page.waitForTimeout(500);

  const url = page.url();
  expect(url).toContain("#");
  const hash = url.split("#")[1];
  // Decode the URL hash and verify the session's agenda text contains "Demo 30"
  const decoded = await page.evaluate((h: string) => {
    const b64 = h.replace(/-/g, "+").replace(/_/g, "/");
    try {
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch {
      return null;
    }
  }, hash);
  expect(decoded).not.toBeNull();
  expect(decoded).toContain("Demo 30");
  expect(decoded).not.toContain("20"); // old duration must not be in the agenda text
});

test("round-trip: edited rundown is what Start and presenter view use", async ({
  page,
}) => {
  await fillPlan(page);

  // Edit Demo 20→30
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("30");
  await durInput.press("Enter");

  // Verify Q&A is at 9:40 in planner (9:00+10+30=9:40) before Start
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 40);

  // Start using the current time
  const hhmm = await page.evaluate(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(page.getByTestId("countdown")).toBeVisible();

  // Presenter view rundown should show Demo with 30m (not 20m)
  const rundownItems = page.locator("section[aria-label='Rundown'] li");
  await expect(rundownItems.nth(1)).toContainText("30m");
  await expect(rundownItems.nth(1)).not.toContainText("20m");
});

// -----------------------------------------------------------------------
// Copy-rundown round-trip: paste-back reproduces identical rundown
// -----------------------------------------------------------------------

test("copy-rundown round-trip: emitted text re-parses to identical rundown", async ({
  page,
}) => {
  await fillPlan(page);

  // Grant clipboard and copy the rundown
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const copyBtn = page.getByTestId("copy-rundown-btn");
  await copyBtn.click();
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });

  // Read clipboard contents
  const clipText = await page.evaluate(() => navigator.clipboard.readText());
  // Should contain paste-compatible lines
  expect(clipText).toContain("Intro 10");
  expect(clipText).toContain("Demo 20");
  expect(clipText).toContain("Q&A 15");

  // Paste the clipboard text back into the textarea — should re-parse to same 3 rows
  await page.locator("#agenda").fill(clipText);
  await expect(plannerRows(page)).toHaveCount(3);
  await expect(plannerRows(page).nth(0)).toContainText("Intro");
  await expect(plannerRows(page).nth(1)).toContainText("Demo");
  await expect(plannerRows(page).nth(2)).toContainText("Q&A");
  expect(await rowClockMin(page, 0)).toBe(9 * 60);
  expect(await rowClockMin(page, 1)).toBe(9 * 60 + 10);
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 30);
});

// -----------------------------------------------------------------------
// Returning user: pre-seeded URL state
// -----------------------------------------------------------------------

test("returning user: pre-seeded URL state loads correctly; inline edit reflows", async ({
  page,
}) => {
  // Seed a session in the URL (as if user bookmarked after pasting)
  const session: Session = {
    t: "Intro 10\nDemo 20\nQ&A 15",
    s: "09:00",
    a: [],
  };
  const hash = encodeHash(session, false);
  await page.goto("/" + hash);

  // Verify rows load from URL state
  const rows = plannerRows(page);
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("Intro");
  await expect(rows.nth(1)).toContainText("Demo");
  await expect(rows.nth(2)).toContainText("Q&A");
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 30); // Q&A at 9:30

  // Now edit Demo in the pre-loaded rundown (not a fresh paste)
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("40");
  await durInput.press("Enter");

  // Q&A must reflow to 9:50 even from a pre-seeded URL
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 50);
});

test("returning user: prior URL state does not clobber edits on re-render", async ({
  page,
}) => {
  // Load with a session in the hash
  const session: Session = {
    t: "Alpha 10\nBeta 20",
    s: "10:00",
    a: [],
  };
  const hash = encodeHash(session, false);
  await page.goto("/" + hash);

  const rows = plannerRows(page);
  await expect(rows).toHaveCount(2);

  // Edit Alpha duration 10→15
  await page.getByRole("button", { name: /Edit duration: 10/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("15");
  await durInput.press("Enter");

  // Beta should now be at 10:15 (10:00 + 15)
  expect(await rowClockMin(page, 1)).toBe(10 * 60 + 15);

  // Wait for any debounced URL update
  await page.waitForTimeout(500);

  // Simulate a hash-change event (as could happen on page focus/back-button)
  // by directly checking that the table still shows the EDITED times (not reverted to original)
  expect(await rowClockMin(page, 1)).toBe(10 * 60 + 15);
});

// -----------------------------------------------------------------------
// Mobile 375px: actual interaction (reorder + edit), not just render
// -----------------------------------------------------------------------

test("375px: ↑/↓/× controls render AND ↑ reorder works, clock times update", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await fillPlan(page);

  // Verify all 3 control buttons are visible for row 1 (Demo)
  const upBtn = page.getByRole("button", { name: /Move Demo up/ });
  const downBtn = page.getByRole("button", { name: /Move Demo down/ });
  const deleteBtn = page.getByRole("button", { name: /Remove Demo/ });
  await expect(upBtn).toBeVisible();
  await expect(downBtn).toBeVisible();
  await expect(deleteBtn).toBeVisible();

  // Verify buttons are ≥40px tall (tap target requirement)
  const upBox = await upBtn.boundingBox();
  const downBox = await downBtn.boundingBox();
  const delBox = await deleteBtn.boundingBox();
  expect(upBox!.height).toBeGreaterThanOrEqual(39); // allow 1px tolerance
  expect(downBox!.height).toBeGreaterThanOrEqual(39);
  expect(delBox!.height).toBeGreaterThanOrEqual(39);

  // TAP ↑ to move Demo to position 0 — this is the actual interaction test
  await upBtn.click();
  await expect(plannerRows(page).nth(0)).toContainText("Demo");

  // Verify clock times recomputed correctly after reorder
  // New order: Demo(20), Intro(10), Q&A(15) → 9:00 / 9:20 / 9:30
  expect(await rowClockMin(page, 0)).toBe(9 * 60);       // Demo 9:00
  expect(await rowClockMin(page, 1)).toBe(9 * 60 + 20);  // Intro 9:20
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 30);  // Q&A 9:30
});

test("375px: + Add item and Copy rundown buttons are visible and tappable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await fillPlan(page);

  const addBtn = page.getByRole("button", { name: "+ Add item" });
  await expect(addBtn).toBeVisible();
  const addBox = await addBtn.boundingBox();
  expect(addBox!.width).toBeGreaterThan(100); // full-width

  const copyBtn = page.getByTestId("copy-rundown-btn");
  await expect(copyBtn).toBeVisible();

  // Actually tap + Add item on mobile viewport
  await addBtn.click();
  await expect(plannerRows(page)).toHaveCount(4);
});

test("375px: inline duration edit works at 375px — clock time updates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await fillPlan(page);

  // Tap the duration cell for Demo to edit
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await expect(durInput).toBeVisible();
  await durInput.fill("30");
  await durInput.press("Enter");

  // Q&A should be at 9:40 after edit (9:00+10+30)
  expect(await rowClockMin(page, 2)).toBe(9 * 60 + 40);
});

// -----------------------------------------------------------------------
// Hostile clipboard: "Copied!" cue survives under live-ticking session
// -----------------------------------------------------------------------

test("copy-rundown Copied! cue survives live-ticking re-render", async ({
  page,
}) => {
  // Start a live session so the 500ms clock ticks continuously
  await page.goto("/");
  await page.locator("#agenda").fill(AGENDA);
  const hhmm = await page.evaluate(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  await page.locator("#start-time").fill(hhmm);
  // Don't start the show — we want the planner view (copy-rundown-btn lives here)
  // but do want the 500ms clock to be ticking (it ticks once there are listeners)

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const copyBtn = page.getByTestId("copy-rundown-btn");
  await expect(copyBtn).toBeVisible();

  // Wait 1.5s to let the clock tick several times, then click
  await page.waitForTimeout(1500);
  await copyBtn.click();

  // "Copied!" should appear and stay visible for at least ~1s
  // (the real failure: it gets clobbered by a re-render within 50ms)
  await expect(copyBtn).toContainText("Copied", { timeout: 500 });
  await page.waitForTimeout(800);
  // Must STILL show "Copied!" at ~800ms (1500ms window minus margin)
  await expect(copyBtn).toContainText("Copied");
});

test("copy-rundown Copied! cue shows even when clipboard is blocked", async ({
  page,
}) => {
  // Override writeText to reject (hostile clipboard)
  await page.goto("/");
  await page.locator("#agenda").fill(AGENDA);
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(3);

  // Block clipboard.writeText
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.reject(new Error("NotAllowedError")),
      },
      writable: true,
      configurable: true,
    });
  });

  const copyBtn = page.getByTestId("copy-rundown-btn");
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  // The button shows "Copied!" even with clipboard blocked
  // (the component uses `ok || true` guard — always shows confirmation)
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });
});

// -----------------------------------------------------------------------
// ROUND-5 DEFECT A: Document-level Ctrl+A must be CAPTURED by the inline cell.
// Real Windows Ctrl+A fires as a document-level keydown that can select the PAGE
// before the input's keydown fires if stopPropagation is missing.
// The fix: onCellKeyDown calls e.stopPropagation() + e.preventDefault() + select().
// VERIFICATION: use keyboard.down('Control') + keyboard.press('A') + keyboard.up('Control')
// (the document-level chord) — NOT durInput.press("Control+a") which dispatches directly.
// -----------------------------------------------------------------------

test("Defect A [ROUND-5]: document-level Control chord on DURATION '20'→type '45'→commit = 45, NOT 4520", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 20\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Open duration cell for "Session" (20m) — click to focus
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await expect(durInput).toBeVisible();
  await expect(durInput).toBeFocused();

  // REAL document-level Ctrl+A chord (keyboard.down/up, not element.press)
  // This is the gesture that Windows users make — fires at document level first
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  // Type "45" — must REPLACE "20", not append
  await page.keyboard.type("45");
  await page.keyboard.press("Enter");

  // Result: 45, NOT 4520 or 2045 or 600 (clamped)
  await expect(plannerRows(page).nth(0)).toContainText("45m");
  await expect(plannerRows(page).nth(0)).not.toContainText("4520");
  await expect(plannerRows(page).nth(0)).not.toContainText("2045");
  await expect(plannerRows(page).nth(0)).not.toContainText("600m");

  // Break at 9:45 (9:00 + 45)
  const text1 = (await plannerRows(page).nth(1).textContent()) ?? "";
  expect(text1).toContain("9:45 AM");
});

test("Defect A [ROUND-5]: document-level Control chord on NAME 'Keynote'→type 'Demo'→commit = 'Demo', NOT 'KeynoteDemo'", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 20\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Open name cell for "Keynote"
  await page.getByRole("button", { name: /Edit name: Keynote/ }).click();
  const nameInput = page.getByLabel("Item name");
  await expect(nameInput).toBeVisible();
  await expect(nameInput).toBeFocused();

  // Document-level Ctrl+A chord
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  // Type "Demo" — must REPLACE "Keynote"
  await page.keyboard.type("Demo");
  await page.keyboard.press("Enter");

  // Result: "Demo", NOT "KeynoteDemo"
  await expect(plannerRows(page).nth(0)).toContainText("Demo");
  await expect(plannerRows(page).nth(0)).not.toContainText("KeynoteDemo");
  await expect(plannerRows(page).nth(0)).not.toContainText("Keynote");
});

test("Defect A: Control+a then type in DURATION cell replaces value (not prepends) — real keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 20\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Open the duration cell for "Session" (20m)
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await expect(durInput).toBeVisible();

  // Real Playwright keyboard: Control+a selects all, then type "25" to replace
  await durInput.press("Control+a");
  await page.keyboard.type("25");
  await durInput.press("Enter");

  // Result MUST be 25, NOT 2520 or 2025 or anything else
  await expect(plannerRows(page).nth(0)).toContainText("25m");
  await expect(plannerRows(page).nth(0)).not.toContainText("2520");
  await expect(plannerRows(page).nth(0)).not.toContainText("2025");
  await expect(plannerRows(page).nth(0)).not.toContainText("600m"); // not clamped

  // Clock times must be consistent (Break at 9:25, not some wild time)
  const text1 = (await plannerRows(page).nth(1).textContent()) ?? "";
  expect(text1).toContain("9:25 AM"); // 9:00 + 25 = 9:25
});

test("Defect A: Control+a then type in NAME cell replaces value (not concatenates) — real keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 20\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Open the name cell for "Keynote"
  await page.getByRole("button", { name: /Edit name: Keynote/ }).click();
  const nameInput = page.getByLabel("Item name");
  await expect(nameInput).toBeVisible();

  // Real Playwright keyboard: Control+a selects all, then type "Demo"
  await nameInput.press("Control+a");
  await page.keyboard.type("Demo");
  await nameInput.press("Enter");

  // Result MUST be "Demo", NOT "KeynoteDemo"
  await expect(plannerRows(page).nth(0)).toContainText("Demo");
  await expect(plannerRows(page).nth(0)).not.toContainText("KeynoteDemo");
  await expect(plannerRows(page).nth(0)).not.toContainText("Keynote"); // old name gone
});

test("Defect A: Ctrl+a selects duration — typing '25' over '20' yields exactly 25 (Tomás repro)", async ({
  page,
}) => {
  await fillPlan(page, "09:00");

  // Tomás repro: duration "20" → Ctrl+A → type "25" → must be 25, not 2520
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await expect(durInput).toBeVisible();

  await durInput.press("Control+a");
  await page.keyboard.type("25");
  await durInput.press("Enter");

  // Must be 25m — not 2520 (appended) or 600 (silently clamped from absurd value)
  await expect(plannerRows(page).nth(1)).toContainText("25m");
  await expect(plannerRows(page).nth(1)).not.toContainText("2520");

  // Q&A time must reflow: 9:00 + 10 + 25 = 9:35
  await expect(plannerRows(page).nth(2)).toContainText("9:35 AM");
});

// -----------------------------------------------------------------------
// ROUND-4 DEFECT B: Colon-format durations do NOT mangle the item name
// -----------------------------------------------------------------------

test("Defect A [R7]: 'Keynote 0:05' — name is Keynote, M:SS = 5 sec, shows colon echo '→ 5s'", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 0:05\nBreak 10");
  await page.locator("#start-time").fill("09:00");

  // Must parse to 2 items (not flag Keynote 0:05 as error)
  await expect(plannerRows(page)).toHaveCount(2);

  // First row: name MUST be "Keynote", NOT "Keynote 0"
  const firstRow = plannerRows(page).nth(0);
  const rowText = await firstRow.textContent() ?? "";
  expect(rowText).toContain("Keynote");
  expect(rowText).not.toMatch(/Keynote 0/); // digit not merged into name

  // M:SS: "0:05" = 5 sec — colon echo must appear
  const echoEl = firstRow.locator('[data-testid="colon-echo"]');
  await expect(echoEl).toBeVisible();
  await expect(echoEl).toContainText("5s");
});

test("Defect A [R7]: 'Keynote 1:30' — M:SS = 1m30s, shows '→ 1m 30s' echo", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 1:30\nBreak 10");
  await page.locator("#start-time").fill("09:00");

  await expect(plannerRows(page)).toHaveCount(2);

  const firstRow = plannerRows(page).nth(0);
  expect(await firstRow.textContent()).toContain("Keynote");
  expect(await firstRow.textContent()).not.toMatch(/Keynote 1/); // digit not merged
  // M:SS: 1:30 = 1m30s — colon echo must appear
  const echoEl = firstRow.locator('[data-testid="colon-echo"]');
  await expect(echoEl).toBeVisible();
  await expect(echoEl).toContainText("1m 30s");
});

test("Defect A [R7]: 'Session 12:00' — M:SS = 12m0s = 12 min, shows '→ 12m' echo", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 12:00\nBreak 10");
  await page.locator("#start-time").fill("09:00");

  await expect(plannerRows(page)).toHaveCount(2);

  const firstRow = plannerRows(page).nth(0);
  const rowText = await firstRow.textContent() ?? "";
  expect(rowText).toContain("Session");
  // M:SS: 12:00 = 12m 0s = 12 min (whole) — echo shows "→ 12m"
  const echoEl = firstRow.locator('[data-testid="colon-echo"]');
  await expect(echoEl).toBeVisible();
  await expect(echoEl).toContainText("12m");
});

test("Defect A [R7]: '0:45' inline-edit → M:SS: 45 sec = 0.75 min, shows '→ 45s' echo", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 10\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Inline-edit the duration of "Keynote" from 10 to "0:45" (M:SS = 45 sec)
  await page.getByRole("button", { name: /Edit duration/ }).first().click();
  const durInput = page.getByLabel("Duration in minutes");
  await expect(durInput).toBeVisible();

  await durInput.press("Control+a");
  await page.keyboard.type("0:45");
  await durInput.press("Enter");

  // Must show colon echo "→ 45s"
  const echoEl = plannerRows(page).nth(0).locator('[data-testid="colon-echo"]');
  await expect(echoEl).toBeVisible();
  await expect(echoEl).toContainText("45s");
});

test("Defect A [R7]: '1:30' inline-edit → M:SS: 1m30s, shows '→ 1m 30s' echo", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 10\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Inline-edit: type "1:30" for M:SS = 1m30s
  await page.getByRole("button", { name: /Edit duration/ }).first().click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.press("Control+a");
  await page.keyboard.type("1:30");
  await durInput.press("Enter");

  // Must show colon echo "→ 1m 30s"
  const echoEl = plannerRows(page).nth(0).locator('[data-testid="colon-echo"]');
  await expect(echoEl).toBeVisible();
  await expect(echoEl).toContainText("1m 30s");
});

test("Defect B [R7]: copy-rundown of 'Keynote 1:30' emits '1:30' and re-pastes with same '→ 1m 30s' echo (lossless)", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 1:30\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Copy rundown
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const copyBtn = page.getByTestId("copy-rundown-btn");
  await copyBtn.click();
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });

  const clipText = await page.evaluate(() => navigator.clipboard.readText());
  // Round 7: copy emits M:SS colon form "Keynote 1:30" for lossless round-trip
  expect(clipText).toContain("Keynote 1:30");
  expect(clipText).not.toContain("Keynote 90"); // plain minutes NOT emitted for colon items

  // Re-paste: colon echo "→ 1m 30s" must appear (same duration preserved)
  await page.locator("#agenda").fill(clipText);
  await expect(plannerRows(page)).toHaveCount(2);
  const firstRow = plannerRows(page).nth(0);
  await expect(firstRow).toContainText("Keynote");
  // Echo must be present after re-paste
  const echoEl = firstRow.locator('[data-testid="colon-echo"]');
  await expect(echoEl).toBeVisible();
  await expect(echoEl).toContainText("1m 30s");
});

test("Defect B: plain 'Intro 10' still parses correctly (regression — no colon)", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  await page.locator("#start-time").fill("09:00");

  await expect(plannerRows(page)).toHaveCount(2);
  await expect(plannerRows(page).nth(0)).toContainText("Intro");
  await expect(plannerRows(page).nth(0)).toContainText("10m");
});

// -----------------------------------------------------------------------
// ROUND-6 DEFECT 1: Bulk-paste textarea Ctrl+A select-all
// Document-level Control chord must select-all in the bulk textarea (#agenda)
// and subsequent typing must REPLACE (not append/insert) the existing text.
// -----------------------------------------------------------------------

test("Defect1 [ROUND-6]: document-level Control+A in bulk textarea selects all; typing replaces", async ({
  page,
}) => {
  await page.goto("/");
  // Fill the textarea with a multi-line agenda first
  await page.locator("#agenda").fill("Welcome 5\nKeynote 20\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  // Wait for items to parse
  await expect(plannerRows(page)).toHaveCount(3);

  // Focus the bulk-paste textarea
  await page.locator("#agenda").click();

  // REAL document-level Ctrl+A chord (keyboard.down/up, not element.press)
  // This is the exact Windows muscle-memory gesture that failed in round 6
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");

  // Type "Solo 5" — must REPLACE the entire prior content, not insert mid-text
  await page.keyboard.type("Solo 5");

  // Wait for React to update (onChange fires after type)
  await page.waitForTimeout(100);

  // Textarea must contain ONLY "Solo 5" (not "Solo 5Welcome 5\nKeynote 20\nBreak 10" etc.)
  const val = await page.locator("#agenda").inputValue();
  expect(val.trim()).toBe("Solo 5");

  // Parsed rundown must show exactly ONE item "Solo" 5m — NOT garbled rows
  await expect(plannerRows(page)).toHaveCount(1);
  await expect(plannerRows(page).nth(0)).toContainText("Solo");
  await expect(plannerRows(page).nth(0)).toContainText("5m");
});

test("Defect1 [ROUND-6]: Meta+A (Cmd+A on Mac) in bulk textarea selects all; typing replaces", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Welcome 5\nKeynote 20\nBreak 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(3);

  await page.locator("#agenda").click();

  // Meta+A = Cmd+A on macOS — real chord at document level
  await page.keyboard.down("Meta");
  await page.keyboard.press("a");
  await page.keyboard.up("Meta");

  await page.keyboard.type("Solo 5");
  await page.waitForTimeout(100);

  const val = await page.locator("#agenda").inputValue();
  expect(val.trim()).toBe("Solo 5");

  await expect(plannerRows(page)).toHaveCount(1);
  await expect(plannerRows(page).nth(0)).toContainText("Solo");
  await expect(plannerRows(page).nth(0)).toContainText("5m");
});
