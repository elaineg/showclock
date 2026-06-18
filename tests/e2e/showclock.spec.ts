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
  await expect(driftBadge(page)).toContainText("on time");
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
  await expect(driftBadge(page)).toContainText(/\d+ min ahead/);
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
  await expect(driftBadge(page)).toContainText(/\d+ min behind/);
  // parse the minute count from the badge text (which also contains "whole-show drift")
  const badgeText = (await driftBadge(page).textContent()) ?? "";
  const nMatch = badgeText.match(/(\d+) min behind/);
  const n = nMatch ? parseInt(nMatch[1], 10) : 0;
  expect(n).toBeGreaterThanOrEqual(4);
  // countdown is in overtime ("+m:ss")
  expect((await countdown(page).textContent()) ?? "").toMatch(/^\+\d+:\d\d$/);
  // header badge color must agree with its own words (behind → behind-amber or behind-red, never "item-overrun")
  const headerState = await driftBadge(page).getAttribute("data-header-cue-state");
  expect(["behind-amber", "behind-red"]).toContain(headerState);
  // remaining items' projected times pushed later by the drift
  const demo = await rowTimes(page, 1);
  expect(minDiff(demo.projected, demo.planned)).toBe(n);
  // drift keeps growing live as time passes
  await expect(driftBadge(page)).toContainText(`${n + 1} min behind`, { timeout: 70_000 });
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

// ===================================================================
// STAGE CUES — Success checks from APP_SPEC.md (new feature)
// Strategy: construct sessions with URL-hash encoding so timing is
// pre-positioned — avoids multi-minute real-time waits in CI.
// ===================================================================

/** Build a hash for a session whose current item (index 0) started
 *  `elapsedMs` ms ago (relative to now). Duration given in minutes.
 *  Uses UTC hours so session.s matches startMsFromHHMM (browser UTC timezone). */
function sessionHashAtElapsed(
  agendaText: string,
  itemMinutes: number,
  elapsedMs: number,
): string {
  const now = Date.now();
  const itemStartMs = now - elapsedMs;
  // Use UTC hours to match the browser timezoneId: "UTC" in playwright.config.ts
  const d = new Date(itemStartMs);
  const hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  const session: Session = {
    t: agendaText,
    s: hhmm,
    a: [itemStartMs],
    id: "verifier-test-" + elapsedMs,
  };
  return encodeHash(session, false);
}

/** Build a hash for a FINISHED session (all items ended). */
function sessionHashEnded(agendaText: string): string {
  const now = Date.now();
  const startMs = now - 60 * 60_000; // started 60 min ago
  const d = new Date(startMs);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  // 3 items: 10+20+15 = 45 min. End at now - 15 min so it's clearly done.
  const endMs = now - 15 * 60_000;
  const session: Session = {
    t: agendaText,
    s: hhmm,
    // actuals: item 0 start, item 1 start, item 2 start, show end
    a: [startMs, startMs + 10 * 60_000, startMs + 30 * 60_000, endMs],
    id: "verifier-test-ended",
  };
  return encodeHash(session, false);
}

// cue-state: success check — 10-min item is GREEN at start (ample time)
test("cue-state: 10-min item shows GREEN band early in the item", async ({ page }) => {
  // 10-min item started 30 seconds ago => 9m30s left => well above amberMs(120000=2min)
  const hash = sessionHashAtElapsed("GreenTest 10", 10, 30_000);
  await page.goto("/" + hash);
  const band = page.locator("[data-cue-state]");
  await expect(band).toBeVisible();
  await expect(band).toHaveAttribute("data-cue-state", "green");
});

// cue-state: success check — 10-min item is AMBER inside the final ~2:00
test("cue-state: 10-min item shows AMBER band inside the final 2 min", async ({ page }) => {
  // 10-min item started 8min30s ago => ~1m30s left => below amberMs(120000=2min)
  const hash = sessionHashAtElapsed("AmberTest 10", 10, 8 * 60_000 + 30_000);
  await page.goto("/" + hash);
  const band = page.locator("[data-cue-state]");
  await expect(band).toBeVisible();
  await expect(band).toHaveAttribute("data-cue-state", "amber");
});

// cue-state: success check — item overrunning shows RED band
test("cue-state: item past its duration shows RED band", async ({ page }) => {
  // 10-min item started 11 min ago => 1 min overrun => RED
  const hash = sessionHashAtElapsed("RedTest 10", 10, 11 * 60_000);
  await page.goto("/" + hash);
  const band = page.locator("[data-cue-state]");
  await expect(band).toBeVisible();
  await expect(band).toHaveAttribute("data-cue-state", "red");
});

// cue-state: success check — 1-min item is AMBER immediately at start
test("cue-state: 1-min item shows AMBER band from start (amber floor = 60s = full minute)", async ({ page }) => {
  // 1-min item started 2 seconds ago => 58s left => amberMs=max(60000,12000)=60000 => AMBER
  const hash = sessionHashAtElapsed("ShortTest 1", 1, 2_000);
  await page.goto("/" + hash);
  const band = page.locator("[data-cue-state]");
  await expect(band).toBeVisible();
  await expect(band).toHaveAttribute("data-cue-state", "amber");
});

// cue-state: success check — 1-min item overrunning shows RED
test("cue-state: 1-min item past its duration shows RED band", async ({ page }) => {
  // 1-min item started 90 seconds ago => 30s overrun => RED
  const hash = sessionHashAtElapsed("ShortRedTest 1", 1, 90_000);
  await page.goto("/" + hash);
  const band = page.locator("[data-cue-state]");
  await expect(band).toBeVisible();
  await expect(band).toHaveAttribute("data-cue-state", "red");
});

// cue-state: RED band has the cue-band-pulse CSS class (pulsing animation)
test("cue-state: RED band element has cue-band-pulse class for animation", async ({ page }) => {
  const hash = sessionHashAtElapsed("PulseTest 10", 10, 11 * 60_000);
  await page.goto("/" + hash);
  const band = page.locator("[data-cue-state='red']");
  await expect(band).toBeVisible();
  // The CSS class that drives the pulse animation must be present
  await expect(band).toHaveClass(/cue-band-pulse/);
});

// cue-state: ended session shows neutral band
test("cue-state: completed show shows neutral band", async ({ page }) => {
  const hash = sessionHashEnded(AGENDA);
  await page.goto("/" + hash);
  const band = page.locator("[data-cue-state]");
  await expect(band).toBeVisible();
  await expect(band).toHaveAttribute("data-cue-state", "neutral");
});

// sound toggle: success check — visible on cold load, default OFF label
test("sound toggle: visible on cold load labeled 'Sound: Off' (default OFF)", async ({ page }) => {
  // Start a fresh running session
  await startShow(page);
  // The sound toggle must be visible WITHOUT opening any menu
  const soundToggle = page.getByRole("button", { name: /Sound: Off/i });
  await expect(soundToggle).toBeVisible();
  // Confirm it reads "Sound: Off" (not "Sound: On")
  await expect(soundToggle).toContainText("Sound: Off");
});

// sound toggle: clicking flips label to "Sound: On"; no console error
test("sound toggle: click flips to 'Sound: On', no unhandled console error", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  await startShow(page);
  const soundToggle = page.getByRole("button", { name: /Sound/i });
  await soundToggle.click();
  // Label must flip to "Sound: On"
  await expect(soundToggle).toContainText("Sound: On");
  // No console errors from the toggle (audio blocked in headless is OK — the UI must not throw)
  const hardErrors = consoleErrors.filter(
    (e) => !e.includes("AudioContext") && !e.includes("autoplay") && !e.includes("NotAllowedError"),
  );
  expect(hardErrors, `Unexpected console errors: ${hardErrors.join(", ")}`).toHaveLength(0);
});

// sound toggle: localStorage persistence — clicking On, reload, still On
test("sound toggle: localStorage persists sound preference across reload", async ({ page }) => {
  await startShow(page);
  // Turn sound ON
  const soundToggle = page.getByRole("button", { name: /Sound/i });
  await soundToggle.click();
  await expect(soundToggle).toContainText("Sound: On");
  // Verify localStorage was set
  const stored = await page.evaluate(() => window.localStorage.getItem("showclock-sound-enabled"));
  expect(stored).toBe("true");
  // Reload — preference should survive
  await page.reload();
  await expect(page.getByRole("button", { name: /Sound: On/i })).toBeVisible();
  // Turn sound OFF, verify localStorage cleared to "false"
  await page.getByRole("button", { name: /Sound: On/i }).click();
  const storedOff = await page.evaluate(() => window.localStorage.getItem("showclock-sound-enabled"));
  expect(storedOff).toBe("false");
});

// sound toggle: returning-user path — pre-seeded localStorage shows Sound: On on cold load
test("sound toggle: returning user with sound enabled sees Sound: On on cold load", async ({ page }) => {
  // Seed the localStorage before navigation
  await page.goto("/");
  await page.evaluate(() => window.localStorage.setItem("showclock-sound-enabled", "true"));
  // Now navigate to a running session
  await startShow(page);
  // Sound must read ON because we loaded the preference from localStorage
  await expect(page.getByRole("button", { name: /Sound: On/i })).toBeVisible();
});

// read-only share URL: success check — same data-cue-state band, NO Start/Next/Back
test("read-only share URL: shows data-cue-state band but no host controls", async ({ page, context }) => {
  // Build a read-only hash for an overrunning session (=> RED band)
  const now = Date.now();
  const itemStartMs = now - 11 * 60_000; // 10-min item, 1 min overrun
  const d = new Date(itemStartMs);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const session: Session = {
    t: "ROTest 10\nDemo 20",
    s: hhmm,
    a: [itemStartMs],
    id: "ro-test",
  };
  const roHash = encodeHash(session, true); // read-only flag
  const tab2 = await context.newPage();
  await tab2.goto("/" + roHash);

  // Must show the cue band
  const band = tab2.locator("[data-cue-state]");
  await expect(band).toBeVisible();
  await expect(band).toHaveAttribute("data-cue-state", "red");

  // No presenter controls
  await expect(tab2.getByRole("button", { name: "Start show" })).toHaveCount(0);
  await expect(tab2.getByRole("button", { name: "Next" })).toHaveCount(0);
  await expect(tab2.getByRole("button", { name: "Back" })).toHaveCount(0);

  // But countdown (over time) should be visible
  await expect(tab2.getByTestId("countdown")).toBeVisible();
  await tab2.close();
});

// read-only share URL: viewer can still arm their own sound toggle
test("read-only share URL: viewer has their own sound toggle (not the host's)", async ({ page, context }) => {
  const session: Session = {
    t: "ROSound 10\nDemo 20",
    s: "09:00",
    a: [Date.now() - 30_000],
    id: "ro-sound-test",
  };
  const roHash = encodeHash(session, true);
  const tab2 = await context.newPage();
  await tab2.goto("/" + roHash);

  // The viewer's sound toggle must exist (spec: "each viewer arms their own")
  await expect(tab2.getByRole("button", { name: /Sound/i })).toBeVisible();
  await tab2.close();
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

// ROUND-2 FIX: badge color must agree with its OWN words (own-sign model).
// When item overruns AND show is behind, badge shows behind-amber/behind-red + "behind" text.
// When item overruns BUT show still has banked slack, badge stays ahead/on-time + matching text.
test("badge own-sign: color matches words — behind item overrun (no banked slack)", async ({ page }) => {
  // 10-min item started 11 min ago => 1 min overrun, no prior slack => show 1 min behind
  const hash = sessionHashAtElapsed("OverrunTest 10\nDemo 20", 10, 11 * 60_000);
  await page.goto("/" + hash);

  // Confirm item band IS red
  const band = page.locator("[data-cue-state]");
  await expect(band).toHaveAttribute("data-cue-state", "red");

  const badge = page.getByTestId("drift-badge");

  // Badge data-header-cue-state reflects OWN drift sign, not the item's
  const headerState = await badge.getAttribute("data-header-cue-state");
  expect(["behind-amber", "behind-red"]).toContain(headerState);

  // Badge WORDS must agree: contains "behind" (not "on time" or "ahead")
  await expect(badge).toContainText(/\d+ min behind/);

  // The "whole-show drift" sub-label must be visible (subordination)
  await expect(badge).toContainText("whole-show drift");
});

test("badge own-sign: item overruns but banked slack keeps badge ahead (color≠words prevention)", async ({ page }) => {
  // 2 items: FastItem 10, Overrun 20.
  // Press Next after only 30s on FastItem => ~9.5 min ahead of plan.
  // Now Overrun is 5 min in (5 of 20) — overrunning is impossible yet, but let's
  // set it at 21 min elapsed to overrun while banked slack keeps whole-show ahead.
  // FastItem took 30s (actual start t0, Next at t0+30s).
  // Overrun started at t0+30s, 21 min have passed since t0 so Overrun is at 20.5 min elapsed → RED.
  // driftMs = (now) - plannedEndCurrent = (t0+21min) - (t0+10min+20min) = t0+21min - t0+30min = -9min => AHEAD.
  const now = Date.now();
  const t0 = now - 21 * 60_000;
  const t1 = t0 + 30_000; // Next pressed at 30s
  const d = new Date(t0);
  const hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  const session: Session = { t: "FastItem 10\nOverrun 20", s: hhmm, a: [t0, t1], id: "banked-slack-test" };
  await page.goto("/" + encodeHash(session, false));

  // Item band must be RED (Overrun is past 20 min)
  const band = page.locator("[data-cue-state]");
  await expect(band).toHaveAttribute("data-cue-state", "red");

  const badge = page.getByTestId("drift-badge");

  // Whole-show drift = -9 min => badge must be ahead/on-time (NOT behind/red)
  const headerState = await badge.getAttribute("data-header-cue-state");
  expect(["on-time", "ahead"]).toContain(headerState);

  // Badge WORDS must say "ahead" or "on time" — never "behind"
  const badgeText = (await badge.textContent()) ?? "";
  expect(badgeText).toMatch(/ahead|on time/);
  expect(badgeText).not.toMatch(/behind/);

  // Sub-label still present
  await expect(badge).toContainText("whole-show drift");
});

test("badge own-sign: live overrun grows drift WITHOUT pressing Next", async ({ page }) => {
  // 10-min item started ~13 min ago (3 min overrun = 3 min behind at load).
  // Wait for drift to tick to 4 min behind WITHOUT pressing Next — verifies live update.
  // Use sessionHashAtElapsed which already uses UTC hours.
  const hash = sessionHashAtElapsed("GrowTest 10\nDemo 20", 10, 13 * 60_000);
  await page.goto("/" + hash);

  await expect(page.getByRole("heading", { name: "GrowTest" })).toBeVisible();
  // Initial drift is 3 min behind (item started 13 min ago, planned 10 min)
  await expect(driftBadge(page)).toContainText(/3 min behind/);
  // Badge state is behind (not on-time/ahead)
  const state0 = await driftBadge(page).getAttribute("data-header-cue-state");
  expect(["behind-amber", "behind-red"]).toContain(state0);
  // Without pressing Next, drift grows to 4 min behind within ~70s
  await expect(driftBadge(page)).toContainText(/4 min behind/, { timeout: 70_000 });
  // 4 min is still below the behind-red threshold (5 min), so badge is behind-amber
  await expect(driftBadge(page)).toHaveAttribute("data-header-cue-state", "behind-amber");
});
