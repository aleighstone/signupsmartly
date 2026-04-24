/**
 * Volunteer-facing smoke tests — no auth required.
 * These run against public pages only.
 *
 * Requires a published event with at least one open slot in the local DB.
 * Set E2E_TEST_EVENT_ID in .env.local to the event ID to test against.
 */

import { test, expect } from '@playwright/test';

const eventId = process.env.E2E_TEST_EVENT_ID;

test.beforeAll(() => {
  if (!eventId) {
    throw new Error('E2E_TEST_EVENT_ID must be set in .env.local');
  }
});

test.describe('Public event page', () => {
  test('loads and shows event title', async ({ page }) => {
    await page.goto(`/event/${eventId}`);
    // Page loads without error
    await expect(page).not.toHaveTitle(/404|error/i);
    // Coverage meter is visible
    await expect(page.getByText(/spots filled|items filled/i)).toBeVisible();
  });

  test('draft event returns 404 for public visitors', async ({ page }) => {
    const draftId = process.env.E2E_TEST_DRAFT_EVENT_ID;
    if (!draftId) {
      test.skip(true, 'E2E_TEST_DRAFT_EVENT_ID not set — skipping draft visibility test');
      return;
    }
    const response = await page.goto(`/event/${draftId}`);
    expect(response?.status()).toBe(404);
  });
});

test.describe('Volunteer signup flow', () => {
  test('can sign up for an open slot', async ({ page }) => {
    await page.goto(`/event/${eventId}`);

    // Find and click the first Sign Up button
    const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
    await expect(signUpButton).toBeVisible();
    await signUpButton.click();

    // Modal opens — heading is "Sign up for [slot name]"
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in the form
    await page.getByLabel(/name/i).fill('Playwright Test');
    await page.getByLabel(/email/i).fill('playwright-test@example.com');

    // Uncheck reminder if present (avoid sending emails during tests)
    const reminderCheckbox = page.getByLabel(/send a reminder/i);
    if (await reminderCheckbox.isVisible()) {
      await reminderCheckbox.uncheck();
    }

    // Submit — scope to the dialog to avoid targeting the page-level Sign Up buttons
    await page.getByRole('dialog').getByRole('button', { name: /confirm/i }).click();

    // Confirmation page
    await page.waitForURL('**/signup/confirm**', { timeout: 10_000 });
    await expect(page.getByText(/you're signed up/i)).toBeVisible();
  });

  test('confirmation page shows correct sections', async ({ page }) => {
    await page.goto(`/event/${eventId}`);
    await page.getByRole('button', { name: /sign up/i }).first().click();
    await page.getByLabel(/name/i).fill('Playwright Confirm Test');
    await page.getByLabel(/email/i).fill('playwright-confirm@example.com');

    const reminderCheckbox = page.getByLabel(/send a reminder/i);
    if (await reminderCheckbox.isVisible()) {
      await reminderCheckbox.uncheck();
    }

    await page.getByRole('dialog').getByRole('button', { name: /confirm/i }).click();
    await page.waitForURL('**/signup/confirm**', { timeout: 10_000 });

    // Must show signed up confirmation
    await expect(page.getByText(/you're signed up/i)).toBeVisible();
    // Must show cancel link
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    // Must NOT show "Add to Calendar" if no date (guarded by dateSource check)
    // This test just verifies the page doesn't crash — date presence varies by event
  });
});

test.describe('Slot card visual hierarchy', () => {
  test('single-date event: time is the h3 heading in slot cards', async ({
    page,
  }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${eventId}`);
    // The h3 in the first open slot card should contain a time pattern (e.g. "9:00 AM")
    const firstCard = page.locator('ul').first().locator('li').first();
    const h3 = firstCard.locator('h3');
    await expect(h3).toBeVisible();
    await expect(h3).toHaveText(/\d+:\d+\s*(AM|PM)/i);
  });

  test('multi-date event: date is the h3 heading in slot cards', async ({
    page,
  }) => {
    const multiDateEventId = process.env.E2E_TEST_MULTI_DATE_EVENT_ID;
    if (!multiDateEventId) {
      test.skip(
        true,
        'E2E_TEST_MULTI_DATE_EVENT_ID not set — skipping multi-date hierarchy test'
      );
      return;
    }
    await page.goto(`/event/${multiDateEventId}`);
    const firstCard = page.locator('ul').first().locator('li').first();
    const h3 = firstCard.locator('h3');
    await expect(h3).toBeVisible();
    // h3 should contain a month name (date), not a time
    await expect(h3).toHaveText(
      /January|February|March|April|May|June|July|August|September|October|November|December/i
    );
  });

  test('multi-date event: go to future spots link scrolls future slot into viewport', async ({ page }) => {
    const multiDateEventId = process.env.E2E_TEST_MULTI_DATE_EVENT_ID;
    if (!multiDateEventId) {
      test.skip(true, 'E2E_TEST_MULTI_DATE_EVENT_ID not set — skipping future spots link test');
      return;
    }
    await page.goto(`/event/${multiDateEventId}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('button', { name: /go to future spots/i }).click();
    const anchor = page.locator('[data-today-anchor="true"]').first();
    await expect(anchor).toBeInViewport({ ratio: 0.5 });
  });
});
