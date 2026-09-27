/**
 * Availability poll — volunteer/public-side smoke tests (no auth required).
 * Covers: public event page, submission modal, full submission flow, regression.
 *
 * Env vars required:
 *   E2E_TEST_AVAILABILITY_EVENT_ID — a published availability poll with at least
 *     3 proposed dates and at least 1 existing response.
 *   E2E_TEST_EVENT_ID — a published scheduled event (for regression tests).
 */

import { test, expect } from '@playwright/test';

const availabilityEventId = process.env.E2E_TEST_AVAILABILITY_EVENT_ID;


// ─── public event page ────────────────────────────────────────────────────────

test.describe('Availability poll — public event page', () => {
  test('shows "Which dates work for you?" heading', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await expect(
      page.getByRole('heading', { name: /which dates work for you/i })
    ).toBeVisible();
  });

  test('renders checkboxes, not Sign Up buttons', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign up$/i })).not.toBeVisible();
  });

  test('shows response count per date when responses exist', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await expect(page.getByText(/\d+ people? available/i).first()).toBeVisible();
  });

  test('"See who →" button appears for dates with responses', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await expect(page.getByRole('button', { name: /see who/i }).first()).toBeVisible();
  });

  test('"See who →" opens a modal listing who is available', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('button', { name: /see who/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const dialogText = await page.getByRole('dialog').textContent();
    expect(dialogText?.trim().length).toBeGreaterThan(0);
  });

  test('"Select dates and submit" button is disabled until a date is checked', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    const submitBtn = page.getByRole('button', { name: /select dates and submit/i });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    await page.getByRole('checkbox').first().check();
    await expect(submitBtn).toBeEnabled();
  });

  test('unchecking all dates re-disables the submit button', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    const checkbox = page.getByRole('checkbox').first();
    const submitBtn = page.getByRole('button', { name: /select dates and submit/i });

    await checkbox.check();
    await expect(submitBtn).toBeEnabled();
    await checkbox.uncheck();
    await expect(submitBtn).toBeDisabled();
  });
});


// ─── submission modal ─────────────────────────────────────────────────────────

test.describe('Availability poll — submission modal', () => {
  test('modal opens with name, email fields and selected dates summary', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/name/i)).toBeVisible();
    await expect(dialog.getByLabel(/email/i)).toBeVisible();
    await expect(dialog.getByText(/your selected dates/i)).toBeVisible();
  });

  test('modal does NOT show a reminder option', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/send a reminder/i)).not.toBeVisible();
    await expect(page.getByText(/reminder/i)).not.toBeVisible();
  });

  test('modal submit button reads "Submit my availability"', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: /submit my availability/i })
    ).toBeVisible();
  });
});


// ─── full submission flow ─────────────────────────────────────────────────────

test.describe('Availability poll — full submission flow', () => {
  test('submitting availability lands on confirmation page with correct copy', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);

    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await page.getByRole('button', { name: /select dates and submit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/name/i).fill('Playwright Poll Test');
    await page.getByLabel(/email/i).fill(`playwright-poll-${Date.now()}@example.com`);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /submit my availability/i })
      .click();

    await page.waitForURL('**/signup/confirm**', { timeout: 10_000 });
    await expect(page.getByText(/you're all set/i)).toBeVisible();
    await expect(page.getByText(/you're signed up/i)).not.toBeVisible();
  });

  test('confirmation page shows the dates that were marked', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/name/i).fill('Playwright Confirm Check');
    await page.getByLabel(/email/i).fill(`playwright-confirm-${Date.now()}@example.com`);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /submit my availability/i })
      .click();

    await page.waitForURL('**/signup/confirm**', { timeout: 10_000 });
    await expect(page.getByText(/dates you marked/i)).toBeVisible();
  });

  test('confirmation page does NOT show a cancel link', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/name/i).fill('Playwright No Cancel');
    await page.getByLabel(/email/i).fill(`playwright-nocancel-${Date.now()}@example.com`);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /submit my availability/i })
      .click();

    await page.waitForURL('**/signup/confirm**', { timeout: 10_000 });
    await expect(page.getByRole('link', { name: /cancel/i })).not.toBeVisible();
  });

  test('duplicate submission shows a friendly error, not a crash', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    const email = `playwright-dupe-${Date.now()}@example.com`;

    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();
    await page.getByLabel(/name/i).fill('Playwright Dupe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('dialog').getByRole('button', { name: /submit my availability/i }).click();
    await page.waitForURL('**/signup/confirm**', { timeout: 10_000 });

    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();
    await page.getByLabel(/name/i).fill('Playwright Dupe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('dialog').getByRole('button', { name: /submit my availability/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/already submitted/i)).toBeVisible();
  });
});


// ─── regression: scheduled events unaffected ─────────────────────────────────

test.describe('Regression — scheduled events unchanged by availability poll feature', () => {
  test('existing scheduled event still renders Sign Up buttons, not checkboxes', async ({ page }) => {
    const scheduledEventId = process.env.E2E_TEST_EVENT_ID;
    if (!scheduledEventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${scheduledEventId}`);
    await expect(page.getByRole('button', { name: /^sign up$/i }).first()).toBeVisible();
    await expect(page.getByRole('checkbox')).not.toBeVisible();
  });

  test('existing scheduled event still shows "Open" section heading', async ({ page }) => {
    const scheduledEventId = process.env.E2E_TEST_EVENT_ID;
    if (!scheduledEventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${scheduledEventId}`);
    await expect(page.getByRole('heading', { name: /^open$/i })).toBeVisible();
    await expect(page.getByText(/which dates work for you/i)).not.toBeVisible();
  });
});
