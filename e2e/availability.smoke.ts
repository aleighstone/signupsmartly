/**
 * Availability poll smoke tests.
 *
 * Split into two suites:
 *   - Organizer tests (authenticated via storageState) — create, edit, view signups
 *   - Volunteer/public tests (no auth) — public event page, submission flow
 *
 * Env vars required:
 *   E2E_TEST_AVAILABILITY_EVENT_ID — a published availability poll event with
 *     at least 3 proposed dates and at least 1 existing response in the local DB.
 *     Seed: add a row to `events` with signup_type='availability', then add slots
 *     and at least one signup row so "See who →" is testable.
 *
 * Historical failure modes covered:
 *   - Description textarea silently broken after switching to availability type
 *   - Description value lost when switching between type options
 *   - Description un-editable after adding / removing a slot
 *   - Capacity field leaking through for availability type
 */

import { test, expect } from '@playwright/test';

// ─── helpers ──────────────────────────────────────────────────────────────────

const availabilityEventId = process.env.E2E_TEST_AVAILABILITY_EVENT_ID;

/** Textarea used by the edit form (single name). */
const editDescriptionTextarea = (page: any) =>
  page.locator('textarea[name="signupsmartly-event-description"]');


// ─── organizer tests (requires auth) ──────────────────────────────────────────

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

  test('step 3 for availability poll shows "Proposed dates" slot builder', async ({ page }) => {
    await page.goto('/create-event');
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();
    await page.getByPlaceholder(/Team Retreat Dates/i).fill('Test Poll');
    await page.getByRole('button', { name: /^next/i }).click();
    await expect(page.getByText(/proposed dates/i)).toBeVisible();
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

    // Navigate back to step 1 and forward again
    await page.getByRole('button', { name: /^back$/i }).click();
    await page.getByRole('button', { name: /^next/i }).click();

    await expect(page.locator('textarea[name="wizard-availability-description"]')).toHaveValue(description);
  });

  test('can save a draft availability poll via wizard', async ({ page }) => {
    const title = `Playwright Availability Draft ${Date.now()}`;

    await page.goto('/create-event');
    // Step 1: select availability poll
    await page.getByText('Availability poll').click();
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 2: fill title
    await page.getByPlaceholder(/Team Retreat Dates/i).fill(title);
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 3: add at least one proposed date
    await page.locator('input[type="date"]').first().fill('2027-06-07');
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 4: save as draft — lands on dashboard
    await page.getByRole('button', { name: /save as draft/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByText(title)).toBeVisible();
  });
});

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

  // ── Historical failure: description un-editable after slot manipulation ─────

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
      await description.fill(updatedDescription);
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
      await editDescriptionTextarea(page).fill(originalDescription);
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

test.describe('Availability poll — organizer View Signups page', () => {
  test('loads and shows response count (not coverage meter)', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/signups`);
    await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
    // Should show response count language, not "coverage"
    await expect(page.getByText(/responses/i)).toBeVisible();
    await expect(page.getByText(/coverage/i)).not.toBeVisible();
  });

  test('dates are sorted by availability count (most first)', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${availabilityEventId}/signups`);
    // Grab all availability count numbers in document order
    const counts = await page
      .locator('[data-availability-count]')
      .allTextContents();
    const nums = counts.map((t: string) => parseInt(t, 10)).filter(Number.isFinite);
    // Each value should be >= the one after it
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
    // Footer should show something like "X responses total from Y people"
    await expect(page.getByText(/responses total from \d+ people/i)).toBeVisible();
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


// ─── volunteer / public tests (no auth) ───────────────────────────────────────

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
    // Checkboxes present
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    // Per-slot "Sign up" buttons must NOT be present
    await expect(page.getByRole('button', { name: /^sign up$/i })).not.toBeVisible();
  });

  test('shows response count per date when responses exist', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);
    // At least one date should show a people-available count
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
    // Modal should contain at least one name
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

    // Check one date — button should become enabled
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
    // Selected dates summary should be visible
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

test.describe('Availability poll — full submission flow', () => {
  test('submitting availability lands on confirmation page with correct copy', async ({ page }) => {
    if (!availabilityEventId) {
      test.skip(true, 'E2E_TEST_AVAILABILITY_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${availabilityEventId}`);

    // Check two dates
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
    // Availability confirmation copy — NOT "You're signed up"
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
    // Should list the marked dates
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

    // First submission
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();
    await page.getByLabel(/name/i).fill('Playwright Dupe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('dialog').getByRole('button', { name: /submit my availability/i }).click();
    await page.waitForURL('**/signup/confirm**', { timeout: 10_000 });

    // Second submission with the same email
    await page.goto(`/event/${availabilityEventId}`);
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /select dates and submit/i }).click();
    await page.getByLabel(/name/i).fill('Playwright Dupe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('dialog').getByRole('button', { name: /submit my availability/i }).click();

    // Should show an error message, not crash or navigate
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/already submitted/i)).toBeVisible();
  });
});


// ─── regression: scheduled events unaffected ──────────────────────────────────

test.describe('Regression — scheduled events unchanged by availability poll feature', () => {
  test('existing scheduled event still renders Sign Up buttons, not checkboxes', async ({ page }) => {
    const scheduledEventId = process.env.E2E_TEST_EVENT_ID;
    if (!scheduledEventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${scheduledEventId}`);
    // Per-slot Sign Up buttons must be present
    await expect(page.getByRole('button', { name: /^sign up$/i }).first()).toBeVisible();
    // Checkboxes must NOT be present
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
    // Must NOT show availability poll heading
    await expect(page.getByText(/which dates work for you/i)).not.toBeVisible();
  });
});
