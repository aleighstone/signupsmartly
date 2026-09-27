/**
 * Availability poll — organizer-side smoke tests (requires auth).
 * Covers: create wizard, edit form, view signups page.
 *
 * Env vars required:
 *   E2E_TEST_AVAILABILITY_EVENT_ID — a published availability poll with at least
 *     3 proposed dates and at least 1 existing response.
 */

import { test, expect } from '@playwright/test';

const availabilityEventId = process.env.E2E_TEST_AVAILABILITY_EVENT_ID;

/** Textarea used by the edit form. */
const editDescriptionTextarea = (page: any) =>
  page.locator('textarea[name="signupsmartly-event-description"]');


// ─── create form (wizard) ─────────────────────────────────────────────────────

test.describe('Availability poll — create form (wizard)', () => {
  test('availability poll is a selectable type on the wizard', async ({ page }) => {
    await page.goto('/create-event');
    await expect(page.getByText('Availability poll')).toBeVisible();
  });

  test('selecting availability poll and advancing shows "Poll details" heading', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(page.getByRole('heading', { name: /poll details/i })).toBeVisible();
  });

  test('step 3 for availability poll shows the date options slot builder', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();
    await page.getByPlaceholder(/Team Retreat Dates/i).fill('Test Poll');
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(page.getByRole('heading', { name: /add date options/i })).toBeVisible();
  });

  test('capacity field is hidden on availability poll step 3', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();
    await page.getByPlaceholder(/Team Retreat Dates/i).fill('Test Poll');
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(page.getByLabel(/how many do you need/i)).not.toBeVisible();
  });

  test('description textarea is editable on availability poll step 2', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();
    const textarea = page.locator('textarea[name="wizard-availability-description"]');
    await expect(textarea).toBeVisible();
    const text = 'Availability description test';
    await textarea.fill(text);
    await expect(textarea).toHaveValue(text);
  });

  test('description value persists when navigating back and forward in the wizard', async ({ page }) => {
    const description = 'Description that should persist';
    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();

    const textarea = page.locator('textarea[name="wizard-availability-description"]');
    await textarea.fill(description);
    await expect(textarea).toHaveValue(description);

    await page.getByRole('button', { name: /^back$/i }).click();
    await page.getByRole('button', { name: /^next/i }).click();

    await expect(page.locator('textarea[name="wizard-availability-description"]')).toHaveValue(description);
  });

  test('can save a draft availability poll via wizard', async ({ page }) => {
    const title = `Playwright Availability Draft ${Date.now()}`;

    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();

    await page.getByPlaceholder(/Team Retreat Dates/i).fill(title);
    await page.getByRole('button', { name: /^next/i }).click();

    await page.locator('input[type="date"]').first().fill('2027-06-07');
    await page.getByRole('button', { name: /^next/i }).click();

    await page.getByRole('button', { name: /save as draft/i }).click();
    // Availability poll draft save navigates directly to the event's signups page (no template modal)
    await page.waitForURL(/\/dashboard\/event\/.*\/signups/, { timeout: 20_000 });
    await expect(page.getByText(title)).toBeVisible();
  });
});


// ─── edit form ────────────────────────────────────────────────────────────────

test.describe('Availability poll — edit form', () => {
  test('edit page hides capacity field for availability type', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/edit`);
    await expect(page.getByLabel(/how many do you need/i)).not.toBeVisible();
  });

  test('edit page hides reminder settings for availability type', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/edit`);
    await expect(page.getByText(/send reminders/i)).not.toBeVisible();
  });

  test('edit page title reads "Edit availability poll"', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/edit`);
    await expect(
      page.getByRole('heading', { name: /edit availability poll/i })
    ).toBeVisible();
  });

  test('description remains editable after adding and removing a proposed date', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/edit`);

    const addButton = page.getByRole('button', { name: /^\+ add (date|slot)/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    const removeButton = page.getByRole('button', { name: /^remove (date|slot)/i }).last();
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    const description = editDescriptionTextarea(page);
    const text = `Still editable after slot churn ${Date.now()}`;
    await description.fill(text);
    await expect(description).toHaveValue(text);
  });

  test('description can be changed and persists after save', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/edit`);
    const description = editDescriptionTextarea(page);
    await expect(description).toBeVisible();
    const originalDescription = await description.inputValue();
    const updatedDescription = `Playwright availability description ${Date.now()}`;

    try {
      // Use keyboard input instead of fill() to trigger React's onChange on the controlled textarea
      await description.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(updatedDescription);
      await expect(description).toHaveValue(updatedDescription);
      await page.getByRole('button', { name: /^save$/i }).click();
      await page.waitForURL(
        new RegExp(`/dashboard/event/${availabilityEventId}/signups`),
        { timeout: 15_000 }
      );
      await page.goto(`/dashboard/event/${availabilityEventId}/edit`);
      await expect(editDescriptionTextarea(page)).toHaveValue(updatedDescription);
    } finally {
      await page.goto(`/dashboard/event/${availabilityEventId}/edit`);
      // Keyboard input to ensure React's onChange fires for the controlled textarea
      await editDescriptionTextarea(page).click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(originalDescription);
      await page.getByRole('button', { name: /^save$/i }).click();
      await page
        .waitForURL(
          new RegExp(`/dashboard/event/${availabilityEventId}/signups`),
          { timeout: 15_000 }
        )
        .catch(() => {});
    }
  });
});


// ─── organizer View Signups page ──────────────────────────────────────────────

test.describe('Availability poll — organizer View Signups page', () => {
  test('loads and shows response count (not coverage meter)', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/signups`);
    await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
    await expect(page.getByText(/responses/i).first()).toBeVisible();
    await expect(page.getByText(/coverage/i)).not.toBeVisible();
  });

  test('dates are sorted by availability count (most first)', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/signups`);
    const counts = await page
      .locator('[data-availability-count]')
      .allTextContents();
    const nums = counts.map((t: string) => parseInt(t, 10)).filter(Number.isFinite);
    for (let i = 0; i < nums.length - 1; i++) {
      expect(nums[i]).toBeGreaterThanOrEqual(nums[i + 1]);
    }
  });

  test('shows total responses and distinct people count', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/signups`);
    await expect(page.getByText(/responses total from \d+ people/i).first()).toBeVisible();
  });

  test('export button is present', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/signups`);
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
  });
});
