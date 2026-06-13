import { defineConfig } from "@playwright/test";

// E2E tests run against the DEPLOYED app. Override the target with BASE_URL,
// e.g. BASE_URL=https://showclock.vercel.app npm run test:e2e
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 150_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "https://showclock-awtvc75a5-elainegao.vercel.app",
    timezoneId: "UTC",
    locale: "en-US",
  },
});
