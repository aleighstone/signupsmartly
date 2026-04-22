import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local so E2E_* vars are available to tests
config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Playwright config for local smoke testing.
 *
 * Run:  npm run test:e2e
 * Debug: npm run test:e2e -- --ui
 *
 * Requires local dev server running: npm run dev
 * Requires local Supabase running:   supabase start
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,       // run tests serially — we share a local DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup runs first — logs in and saves session to file
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Main smoke tests run using the saved auth session
    {
      name: 'chromium',
      testMatch: /organizer\.smoke\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/organizer.json',
      },
      dependencies: ['setup'],
    },

    // Volunteer tests run without auth (public-facing pages)
    {
      name: 'volunteer',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /volunteer\./,
    },
  ],

  // Automatically start dev server if not already running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,  // don't restart if already running
    timeout: 120_000,
  },
});
