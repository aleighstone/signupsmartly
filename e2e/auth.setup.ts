/**
 * Auth setup — runs once before all organizer tests.
 * Logs in via the UI and saves the session to e2e/.auth/organizer.json
 * so individual tests don't need to log in themselves.
 *
 * Credentials come from environment variables — set these in .env.local:
 *   E2E_ORGANIZER_EMAIL=your@email.com
 *   E2E_ORGANIZER_PASSWORD=yourpassword
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/organizer.json');

setup('authenticate as organizer', async ({ page }) => {
  const email = process.env.E2E_ORGANIZER_EMAIL;
  const password = process.env.E2E_ORGANIZER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_ORGANIZER_EMAIL and E2E_ORGANIZER_PASSWORD must be set in .env.local'
    );
  }

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait until we land on the dashboard
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  await expect(page.getByText('Your Signups')).toBeVisible();

  // Save auth state for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
