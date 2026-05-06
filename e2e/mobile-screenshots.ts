/**
 * Mobile screenshot captures — visual QA at iPhone 14 viewport (390×844).
 *
 * These tests do NOT assert pixel-perfect diffs. They save screenshots to
 * test-results/screenshots/ so you can review layout at a glance after any
 * significant UI change.
 *
 * Run just these:
 *   npx playwright test --project=mobile-screenshots
 *
 * Screenshots land in:
 *   test-results/screenshots/
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '../test-results/screenshots');

function screenshotPath(name: string) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  return path.join(SCREENSHOT_DIR, `${name}.png`);
}

// ---------------------------------------------------------------------------
// Organizer pages (authenticated)
// ---------------------------------------------------------------------------

test.describe('Organizer pages — mobile screenshots', () => {
  test('dashboard — active tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: screenshotPath('dashboard-active'),
      fullPage: true,
    });
  });

  test('dashboard — archived tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const archivedTab = page.getByRole('button', { name: /^archived$/i });
    const hasArchived = await archivedTab.isVisible().catch(() => false);
    if (hasArchived) {
      await archivedTab.click();
      await page.waitForLoadState('networkidle');
    }
    await page.screenshot({
      path: screenshotPath('dashboard-archived'),
      fullPage: true,
    });
  });

  test('view my signups page', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/signups`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: screenshotPath('view-my-signups'),
      fullPage: true,
    });
  });

  test('edit event page', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: screenshotPath('edit-event'),
      fullPage: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Volunteer / public pages (no auth required)
// ---------------------------------------------------------------------------

test.describe('Volunteer pages — mobile screenshots', () => {
  test('event signup page', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${eventId}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: screenshotPath('event-page'),
      fullPage: true,
    });
  });

  test('event signup page — multi-date', async ({ page }) => {
    const eventId = process.env.E2E_TEST_MULTI_DATE_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_MULTI_DATE_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${eventId}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: screenshotPath('event-page-multi-date'),
      fullPage: true,
    });
  });

  test('event signup page — modal open', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${eventId}`);
    await page.waitForLoadState('networkidle');
    // Open the signup modal on the first available slot
    const signupButton = page.getByRole('button', { name: /^sign up$/i }).first();
    const hasButton = await signupButton.isVisible().catch(() => false);
    if (hasButton) {
      await signupButton.click();
      await page.waitForTimeout(300); // let modal animate in
    }
    await page.screenshot({
      path: screenshotPath('event-page-modal-open'),
      fullPage: false, // viewport-only so modal is centred in frame
    });
  });

  test('signup confirmation page', async ({ page }) => {
    // Navigate to confirm page with a dummy ID to see the layout
    // (will show "not found" state but captures the page structure)
    await page.goto('/signup/confirm?id=00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: screenshotPath('signup-confirm'),
      fullPage: true,
    });
  });
});
