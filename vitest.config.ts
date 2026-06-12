import { defineConfig } from "vitest/config";

// Keep vitest away from the Playwright specs in tests/e2e (those use
// @playwright/test's runner via `npm run test:e2e`).
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "tests/unit/**/*.test.ts"],
  },
});
