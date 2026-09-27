/**
 * Wizard smoke tests — covers the 4-step create signup wizard.
 * Requires auth (session from auth.setup.ts).
 */

import { test, expect } from '@playwright/test';

test.describe('Create signup wizard — step 1', () => {
  test('shows the type selection heading and all three signup type cards', async ({ page }) => {
    await page.goto('/create-event');
    await expect(
      page.getByRole('heading', { name: /what type of signup do you need\?/i })
    ).toBeVisible();
    await expect(page.getByText(/Simple list signup/i)).toBeVisible();
    await expect(page.getByText(/Scheduled signup/i)).toBeVisible();
    await expect(page.getByText(/Availability poll/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^next/i })).toBeVisible();
  });

  test('clicking a card selects it and Next advances to step 2', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Scheduled signup').click();
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(
      page.getByRole('heading', { name: /signup event details/i })
    ).toBeVisible();
  });
});

test.describe('Create signup wizard — step 2 headings', () => {
  test('simple list shows "Signup event details"', async ({ page }) => {
    await page.goto('/create-event');
    // Simple list is the default — click Next
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(
      page.getByRole('heading', { name: /signup event details/i })
    ).toBeVisible();
  });

  test('scheduled signup shows "Signup event details"', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Scheduled signup').click();
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(
      page.getByRole('heading', { name: /signup event details/i })
    ).toBeVisible();
  });

  test('availability poll shows "Poll details"', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(
      page.getByRole('heading', { name: /poll details/i })
    ).toBeVisible();
  });
});

test.describe('Create signup wizard — navigation', () => {
  test('Back button on step 2 returns to step 1', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(
      page.getByRole('heading', { name: /signup event details/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /^back$/i }).click();
    await expect(
      page.getByRole('heading', { name: /what type of signup do you need\?/i })
    ).toBeVisible();
  });

  test('can navigate through all 4 steps for a simple list signup', async ({ page }) => {
    await page.goto('/create-event');

    // Step 1 — type selection
    await expect(page.getByRole('heading', { name: /what type of signup do you need\?/i })).toBeVisible();
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 2 — event details
    await expect(page.getByRole('heading', { name: /signup event details/i })).toBeVisible();
    await page.getByPlaceholder(/Bake Sale Items/i).fill('Playwright Nav Test');
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 3 — spots
    await expect(page.getByRole('heading', { name: /add signup spots/i })).toBeVisible();
    await page.getByPlaceholder(/Chocolate chip cookies/i).first().fill('Test spot');
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 4 — finishing touches
    await expect(page.getByRole('heading', { name: /finishing touches/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /publish signup/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save as draft/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^preview$/i })).toBeVisible();
  });
});

test.describe('Create signup wizard — save as draft', () => {
  test('completes wizard and lands on dashboard with new draft', async ({ page }) => {
    const title = `Playwright Wizard Draft ${Date.now()}`;

    await page.goto('/create-event');

    // Step 1: simple list is selected by default
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 2: fill title
    await page.getByPlaceholder(/Bake Sale Items/i).fill(title);
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 3: add a spot
    await page.getByPlaceholder(/Chocolate chip cookies/i).first().fill('Test spot');
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 4: save as draft — opens "saved as draft" modal, then dismiss to go to dashboard
    await page.getByRole('button', { name: /save as draft/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /no thanks/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByText(title).first()).toBeVisible();
  });
});

test.describe('Create signup wizard — preview button', () => {
  test('Preview button is visible on step 4', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByRole('button', { name: /^next/i }).click();
    await page.getByPlaceholder(/Bake Sale Items/i).fill('Preview Test Event');
    await page.getByRole('button', { name: /^next/i }).click();
    await page.getByPlaceholder(/Chocolate chip cookies/i).first().fill('Test spot');
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(page.getByRole('button', { name: /^preview$/i })).toBeVisible();
  });
});

test.describe('Edit event — preview button', () => {
  test('Preview button is visible on the edit page', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await expect(page.getByRole('button', { name: /^preview$/i })).toBeVisible();
  });

  test('Preview button opens a new tab with the live event page', async ({ page, context }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/edit`);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /^preview$/i }).click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain(`/event/${eventId}`);
    await newPage.close();
  });
});
