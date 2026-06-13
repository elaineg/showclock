import { expect, test, type Page } from "@playwright/test";
import { encodeHash, type Session } from "../../lib/codec";

// E2E suite for every success check in APP_SPEC.md, run against the deployed
// preview/prod URL (see playwright.config.ts). Locators use stable ids,
// aria-labels, and data-testids — never transient labels.

const AGENDA = "Intro 10\nDemo - 20 min\n15 Q&A";
const plannerRows = (page: Page) => page.locator("section[aria-label='Parsed rundown'] li");
const rundownRows = (page: Page) => page.locator("section[aria-label='Rundown'] li");
const driftBadge = (page: Page) => page.getByTestId("drift-badge");
const countdown = (page: Page) => page.getByTestId("countdown");

/** "9:30 AM" -> minutes since midnight. */
function clockToMin(s: string): number {
  const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) throw new Error(`unparseable clock "${s}"`);
  let h = parseInt(m[1], 10) % 12;
  if (m[3]?.toUpperCase() === "PM") h += 12;
  return h * 60 + parseInt(m[2], 10);
}

/** planned and projected minutes-since-midnight from a presenter rundown row. */
async function rowTimes(page: Page, i: number): Promise<{ planned: number; projected: number }> {
  const text = (await rundownRows(page).nth(i).textContent()) ?? "";
  const m = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*→\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
  if (!m) throw new Error(`no planned→projected times in row: "${text}"`);
  return { planned: clockToMin(m[1]), projected: clockToMin(m[2]) };
}

/** diff in minutes allowing for midnight wrap. */
function minDiff(a: number, b: number): number {
  let d = a - b;
  if (d > 720) d -= 1440;
  if (d < -720) d += 1440;
  return d;
}

/**
 * Current browser-clock "HH:MM" (24h). If we're within the last few seconds of
 * a minute, wait for the boundary so Start lands inside the same minute and
 * the drift badge deterministically reads "on time".
 */
async function currentMinuteSafe(page: Page): Promise<string> {
  return page.evaluate(async () => {
    let d = new Date();
    if (d.getSeconds() >= 54) {
      await new Promise((r) => setTimeout(r, (61 - d.getSeconds()) * 1000));
      d = new Date();
    }
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
}

async function fillPlan(page: Page, startHHMM?: string) {
  await page.goto("/");
  await page.locator("#agenda").fill(AGENDA);
  if (startHHMM) await page.locator("#start-time").fill(startHHMM);
}

/** Fill the plan with a "now" start and press Start. Returns the start HH:MM used. */
async function startShow(page: Page): Promise<string> {
  await fillPlan(page);
  const hhmm = await currentMinuteSafe(page);
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(countdown(page)).toBeVisible();
  return hhmm;
}

test("check 1: pasting three formats shows Intro/Demo/Q&A with 9:00, 9:10, 9:30", async ({ page }) => {
  await fillPlan(page, "09:00");
  const rows = plannerRows(page);
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("Intro");
  // H3 changed the duration chip format from "10 min" to "10m"
  await expect(rows.nth(0)).toContainText(/10\s*m/);
  await expect(rows.nth(0)).toContainText("9:00 AM");
  await expect(rows.nth(1)).toContainText("Demo");
  await expect(rows.nth(1)).toContainText(/20\s*m/);
  await expect(rows.nth(1)).toContainText("9:10 AM");
  await expect(rows.nth(2)).toContainText("Q&A");
  await expect(rows.nth(2)).toContainText(/15\s*m/);
  await expect(rows.nth(2)).toContainText("9:30 AM");
});

test("check 2: unparseable line is flagged inline; other rows keep their times", async ({ page }) => {
  await fillPlan(page, "09:00");
  await page.locator("#agenda").fill(AGENDA + "\njust some words");
  const rows = plannerRows(page);
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(3)).toContainText("just some words");
  await expect(rows.nth(3)).toContainText(/couldn.{0,2}t parse/);
  await expect(rows.nth(0)).toContainText("9:00 AM");
  await expect(rows.nth(2)).toContainText("9:30 AM");
});

test("check 3: changing start 9:00 -> 9:30 shifts every planned time by 30 min", async ({ page }) => {
  await fillPlan(page, "09:00");
  await expect(plannerRows(page).nth(0)).toContainText("9:00 AM");
  await page.locator("#start-time").fill("09:30");
  const rows = plannerRows(page);
  await expect(rows.nth(0)).toContainText("9:30 AM");
  await expect(rows.nth(1)).toContainText("9:40 AM");
  await expect(rows.nth(2)).toContainText("10:00 AM");
});

test("check 4: Start shows presenter with Intro, countdown ticking from 10:00, on time", async ({ page }) => {
  await startShow(page);
  await expect(page.getByRole("heading", { name: "Intro" })).toBeVisible();
  await expect(driftBadge(page)).toHaveText("on time");
  const first = (await countdown(page).textContent()) ?? "";
  expect(first).toMatch(/^(10:00|9:5\d)$/);
  // ticking down
  await page.waitForTimeout(2000);
  const second = (await countdown(page).textContent()) ?? "";
  expect(second).toMatch(/^9:\d\d$/);
  const toSec = (s: string) => parseInt(s.split(":")[0], 10) * 60 + parseInt(s.split(":")[1], 10);
  expect(toSec(second)).toBeLessThan(toSec(first));
});

test("check 5: Next right after Start reads ~9 min ahead and pulls projected times earlier", async ({ page }) => {
  await startShow(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Demo" })).toBeVisible();
  // spec allows 9 min ahead +/- 1
  await expect(driftBadge(page)).toHaveText(/^(8|9|10) min ahead$/);
  // remaining item (Q&A, row index 2) projected ~9 min earlier than planned
  const qa = await rowTimes(page, 2);
  const earlier = minDiff(qa.planned, qa.projected);
  expect(earlier).toBeGreaterThanOrEqual(8);
  expect(earlier).toBeLessThanOrEqual(10);
  // core flow 2: Back undoes the accidental Next
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "Intro" })).toBeVisible();
});

test("check 6: overrunning the item flips drift to behind, grows over time, pushes projections later", async ({ page }) => {
  // Construct a session whose Intro (10 min) started ~14.5 min ago via the URL
  // hash — state is entirely client-side, so this is a legitimate entry point.
  const now = Date.now();
  const a0 = Math.floor((now - (14 * 60 + 30) * 1000) / 60000) * 60000; // exact minute mark
  const d = new Date(a0);
  const hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  const session: Session = { t: AGENDA, s: hhmm, a: [a0] };
  await page.goto("/" + encodeHash(session, false));

  await expect(page.getByRole("heading", { name: "Intro" })).toBeVisible();
  await expect(driftBadge(page)).toHaveText(/^\d+ min behind$/);
  const n = parseInt((await driftBadge(page).textContent())!, 10);
  expect(n).toBeGreaterThanOrEqual(4);
  // countdown is in overtime ("+m:ss")
  expect((await countdown(page).textContent()) ?? "").toMatch(/^\+\d+:\d\d$/);
  // remaining items' projected times pushed later by the drift
  const demo = await rowTimes(page, 1);
  expect(minDiff(demo.projected, demo.planned)).toBe(n);
  // drift keeps growing live as time passes
  await expect(driftBadge(page)).toHaveText(`${n + 1} min behind`, { timeout: 70_000 });
  const demoLater = await rowTimes(page, 1);
  expect(minDiff(demoLater.projected, demoLater.planned)).toBe(n + 1);
});

test("check 7: presenter URL in a second tab is read-only with same item, drift, times", async ({ page, context }) => {
  await startShow(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Demo" })).toBeVisible();
  const url = page.url();
  expect(url).toContain("#");

  const tab2 = await context.newPage();
  await tab2.goto(url);
  await expect(tab2.getByRole("heading", { name: "Demo" })).toBeVisible();
  const drift1 = (await driftBadge(page).textContent()) ?? "";
  await expect(driftBadge(tab2)).toHaveText(drift1);
  const qa1 = await rowTimes(page, 2);
  const qa2 = await rowTimes(tab2, 2);
  expect(qa2).toEqual(qa1);
  // read-only: no Start/Next/Back controls in the second tab
  await expect(tab2.getByRole("button", { name: "Next" })).toHaveCount(0);
  await expect(tab2.getByRole("button", { name: "Back" })).toHaveCount(0);
  await expect(tab2.getByRole("button", { name: "Start show" })).toHaveCount(0);
  // ...but the presenter tab keeps its controls
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await tab2.close();
});

test("check 8: reloading the presenter restores item + drift from the URL alone (no API calls)", async ({ page }) => {
  await startShow(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Demo" })).toBeVisible();
  const driftBefore = (await driftBadge(page).textContent()) ?? "";

  const apiCalls: string[] = [];
  page.on("request", (req) => {
    if (["xhr", "fetch"].includes(req.resourceType())) apiCalls.push(req.url());
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Demo" })).toBeVisible();
  await expect(driftBadge(page)).toHaveText(driftBefore);
  // still the owner tab: controls survive the reload
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  // state came from the URL, not a backend
  expect(apiCalls, `unexpected API calls: ${apiCalls.join(", ")}`).toEqual([]);
});

test("Sam's path: paste agenda → Start → countdown ticks → copy button shows Copied! then reverts", async ({ page }) => {
  // Sam's exact path: paste own agenda, press Start, wait for countdown to tick
  // multiple times, THEN click copy — the button's own label must swap to "Copied!"
  // and must revert to "Copy current link" after ~1.5s.
  await fillPlan(page);
  const hhmm = await currentMinuteSafe(page);
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(countdown(page)).toBeVisible();

  // Wait ~2s so the 500ms clock ticks at least 4 times (replicates the live running session)
  await page.waitForTimeout(2200);

  // Grant clipboard permissions and mock so the copy actually succeeds in CI
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  const copyBtn = page.getByTestId("copy-link-btn");
  await expect(copyBtn).toBeVisible();

  // Confirm the button starts with its original label
  await expect(copyBtn).toHaveText("Copy current link");

  await copyBtn.click();

  // The clicked button's own text must change to "✓ Copied!" (Sam's exact complaint)
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });

  // Must revert to original label after ~1.5s (allow up to 3.5s total)
  await expect(copyBtn).toHaveText("Copy current link", { timeout: 3500 });
});
