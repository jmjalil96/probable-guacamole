import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 * Tests run against real API with test database.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Run tests sequentially to avoid rate limiting
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2, // Limit workers to avoid rate limiting from API
  reporter: "html",
  timeout: 30000,

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],

  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
