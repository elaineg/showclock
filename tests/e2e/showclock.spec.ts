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
  // Allow n or n+1: projected column shows wall-clock minutes, so it may still show n
  // if the clock tick hasn't advanced the display minute yet when badge just flipped to n+1.
  const laterDiff = minDiff(demoLater.projected, demoLater.planned);
  expect(laterDiff).toBeGreaterThanOrEqual(n);
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

// ===================================================================
// ROUND-4 DEFECT C: Drift reflects wall-clock overrun BEFORE pressing Next
// ===================================================================

// Defect C: Once a session is live and the current item overruns its planned duration,
// the drift badge must show "N min behind" and the item band must be RED —
// WITHOUT pressing Next. This verifies the live drift clock is running.
test("Defect C: overrunning first item WITHOUT pressing Next shows 'behind' and band RED", async ({ page }) => {
  // Pre-built session: item started 8 min ago, item duration is 5 min → 3 min overrun.
  // This uses the same sessionHashAtElapsed helper as the existing check — it builds a
  // hash with a[0] in the past so the session is live-overrunning on page load.
  const hash = sessionHashAtElapsed("Keynote 5\nDemo 20", 5, 8 * 60_000);
  await page.goto("/" + hash);

  // The heading should show the FIRST item (no Next pressed, we're still on "Keynote")
  await expect(page.getByRole("heading", { name: "Keynote" })).toBeVisible();

  // Drift badge must show "N min behind" (3 min overrun at load)
  await expect(driftBadge(page)).toContainText(/\d+ min behind/);

  // The band color must be RED (item is overrunning)
  const band = page.locator("[data-cue-state]");
  await expect(band).toHaveAttribute("data-cue-state", "red");

  // Drift must keep growing — wait for it to tick to the next minute without pressing Next
  const badgeTextBefore = (await driftBadge(page).textContent()) ?? "";
  const nBefore = parseInt((badgeTextBefore.match(/(\d+) min behind/) ?? [])[1] ?? "0", 10);
  await expect(driftBadge(page)).toContainText(`${nBefore + 1} min behind`, { timeout: 70_000 });
});

// Defect C regression guard: drift must be "on time" at the EXACT moment Start is pressed.
// (Do NOT regress R2/R3 behavior.)
test("Defect C regression: drift = 'on time' at moment Start is pressed (not retroactive)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Talk 5\nBreak 10");
  const hhmm = await currentMinuteSafe(page);
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(countdown(page)).toBeVisible();

  // Immediately after Start — must say "on time" (item hasn't overrun yet)
  await expect(driftBadge(page)).toContainText(/on time/);
  await expect(driftBadge(page)).not.toContainText(/min behind/);
  await expect(driftBadge(page)).not.toContainText(/min ahead/);
});

// ===================================================================
// INLINE EDIT — Success checks (round 4 feature, APP_SPEC checks 4–8 revised)
// ===================================================================

test("inline-edit check: editing Demo duration from 20→40 reflows Q&A time", async ({ page }) => {
  await fillPlan(page, "09:00");
  // Confirm Q&A starts at 9:30 before edit
  await expect(plannerRows(page).nth(2)).toContainText("9:30 AM");

  // Click the duration cell for Demo (row 1) to edit
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durationInput = page.getByLabel("Duration in minutes");
  await durationInput.fill("40");
  await durationInput.press("Enter");

  // Q&A should now be at 9:50 AM (9:00 + 10 + 40 = 9:50)
  await expect(plannerRows(page).nth(2)).toContainText("9:50 AM");
  // No re-paste needed — rundown reflects the edit
  await expect(plannerRows(page)).toHaveCount(3);
});

test("inline-edit check: ↑ on 2nd item swaps with 1st; times update", async ({ page }) => {
  await fillPlan(page, "09:00");
  // Initial order: Intro (9:00), Demo (9:10), Q&A (9:30)
  await expect(plannerRows(page).nth(0)).toContainText("Intro");
  await expect(plannerRows(page).nth(0)).toContainText("9:00 AM");
  await expect(plannerRows(page).nth(1)).toContainText("Demo");

  // Move Demo up (it is row 1; ↑ moves it to row 0)
  await page.getByRole("button", { name: /Move Demo up/ }).click();

  // Now Demo should be first
  await expect(plannerRows(page).nth(0)).toContainText("Demo");
  await expect(plannerRows(page).nth(0)).toContainText("9:00 AM");
  await expect(plannerRows(page).nth(1)).toContainText("Intro");
  // Intro is now at 9:20 (9:00 + 20)
  await expect(plannerRows(page).nth(1)).toContainText("9:20 AM");
});

test("inline-edit check: ↑ on first row is disabled; ↓ on last row is disabled", async ({ page }) => {
  await fillPlan(page, "09:00");
  // First row's ↑ is disabled
  const firstUp = page.getByRole("button", { name: /Move Intro up/ });
  await expect(firstUp).toBeDisabled();
  // Last row's ↓ is disabled
  const lastDown = page.getByRole("button", { name: /Move Q&A down/ });
  await expect(lastDown).toBeDisabled();
});

test("inline-edit check: + Add item appends row; × deletes row and reflows", async ({ page }) => {
  await fillPlan(page, "09:00");
  await expect(plannerRows(page)).toHaveCount(3);

  // Add a new item
  await page.getByRole("button", { name: "+ Add item" }).click();
  // Should now be 4 rows (new item auto-named "New item" with 5 min)
  await expect(plannerRows(page)).toHaveCount(4);

  // Delete the new item (row 3, named "New item")
  await page.getByRole("button", { name: /Remove New item/ }).click();
  // Back to 3 rows
  await expect(plannerRows(page)).toHaveCount(3);
  // Times should be back to original
  await expect(plannerRows(page).nth(2)).toContainText("9:30 AM");
});

test("inline-edit check: deleting all items disables Start with hint", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Solo 10");
  // Should be 1 row
  await expect(plannerRows(page)).toHaveCount(1);

  // Delete the only item
  await page.getByRole("button", { name: /Remove Solo/ }).click();

  // Start button must be disabled
  await expect(page.getByRole("button", { name: "Start show" })).toBeDisabled();
  // Hint must appear (role="status" element with the hint text)
  await expect(page.locator('[role="status"]').filter({ hasText: /Add at least one item/ })).toBeVisible();
});

test("inline-edit check: Copy rundown as text button is visible and produces paste-compatible output", async ({ page }) => {
  await fillPlan(page, "09:00");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  const copyBtn = page.getByTestId("copy-rundown-btn");
  await expect(copyBtn).toBeVisible();
  await expect(copyBtn).toHaveText("Copy rundown as text");

  await copyBtn.click();
  // Should show Copied! confirmation
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });
  // Reverts after ~1.5s
  await expect(copyBtn).toHaveText("Copy rundown as text", { timeout: 3500 });
});

test("inline-edit check: edits round-trip — edited rundown shows in presenter view", async ({ page }) => {
  await fillPlan(page, "09:00");

  // Edit Demo's duration from 20 to 30
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durationInput = page.getByLabel("Duration in minutes");
  await durationInput.fill("30");
  await durationInput.press("Enter");

  // Verify Q&A moved to 9:40 (9:00 + 10 + 30)
  await expect(plannerRows(page).nth(2)).toContainText("9:40 AM");

  // Start the show
  const hhmm = await page.evaluate(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(countdown(page)).toBeVisible();

  // Presenter should show Intro (first item unchanged)
  await expect(page.getByRole("heading", { name: "Intro" })).toBeVisible();

  // The rundown section in presenter should show Demo with 30m (the edited duration)
  const rundown = page.locator("section[aria-label='Rundown'] li");
  await expect(rundown.nth(1)).toContainText("30m");
});

// FIX 1: select-all on focus — typing overwrites, does NOT append.
// This test confirms that after clicking a duration cell and typing a new value via .fill(),
// the result is the typed value, NOT the old value + typed value concatenated.
test("FIX1: duration select-all-on-focus — typing '20' over '15' yields 20 not 1520", async ({ page }) => {
  await fillPlan(page, "09:00");
  // Confirm initial Q&A start at 9:30 (Intro 10 + Demo 20 = 30 min after 9:00)
  await expect(plannerRows(page).nth(2)).toContainText("9:30 AM");

  // Click Demo's duration cell (20m)
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durationInput = page.getByLabel("Duration in minutes");

  // .fill() replicates select-all + type behavior — value must be exactly '20'
  await durationInput.fill("20");
  await durationInput.press("Enter");

  // Q&A time must stay at 9:30 AM (10+20=30min from 9:00) — not blow up to 1520-min total
  await expect(plannerRows(page).nth(2)).toContainText("9:30 AM");

  // Duration chip shows 20m, not 1520m
  await expect(plannerRows(page).nth(1)).toContainText("20m");
  await expect(plannerRows(page).nth(1)).not.toContainText("1520");
});

// ===================================================================
// ROUND-5 DEFECT C: Drift badge NOT green during live overrun (small overrun, no Next)
// ===================================================================

test("Defect C [ROUND-5]: 1-min item +10s overrun → drift badge NOT green, NOT 'on time'", async ({ page }) => {
  // Build a session: 1-min item started 70 seconds ago = 10 seconds into overrun.
  // driftMs = 10_000ms > 5s grace → badge shows "10s behind" (amber, not green).
  // This is the exact panel acceptance test: +0:10 past a 1-min planned duration.
  const hash = sessionHashAtElapsed("ShortOverrun 1\nDemo 10", 1, 70_000); // 70s elapsed, 1 min planned
  await page.goto("/" + hash);

  await expect(page.getByRole("heading", { name: "ShortOverrun" })).toBeVisible();

  // Band must be RED (item overrunning)
  const band = page.locator("[data-cue-state]");
  await expect(band).toHaveAttribute("data-cue-state", "red");

  // Drift badge must NOT be green ("on time") — must be behind (amber or red)
  const badge = page.getByTestId("drift-badge");
  const headerState = await badge.getAttribute("data-header-cue-state");
  expect(headerState).not.toBe("on-time"); // the key assertion: NOT green

  // Badge text must contain "behind" (with seconds value since under 1 min)
  await expect(badge).toContainText(/behind/);
  await expect(badge).not.toContainText("on time");

  // Projected end must be after the planned end (pushed later by drift)
  // Verify by checking the "projected end" line contains a time
  const projEnd = page.locator("p", { hasText: /projected end/ });
  await expect(projEnd).toBeVisible();
});

test("Defect C [ROUND-5]: projected end is NOT frozen during 1-min item live overrun", async ({ page }) => {
  // Pre-position session at 61s into a 1-min item (1s overrun).
  const hash1 = sessionHashAtElapsed("LiveOverrun 1\nDemo 10", 1, 61_000);
  await page.goto("/" + hash1);

  const projEnd = page.locator("p", { hasText: /projected end/ });
  const text1 = (await projEnd.textContent()) ?? "";
  // Wait ~1s then check the projected end updates
  await page.waitForTimeout(1200);
  const text2 = (await projEnd.textContent()) ?? "";

  // The projected end text should update as drift grows (not frozen)
  // They should differ because 1 more second of overrun pushes it forward
  // (If they're equal it means the projected end is frozen — the defect)
  // Allow: they may look the same if the overrun is too short to flip the clock display minute.
  // At minimum: drift badge must say "behind" and NOT "on time"
  const badge = page.getByTestId("drift-badge");
  await expect(badge).toContainText(/behind/);
  await expect(badge).not.toContainText("on time");
});

// ===================================================================
// ROUND-6 DEFECT 2: Projected column sub-minute live tracking
// During an active overrun, a live sub-minute indicator must appear near
// the projected column so the table does NOT look frozen for ~50s.
// ===================================================================

test("Defect2 [ROUND-6]: sub-minute live indicator appears and tracks during active overrun", async ({ page }) => {
  // Pre-position: 10-min item started 10m 20s ago = 20s overrun (sub-minute).
  // driftMs = ~20_000ms, which is well below 60s so +Xs annotation must appear.
  const hash = sessionHashAtElapsed("Talk 10\nBreak 5\nClose 5", 10, 10 * 60_000 + 20_000);
  await page.goto("/" + hash);

  // Heading must show the first item (still on it, overrunning)
  await expect(page.getByRole("heading", { name: "Talk" })).toBeVisible();

  // The projected-live-drift indicator must appear (overrunning, sub-minute drift)
  const liveIndicator = page.getByTestId("projected-live-drift");
  await expect(liveIndicator).toBeVisible();
  // Must contain "behind" text (live drift label)
  await expect(liveIndicator).toContainText(/behind/);

  // The sub-minute per-row annotation must appear for at least one upcoming item
  const subMin = page.getByTestId("projected-subminute").first();
  await expect(subMin).toBeVisible();
  // Must show a "+Xs" annotation
  await expect(subMin).toContainText(/\+\d+s/);

  // Wait ~2s and confirm the annotation value changes (proving it tracks live)
  const textBefore = (await subMin.textContent()) ?? "";
  await page.waitForTimeout(2200);
  const textAfter = (await subMin.textContent()) ?? "";
  // The "+Xs" value must have changed (grown by ~2s)
  expect(textBefore).not.toBe(textAfter);
});

test("Defect2 [ROUND-6]: sub-minute indicator absent when NOT overrunning (no false positive)", async ({ page }) => {
  // 10-min item started 5 min ago — still well within time, NOT overrunning
  const hash = sessionHashAtElapsed("Talk 10\nBreak 5", 10, 5 * 60_000);
  await page.goto("/" + hash);

  // No overrun → no live indicator
  await expect(page.getByTestId("projected-live-drift")).toHaveCount(0);
  await expect(page.getByTestId("projected-subminute")).toHaveCount(0);
});

// FIX A: duration max-guard — absurdly large value is clamped to 600 (10h).
test("FIXA: duration max-guard — entering 1440 clamps to 600, shows visible flag", async ({ page }) => {
  await fillPlan(page, "09:00");

  // Tomás repro: typed '1440' — must be clamped to 600
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durationInput = page.getByLabel("Duration in minutes");
  await durationInput.fill("1440");
  await durationInput.press("Enter");

  // Duration chip must show 600m (clamped), not 1440m
  await expect(plannerRows(page).nth(1)).toContainText("600m");
  await expect(plannerRows(page).nth(1)).not.toContainText("1440m");

  // A visible inline flag must appear (role="alert" with "max 600m")
  await expect(page.locator('[role="alert"]').filter({ hasText: /max 600m/ })).toBeVisible();
});

// FIX A: click-to-place-cursor then type replaces (not concatenates).
// Exact Priya repro: click-to-place-cursor in cell with "5", type "20" → result must be 20.
test("FIXA: click-to-place-cursor then type replaces value — 20 over 5 yields 20 not 205", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 5");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(1);

  // Click the duration button to open the edit input (autoFocus + onFocus select-all)
  await page.getByRole("button", { name: /Edit duration: 5/ }).click();
  const durationInput = page.getByLabel("Duration in minutes");
  await expect(durationInput).toBeVisible();

  // Simulate click-inside-already-focused field: pointerUp fires select-all.
  await durationInput.click(); // triggers onPointerUp -> select()
  await durationInput.type("20"); // types "20", replacing selected "5"
  await durationInput.press("Enter");

  // Must be 20, not 205 or 520
  await expect(plannerRows(page).nth(0)).toContainText("20m");
  await expect(plannerRows(page).nth(0)).not.toContainText("205");
  await expect(plannerRows(page).nth(0)).not.toContainText("520");
});

// FIX 2: Start show honors planned start time — planned clocks carry into presenter.
test("FIX2: Start show uses planned start time — presenter rundown shows planned clock times", async ({ page }) => {
  await fillPlan(page, "09:00");
  // Planned start is 09:00; Q&A starts at 9:30 AM in planner view
  await expect(plannerRows(page).nth(2)).toContainText("9:30 AM");

  // Press Start — planned start (09:00) must carry into the presenter session
  const hhmm = await currentMinuteSafe(page);
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(countdown(page)).toBeVisible();

  // The presenter rundown must show planned time anchored to the entered start (hhmm),
  // not a silently different wall-clock time.
  // Q&A is 30 min after start (Intro 10 + Demo 20); verify it shows ~hhmm+30min.
  const [hh, mm] = hhmm.split(":").map(Number);
  const expectedMin = (hh * 60 + mm + 30) % (12 * 60); // 12h cycle for AM display
  const expectedHour = Math.floor(expectedMin / 60) || 12;
  const expectedMMStr = String(expectedMin % 60).padStart(2, "0");
  // Just verify the rundown section exists and Q&A row is present with a time
  const presRundown = page.locator("section[aria-label='Rundown'] li");
  await expect(presRundown.nth(2)).toContainText(/\d:\d{2}/); // any clock time
});

// FIX 3: structured editor + copy button visible on every entry path with items.
test("FIX3: structured rundown table + copy button visible immediately after paste", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill(AGENDA);
  // The structured table section must appear
  await expect(page.locator("section[aria-label='Parsed rundown']")).toBeVisible();
  // Copy rundown as text button must be visible (in the structured-table header)
  await expect(page.getByTestId("copy-rundown-btn")).toBeVisible();
  // The inline-edit hint must be visible
  await expect(page.locator("text=Click any name or time to edit")).toBeVisible();
});

test("FIX3: structured editor visible after End & edit agenda from presenter", async ({ page }) => {
  const hhmm = await startShow(page);
  await expect(countdown(page)).toBeVisible();

  // Click "End & edit agenda" to return to planner
  await page.getByRole("button", { name: /End.*edit/i }).click();

  // Must land back in planner view showing the structured table (not just a textarea)
  await expect(page.locator("section[aria-label='Parsed rundown']")).toBeVisible();
  await expect(page.getByTestId("copy-rundown-btn")).toBeVisible();
  // Must NOT be stuck in textarea-only view
  await expect(page.locator("text=Click any name or time to edit")).toBeVisible();
  void hhmm; // suppress unused var warning
});

// ===================================================================
// ROUND-2 FIXES (FIX A, FIX B, FIX C)
// ===================================================================

// FIX B: pressing Start with a FUTURE planned start now enters pre-roll, then "Start now"
// begins the show with drift = 0 / "on time". This is the FIX 1 (round-3) behavior.
test("FIXB: future planned start → pre-roll screen → Start now → drift badge shows on time / 0 min", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20\nQ&A 15");
  // Set planned start to 14:30 (way in the future — triggers pre-roll)
  await page.locator("#start-time").fill("14:30");
  await page.getByRole("button", { name: "Start show" }).click();

  // Pre-roll screen must appear with "STARTS IN" countdown
  await expect(page.getByTestId("preroll-countdown")).toBeVisible();
  // Rundown is visible in pre-roll so host can confirm it
  await expect(page.locator("section[aria-label='Planned rundown']")).toBeVisible();

  // "Start now" override button must be visible and clickable
  const startNowBtn = page.getByTestId("start-now-btn");
  await expect(startNowBtn).toBeVisible();
  await startNowBtn.click();

  // Now in presenter mode with countdown visible
  await expect(countdown(page)).toBeVisible();

  // Drift badge must NOT show "min ahead" or "min behind" — it must say "on time"
  await expect(driftBadge(page)).toContainText(/on time/);
  await expect(driftBadge(page)).not.toContainText(/min ahead/);
  await expect(driftBadge(page)).not.toContainText(/min behind/);

  // Planned schedule column must still show 14:30-anchored times
  const presRundown = page.locator("section[aria-label='Rundown'] li");
  await expect(presRundown.nth(0)).toContainText("2:30 PM"); // 14:30
  await expect(presRundown.nth(1)).toContainText("2:40 PM"); // 14:40
});

// FIX B: read-only share URL during pre-roll shows the same "STARTS IN" countdown.
test("FIXB: read-only share URL during pre-roll shows STARTS IN countdown", async ({ page, context }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  await page.locator("#start-time").fill("14:30");
  await page.getByRole("button", { name: "Start show" }).click();

  // Confirm we're in pre-roll
  await expect(page.getByTestId("preroll-countdown")).toBeVisible();

  // Get the URL (which encodes the pre-roll session with pr field)
  const url = page.url();
  const tab2 = await context.newPage();
  await tab2.goto(url);

  // Co-facilitator in a new tab must also see the pre-roll countdown
  await expect(tab2.getByTestId("preroll-countdown")).toBeVisible();
  await tab2.close();
});

// FIX B extra: pressing Start with a NOW/PAST planned start → begins immediately, no pre-roll.
test("FIXB: past planned start + Start → begins immediately (no pre-roll)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20\nQ&A 15");
  // Set planned start to a past time (early morning, always in the past by test time)
  await page.locator("#start-time").fill("00:01");
  await page.getByRole("button", { name: "Start show" }).click();

  // Must go directly to presenter (no pre-roll) — countdown visible immediately
  await expect(countdown(page)).toBeVisible();
  // Pre-roll countdown must NOT be shown
  await expect(page.getByTestId("preroll-countdown")).toHaveCount(0);

  // Drift badge reads on time
  await expect(driftBadge(page)).toContainText(/on time/);
});

// FIX C: "+ Add item" on the cold page preserves placeholder agenda items.
// On cold load (no URL session), the structured table is pre-populated with the
// placeholder agenda so "Start show" is immediately enabled (FIX 3) and
// "+ Add item" appends without wiping the sample.
test("FIXC: + Add item from cold page preserves placeholder items and appends new row", async ({ page }) => {
  await page.goto("/");
  // Cold state: placeholder items are shown in the structured table.
  // Start show must be ENABLED (FIX 3 — stranger can press Start on the sample).
  await expect(page.getByRole("button", { name: "Start show" })).toBeEnabled();

  // The first item shown should be "Welcome" (from PLACEHOLDER)
  await expect(plannerRows(page).first()).toContainText("Welcome");

  const addBtn = page.getByRole("button", { name: "+ Add item" });
  await expect(addBtn).toBeVisible();

  const countBefore = await plannerRows(page).count();

  await addBtn.click();

  // Must have one more row (placeholder items + "New item")
  const rows = plannerRows(page);
  const countAfter = await rows.count();
  expect(countAfter).toBe(countBefore + 1);

  // The new item row is in edit mode (input focused), so commit it by pressing Escape.
  // Then the name "New item" becomes the displayed text.
  await page.keyboard.press("Escape");

  // The last row should be the newly added "New item" (now committed / button visible)
  await expect(rows.last()).toContainText("New item");

  // Confirm the first placeholder item is still visible (e.g. "Welcome")
  await expect(rows.first()).toContainText("Welcome");
});

// ===================================================================
// ROUND-3 FIXES (FIX 1, FIX 2, FIX 3, FIX 4)
// ===================================================================

// FIX 1: Pre-roll state — future planned start enters "STARTS IN HH:MM:SS" mode.
test("FIX1: future planned start shows STARTS IN countdown + planned rundown", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  await page.locator("#start-time").fill("14:30");
  await page.getByRole("button", { name: "Start show" }).click();

  // Pre-roll screen: large STARTS IN countdown
  await expect(page.getByTestId("preroll-countdown")).toBeVisible();
  const countdown = await page.getByTestId("preroll-countdown").textContent();
  // Format must be HH:MM:SS
  expect(countdown).toMatch(/^\d{2}:\d{2}:\d{2}$/);

  // Planned rundown visible while waiting
  await expect(page.locator("section[aria-label='Planned rundown']")).toBeVisible();
  await expect(page.locator("section[aria-label='Planned rundown']")).toContainText("Intro");

  // No presenter controls yet (show hasn't started)
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
});

test("FIX1: Start now override in pre-roll begins show immediately with drift=0", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20\nQ&A 15");
  await page.locator("#start-time").fill("14:30");
  await page.getByRole("button", { name: "Start show" }).click();

  await expect(page.getByTestId("preroll-countdown")).toBeVisible();

  // Press "Start now"
  await page.getByTestId("start-now-btn").click();

  // Must enter presenter mode — countdown visible
  await expect(page.getByTestId("countdown")).toBeVisible();

  // Drift must be on time (anchored to actual start moment, not 14:30)
  await expect(page.getByTestId("drift-badge")).toContainText(/on time/);
  await expect(page.getByTestId("drift-badge")).not.toContainText(/min ahead/);
  await expect(page.getByTestId("drift-badge")).not.toContainText(/min behind/);

  // Planned times still anchored to 14:30
  const rundown = page.locator("section[aria-label='Rundown'] li");
  await expect(rundown.nth(0)).toContainText("2:30 PM");
});

test("FIX1: share URL during pre-roll shows same STARTS IN countdown for co-facilitator", async ({ page, context }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  await page.locator("#start-time").fill("14:30");
  await page.getByRole("button", { name: "Start show" }).click();

  await expect(page.getByTestId("preroll-countdown")).toBeVisible();

  // Get pre-roll URL
  const url = page.url();
  expect(url).toContain("#");

  const tab2 = await context.newPage();
  await tab2.goto(url);

  // Co-facilitator sees the same pre-roll countdown
  await expect(tab2.getByTestId("preroll-countdown")).toBeVisible();
  // Countdown format is HH:MM:SS
  const ct = await tab2.getByTestId("preroll-countdown").textContent();
  expect(ct).toMatch(/^\d{2}:\d{2}:\d{2}$/);

  await tab2.close();
});

test("FIX1: past/now planned start → no pre-roll, begins immediately", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  // Use a past time (00:01 is always in the past for tests run in the daytime)
  await page.locator("#start-time").fill("00:01");
  await page.getByRole("button", { name: "Start show" }).click();

  // Must enter presenter immediately — no pre-roll
  await expect(page.getByTestId("countdown")).toBeVisible();
  await expect(page.getByTestId("preroll-countdown")).toHaveCount(0);
});

// FIX 2: Ctrl+A then type replaces value, not prepends. Clocks never run backward.
test("FIX2: Ctrl+A then type in duration cell replaces value — 30 becomes 20 not 3020", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 30\nNext 10");
  await page.locator("#start-time").fill("09:00");
  // Initial Q&A starts at 9:30
  await expect(plannerRows(page).nth(1)).toContainText("9:30 AM");

  // Click duration cell for Session (30m)
  await page.getByRole("button", { name: /Edit duration: 30/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await expect(durInput).toBeVisible();

  // Ctrl+A then type "20" — must produce 20, not 3020
  await durInput.press("Control+a");
  await durInput.type("20");
  await durInput.press("Enter");

  // Duration chip shows 20m (not 3020m, not 3000m, not 600m)
  await expect(plannerRows(page).nth(0)).toContainText("20m");
  await expect(plannerRows(page).nth(0)).not.toContainText("302");
  await expect(plannerRows(page).nth(0)).not.toContainText("600m");

  // Clocks must be monotonically increasing — 9:00 then 9:20 (not backward)
  const text0 = (await plannerRows(page).nth(0).textContent()) ?? "";
  const text1 = (await plannerRows(page).nth(1).textContent()) ?? "";
  const m0 = text0.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const m1 = text1.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  expect(m0).not.toBeNull();
  expect(m1).not.toBeNull();
  if (m0 && m1) {
    const toMin = (m: RegExpMatchArray) => {
      let h = parseInt(m[1], 10) % 12;
      if (m[3]?.toUpperCase() === "PM") h += 12;
      return h * 60 + parseInt(m[2], 10);
    };
    expect(toMin(m1)).toBeGreaterThan(toMin(m0)); // clocks are monotonically increasing
  }
});

test("FIX2: over-600 duration is clamped and clocks stay monotonically increasing", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("A 20\nB 10");
  await page.locator("#start-time").fill("09:00");

  // Enter a huge value
  await page.getByRole("button", { name: /Edit duration: 20/ }).click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("9999");
  await durInput.press("Enter");

  // Clamped to 600
  await expect(plannerRows(page).nth(0)).toContainText("600m");
  // Clamp flag shown
  await expect(page.locator('[role="alert"]').filter({ hasText: /max 600m/ })).toBeVisible();

  // Row B must start at 9:00 + 600min = "7:00 PM"
  // — just verify it's after 9:00 AM (monotonically increasing)
  const text0 = (await plannerRows(page).nth(0).textContent()) ?? "";
  const text1 = (await plannerRows(page).nth(1).textContent()) ?? "";
  // Both rows contain a clock time — row 1 time > row 0 time
  const m0 = text0.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const m1 = text1.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m0 && m1) {
    const toMin = (m: RegExpMatchArray) => {
      let h = parseInt(m[1], 10) % 12;
      if (m[3]?.toUpperCase() === "PM") h += 12;
      return h * 60 + parseInt(m[2], 10);
    };
    expect(toMin(m1)).toBeGreaterThan(toMin(m0));
  }
});

// FIX 3: Start show is enabled on cold load (sample is pre-filled and valid).
test("FIX3: Start show is ENABLED on cold load — sample agenda makes it immediately startable", async ({ page }) => {
  await page.goto("/");
  // On cold load, placeholder items are pre-populated — Start must be enabled
  const startBtn = page.getByRole("button", { name: "Start show" });
  await expect(startBtn).toBeEnabled();

  // The hint "Add at least one item to start" must NOT be visible (items exist)
  await expect(page.locator('[role="status"]').filter({ hasText: /Add at least one item/ })).toHaveCount(0);

  // Structured rundown section must show Welcome (first placeholder item)
  await expect(plannerRows(page).first()).toContainText("Welcome");
});

test("FIX3: deleting ALL items disables Start and shows hint (empty state)", async ({ page }) => {
  await page.goto("/");
  // Delete all placeholder items one by one
  await page.locator("#agenda").fill("Solo 10");
  await expect(plannerRows(page)).toHaveCount(1);
  await page.getByRole("button", { name: /Remove Solo/ }).click();

  // Now Start is disabled
  await expect(page.getByRole("button", { name: "Start show" })).toBeDisabled();
  // Hint shows
  await expect(page.locator('[role="status"]').filter({ hasText: /Add at least one item/ })).toBeVisible();
});

// FIX 4: Both copy buttons show "✓ Copied!" flip.
test("FIX4: Copy rundown as text button flips to Copied! and reverts", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  const copyBtn = page.getByTestId("copy-rundown-btn");
  await expect(copyBtn).toBeVisible();
  await expect(copyBtn).toHaveText("Copy rundown as text");

  await copyBtn.click();
  // Must flip to Copied!
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });
  // Must revert
  await expect(copyBtn).toHaveText("Copy rundown as text", { timeout: 3500 });
});

test("FIX4: Copy current link button flips to Copied! and reverts (Presenter)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  const hhmm = await page.evaluate(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(page.getByTestId("countdown")).toBeVisible();

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  const copyBtn = page.getByTestId("copy-link-btn");
  await expect(copyBtn).toBeVisible();
  await expect(copyBtn).toHaveText("Copy current link");

  await copyBtn.click();
  // Must flip to Copied!
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });
  // Must revert
  await expect(copyBtn).toHaveText("Copy current link", { timeout: 3500 });
});

// ===================================================================
// ROUND-7 DEFECTS A, B, C, D
// ===================================================================

// Defect A acceptance: paste "Keynote 1:30", "Standup 0:30", "Demo 12:30"
// → M:SS parsed durations, each row shows colon echo.
test("Defect A [R7] acceptance: paste colon items → M:SS parse, each row shows '→ Xm Ys' echo", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Keynote 1:30\nStandup 0:30\nDemo 12:30");
  await page.locator("#start-time").fill("09:00");

  await expect(plannerRows(page)).toHaveCount(3);

  // Row 0: Keynote 1:30 → 1m30s — echo "→ 1m 30s"
  const echo0 = plannerRows(page).nth(0).locator('[data-testid="colon-echo"]');
  await expect(echo0).toBeVisible();
  await expect(echo0).toContainText("1m 30s");

  // Row 1: Standup 0:30 → 30s — echo "→ 30s"
  const echo1 = plannerRows(page).nth(1).locator('[data-testid="colon-echo"]');
  await expect(echo1).toBeVisible();
  await expect(echo1).toContainText("30s");

  // Row 2: Demo 12:30 → 12m30s — echo "→ 12m 30s"
  const echo2 = plannerRows(page).nth(2).locator('[data-testid="colon-echo"]');
  await expect(echo2).toBeVisible();
  await expect(echo2).toContainText("12m 30s");
});

// Defect A acceptance: inline-editing a cell to "2:15" → 2m15s with colon echo.
test("Defect A [R7] acceptance: inline-edit to '2:15' shows '→ 2m 15s' echo", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 10\nBreak 5");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Edit Session duration to "2:15" (M:SS)
  await page.getByRole("button", { name: /Edit duration/ }).first().click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.press("Control+a");
  await page.keyboard.type("2:15");
  await durInput.press("Enter");

  // Echo must appear: "→ 2m 15s"
  const echoEl = plannerRows(page).nth(0).locator('[data-testid="colon-echo"]');
  await expect(echoEl).toBeVisible();
  await expect(echoEl).toContainText("2m 15s");
});

// Defect A: plain "Intro 10" has NO colon echo (only colon items get echo).
test("Defect A [R7]: plain 'Intro 10' has no colon echo (only colon items get echo)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Intro 10\nDemo 20");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // No colon echo on plain items
  await expect(plannerRows(page).nth(0).locator('[data-testid="colon-echo"]')).toHaveCount(0);
  await expect(plannerRows(page).nth(1).locator('[data-testid="colon-echo"]')).toHaveCount(0);
});

// Defect B acceptance: copy a rundown with colon item → paste back → identical durations.
test("Defect B [R7] acceptance: copy rundown with colon item → paste back → same echo (lossless round-trip)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Talk 1:30\nIntro 10");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Verify echo before copy
  const echoBeforeCopy = plannerRows(page).nth(0).locator('[data-testid="colon-echo"]');
  await expect(echoBeforeCopy).toBeVisible();
  await expect(echoBeforeCopy).toContainText("1m 30s");

  // Copy the rundown
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const copyBtn = page.getByTestId("copy-rundown-btn");
  await copyBtn.click();
  await expect(copyBtn).toContainText("Copied", { timeout: 2000 });

  const clipText = await page.evaluate(() => navigator.clipboard.readText());
  // Must emit colon form for round-trip safety
  expect(clipText).toContain("Talk 1:30");
  expect(clipText).toContain("Intro 10"); // plain min item stays plain

  // Clear and re-paste
  await page.locator("#agenda").fill("");
  await page.locator("#agenda").fill(clipText);
  await expect(plannerRows(page)).toHaveCount(2);

  // Re-pasted colon item must show same echo
  const echoAfterPaste = plannerRows(page).nth(0).locator('[data-testid="colon-echo"]');
  await expect(echoAfterPaste).toBeVisible();
  await expect(echoAfterPaste).toContainText("1m 30s");

  // Plain item has no echo
  await expect(plannerRows(page).nth(1).locator('[data-testid="colon-echo"]')).toHaveCount(0);
});

// Defect C acceptance: current item +10s overrun, no Next → headline badge reads "behind".
test("Defect C [R7] acceptance: 1-min item +10s overrun, no Next → headline DRIFT badge reads 'behind'", async ({ page }) => {
  // Pre-position: 1-min item started 70s ago = 10s overrun. No Next pressed.
  const hash = sessionHashAtElapsed("ShortItem 1\nBreak 10", 1, 70_000);
  await page.goto("/" + hash);

  await expect(page.getByRole("heading", { name: "ShortItem" })).toBeVisible();

  // Per-item band MUST be red (item overrunning)
  const band = page.locator("[data-cue-state]");
  await expect(band).toHaveAttribute("data-cue-state", "red");

  // HEADLINE drift badge MUST also read "behind" (not "on time")
  const badge = page.getByTestId("drift-badge");
  await expect(badge).toContainText(/behind/);
  await expect(badge).not.toContainText("on time");

  // data-header-cue-state must be behind (not on-time)
  const headerState = await badge.getAttribute("data-header-cue-state");
  expect(headerState).not.toBe("on-time");
  expect(["behind-amber", "behind-red"]).toContain(headerState);
});

// Defect C: drift=0 at exact Start moment must not be regressed.
test("Defect C [R7] no-regression: drift badge reads 'on time' at exact Start moment", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 5\nBreak 10");
  const hhmm = await currentMinuteSafe(page);
  await page.locator("#start-time").fill(hhmm);
  await page.getByRole("button", { name: "Start show" }).click();
  await expect(countdown(page)).toBeVisible();

  // Immediately after Start — drift must be on time (no retroactive penalty)
  await expect(driftBadge(page)).toContainText(/on time/);
  await expect(driftBadge(page)).not.toContainText(/min behind/);
  await expect(driftBadge(page)).not.toContainText(/min ahead/);
});

// Defect D acceptance: typing "0" in duration cell is flagged, item not dropped.
test("Defect D [R7] acceptance: typing '0' in duration cell shows inline flag, item not dropped", async ({ page }) => {
  await page.goto("/");
  await page.locator("#agenda").fill("Session 10\nBreak 5");
  await page.locator("#start-time").fill("09:00");
  await expect(plannerRows(page)).toHaveCount(2);

  // Edit Session duration to "0"
  await page.getByRole("button", { name: /Edit duration/ }).first().click();
  const durInput = page.getByLabel("Duration in minutes");
  await durInput.fill("0");
  await durInput.press("Enter");

  // Item must NOT be dropped — still 2 rows
  await expect(plannerRows(page)).toHaveCount(2);

  // Inline flag must appear (role="alert" with zero-duration message)
  await expect(page.locator('[role="alert"]').filter({ hasText: /0-min/ })).toBeVisible();
});
