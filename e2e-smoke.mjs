// One-shot Playwright smoke of the spec's success checks against a running
// server (default http://localhost:3217). Run: node e2e-smoke.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3217";
let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE);

// --- Check 1: paste three formats, see names/durations/cumulative times
await page.fill("#agenda", "Intro 10\nDemo - 20 min\n15 Q&A");
await page.fill("#start-time", "09:00");
const rows = await page.locator("section[aria-label='Parsed rundown'] li").allTextContents();
check(
  "three rows parsed with cumulative 9:00/9:10/9:30",
  rows.length === 3 &&
    /Intro.*10 min.*9:00/.test(rows[0]) &&
    /Demo.*20 min.*9:10/.test(rows[1]) &&
    /Q&A.*15 min.*9:30/.test(rows[2]),
  JSON.stringify(rows)
);

// --- Check 2: unparseable line flagged, others keep times
await page.fill("#agenda", "Intro 10\nDemo - 20 min\n15 Q&A\njust some words");
const rows2 = await page.locator("section[aria-label='Parsed rundown'] li").allTextContents();
check(
  "bad line flagged inline, rest intact",
  rows2.length === 4 && /couldn..?t parse/.test(rows2[3]) && /9:30/.test(rows2[2]),
  JSON.stringify(rows2[3])
);
await page.fill("#agenda", "Intro 10\nDemo - 20 min\n15 Q&A");

// --- Check 3: changing start time shifts every planned time
await page.fill("#start-time", "09:30");
const rows3 = await page.locator("section[aria-label='Parsed rundown'] li").allTextContents();
check(
  "start 9:30 shifts to 9:30/9:40/10:00",
  /9:30/.test(rows3[0]) && /9:40/.test(rows3[1]) && /10:00/.test(rows3[2]),
  JSON.stringify(rows3)
);

// --- Check 4: Start -> presenter, countdown from 10:00, on time
// set planned start to the current minute so drift is ~0
const hm = await page.evaluate(() => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
});
await page.fill("#start-time", hm);
await page.click("text=Start show");
await page.waitForSelector("[data-testid='countdown']");
const countdown = await page.textContent("[data-testid='countdown']");
const badge = await page.textContent("[data-testid='drift-badge']");
const curName = await page.textContent("h2");
check(
  "presenter shows Intro, ~10:00 countdown, on time",
  curName.includes("Intro") && /^(10:00|9:5\d)$/.test(countdown.trim()) && badge === "on time",
  `countdown=${countdown} badge=${badge} current=${curName}`
);

// --- Check 5: Next immediately -> ~9-10 min ahead, projections earlier
await page.click("text=Next");
const badge2 = await page.textContent("[data-testid='drift-badge']");
const rundown = await page.locator("section[aria-label='Rundown'] li").allTextContents();
check(
  "after early Next: ahead badge ~9-10 min, planned AND projected shown",
  /^(9|10) min ahead$/.test(badge2) && rundown.length === 3 && /→/.test(rundown[2]),
  `badge=${badge2} qa-row=${JSON.stringify(rundown[2])}`
);

// --- Check 7 (URL share): same URL in a fresh context = read-only, same state
const url = page.url();
const ctx2 = await browser.newContext();
const page2 = await ctx2.newPage();
await page2.goto(url);
await page2.waitForSelector("[data-testid='drift-badge']");
const badge2b = await page2.textContent("[data-testid='drift-badge']");
const hasControls =
  (await page2.locator("button:has-text('Next')").count()) > 0 ||
  (await page2.locator("button:has-text('Back')").count()) > 0 ||
  (await page2.locator("button:has-text('Start')").count()) > 0;
const hasSnapshotNote = (await page2.locator("text=Snapshot view").count()) > 0;
const cur2 = await page2.textContent("h2");
check(
  "second context: read-only view, same item + drift, no controls",
  cur2.includes("Demo") && badge2b === badge2 && !hasControls && hasSnapshotNote,
  `item=${cur2} badge=${badge2b} controls=${hasControls}`
);

// network: no API calls for state
const reqs = [];
page2.on("request", (r) => reqs.push(r.url()));
await page2.reload();
await page2.waitForSelector("[data-testid='drift-badge']");
check(
  "no /api or external state calls in read-only view",
  reqs.every((u) => !u.includes("/api/")),
  reqs.filter((u) => u.includes("/api/")).join(",")
);

// --- Check 8: reload presenter tab restores session WITH controls
await page.reload();
await page.waitForSelector("[data-testid='drift-badge']");
const curAfter = await page.textContent("h2");
const nextVisible = (await page.locator("button", { hasText: "Next" }).count()) > 0;
check(
  "presenter reload restores running session with controls",
  curAfter.includes("Demo") && nextVisible,
  `item=${curAfter} next=${nextVisible}`
);

// --- Back undoes Next
await page.click("button:has-text('Back')");
const curBack = await page.textContent("h2");
check("Back returns to Intro", curBack.includes("Intro"), `item=${curBack}`);

await browser.close();
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
