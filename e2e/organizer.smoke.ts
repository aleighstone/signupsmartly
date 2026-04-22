/**
 * Organizer smoke tests — requires auth (session from auth.setup.ts).
 * Tests organizer dashboard and event management flows.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads and shows Your Signups', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /your signups/i })).toBeVisible();
  });

  test('shows Create Signup button in nav', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: /create signup/i })).toBeVisible();
  });
});

test.describe('Create signup flow', () => {
  test('can load create form', async ({ page }) => {
    await page.goto('/create-event');
    await expect(page.getByText(/I want to/i)).toBeVisible();
    // Both submit buttons present
    await expect(page.getByRole('button', { name: /^publish$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save as draft/i })).toBeVisible();
  });

  test('back button on pristine form navigates immediately', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByRole('button', { name: /← back to dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('back button on dirty form shows unsaved changes modal', async ({ page }) => {
    await page.goto('/create-event');
    // Type something to make the form dirty
    await page.getByPlaceholder(/falcons track meet/i).fill('Test event title');
    await page.getByRole('button', { name: /← back to dashboard/i }).click();
    // Modal should appear
    await expect(page.getByText(/unsaved changes/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /discard/i })).toBeVisible();
  });

  test('unsaved changes modal discard navigates to dashboard', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByPlaceholder(/falcons track meet/i).fill('Test event title');
    await page.getByRole('button', { name: /← back to dashboard/i }).click();
    await page.getByRole('button', { name: /discard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Draft mode', () => {
  test('save as draft creates a draft event on dashboard', async ({ page }) => {
    await page.goto('/create-event');

    // Fill minimum required fields for a simple list
    await page.getByRole('combobox').selectOption('simple');
    await page.getByLabel(/title/i).first().fill('Playwright Draft Test');
    // Slot name
    await page.getByPlaceholder(/e.g. plates/i).first().fill('Test item');

    // Save as draft
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Should end up on dashboard (via post-creation modal → No, I'm good)
    // or navigate to dashboard directly after modal
    // Wait for either the modal or the dashboard
    await page.waitForURL(/dashboard|create-event/, { timeout: 15_000 });

    // Navigate to dashboard and verify Draft pill appears
    await page.goto('/dashboard');
    await expect(page.getByText('Draft')).toBeVisible();
  });
});

test.describe('View My Signups page', () => {
  test('loads for a known event', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/signups`);
    await expect(page.getByRole('table')).toBeVisible();
  });
});

test.describe('Edit signup page', () => {
  test('back button on pristine edit form navigates immediately', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await page.getByRole('button', { name: /← back to signups/i }).click();
    await expect(page).toHaveURL(/signups/);
  });
});
