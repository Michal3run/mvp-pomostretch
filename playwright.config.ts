import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
    // Explicitly forward Supabase credentials to the Astro dev server process.
    // Without this, the child process started by Playwright might not inherit
    // env vars set in the CI job's `env:` block, causing astro:env/server to
    // resolve empty strings and return "Supabase is not configured".
    env: {
      ...(process.env.SUPABASE_URL ? { SUPABASE_URL: process.env.SUPABASE_URL } : {}),
      ...(process.env.SUPABASE_KEY ? { SUPABASE_KEY: process.env.SUPABASE_KEY } : {}),
    },
  },
});
