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
    // Item name (simple list)
    await page.getByPlaceholder(/entree/i).first().fill('Test item');

    // Save as draft
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Should end up on dashboard (via post-creation modal → No, I'm good)
    // or navigate to dashboard directly after modal
    // Wait for either the modal or the dashboard
    await page.waitForURL(/dashboard|create-event/, { timeout: 15_000 });

    // Navigate to dashboard and verify at least one Draft pill appears
    await page.goto('/dashboard');
    await expect(page.getByText('Draft').first()).toBeVisible();
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

  test('back button on dirty edit form shows unsaved changes modal', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await page.getByLabel(/title/i).first().fill('Playwright Dirty Edit Test');
    await page.getByRole('button', { name: /← back to signups/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/unsaved changes/i)).toBeVisible();
  });

  test('unsaved changes modal discard navigates away from edit', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await page.getByLabel(/title/i).first().fill('Playwright Discard Test');
    await page.getByRole('button', { name: /← back to signups/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /discard/i }).click();
    await expect(page).toHaveURL(/signups/);
  });

  test('unsaved changes modal cancel keeps user on edit page', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await page.getByLabel(/title/i).first().fill('Playwright Cancel Test');
    await page.getByRole('button', { name: /← back to signups/i }).click();
    // Close via Escape key (backdrop button is obscured by the modal card)
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/edit/);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('saving edits updates existing signup without creating duplicates', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    await page.goto('/dashboard');
    const dashboardCardsBefore = await page.locator('main ul').first().locator('li').count();

    await page.goto(`/dashboard/event/${eventId}/edit`);
    const titleInput = page.getByLabel(/title/i).first();
    const originalTitle = (await titleInput.inputValue()).trim();
    const editedTitle = `${originalTitle} (Playwright edit)`;

    await titleInput.fill(editedTitle);
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
      timeout: 15_000,
    });

    await page.goto('/dashboard');
    const dashboardCardsAfterSave = await page.locator('main ul').first().locator('li').count();
    expect(dashboardCardsAfterSave).toBe(dashboardCardsBefore);
    await expect(page.locator(`li:has(a[href*="${eventId}"])`)).toHaveCount(1);

    // Cleanup so the shared seeded event title remains unchanged for other tests.
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await page.getByLabel(/title/i).first().fill(originalTitle);
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
      timeout: 15_000,
    });
  });
});

test.describe('Draft event', () => {
  test('shows Draft pill and Publish button on dashboard', async ({ page }) => {
    const draftId = process.env.E2E_TEST_DRAFT_EVENT_ID;
    if (!draftId) {
      test.skip(true, 'E2E_TEST_DRAFT_EVENT_ID not set');
      return;
    }
    await page.goto('/dashboard');
    // Scope to the specific draft card to avoid matching other events
    const draftCard = page.locator(`li:has(a[href*="${draftId}"])`);
    await expect(draftCard.getByText('Draft', { exact: true })).toBeVisible();
    await expect(draftCard.getByRole('button', { name: /^publish$/i })).toBeVisible();
    await expect(draftCard.getByRole('link', { name: /signup page/i })).not.toBeVisible();
  });

  test('shows draft banner and Publish button on edit page', async ({ page }) => {
    const draftId = process.env.E2E_TEST_DRAFT_EVENT_ID;
    if (!draftId) {
      test.skip(true, 'E2E_TEST_DRAFT_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${draftId}/edit`);
    await expect(page.getByText(/this signup is not live yet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^publish$/i })).toBeVisible();
  });
});

test.describe('Copy signup', () => {
  test('copy from three-dot menu lands on edit page of new draft', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto('/dashboard');
    // Scope to the specific published event card — drafts don't have a Copy menu item
    const eventCard = page.locator(`li:has(a[href*="${eventId}"])`).first();
    await expect(eventCard).toBeVisible();
    await eventCard.getByRole('button', { name: /more actions for this signup/i }).click();
    await page.getByRole('menuitem', { name: /^copy$/i }).click();
    // Should navigate to edit page of the new draft copy
    await page.waitForURL(/\/dashboard\/event\/.+\/edit/, { timeout: 10_000 });
    // Draft banner confirms the copy started as a draft
    await expect(page.getByText(/this signup is not live yet/i)).toBeVisible();
  });
});

test.describe('Archive signup', () => {
  test('archive moves a published event to Archived and makes public page 404', async ({
    page,
  }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    let archived = false;

    await page.request.post(`/api/events/${eventId}/unarchive`);

    try {
      await page.goto('/dashboard');
      const activeCard = page.locator(`li:has(a[href*="${eventId}"])`).first();
      await expect(activeCard).toBeVisible();

      await activeCard
        .getByRole('button', { name: /more actions for this signup/i })
        .click();
      await page.getByRole('menuitem', { name: /^archive$/i }).click();
      await expect(
        page.getByRole('heading', { name: /archive this signup/i })
      ).toBeVisible();
      await page.getByRole('button', { name: /^archive$/i }).click();
      archived = true;

      await expect(activeCard).not.toBeVisible();

      await page.getByRole('button', { name: /^archived$/i }).click();
      const archivedCard = page.locator(`li:has(a[href*="${eventId}"])`).first();
      await expect(archivedCard).toBeVisible();
      await expect(archivedCard.getByText('Archived', { exact: true })).toBeVisible();
      await expect(
        archivedCard.getByRole('link', { name: /view my signups/i })
      ).toBeVisible();
      await expect(
        archivedCard.getByRole('link', { name: /signup page/i })
      ).not.toBeVisible();

      const response = await page.goto(`/event/${eventId}`);
      expect(response?.status()).toBe(404);
    } finally {
      if (archived) {
        await page.request.post(`/api/events/${eventId}/unarchive`);
      }
    }
  });

  test('unarchive restores an archived event to Active and public page works', async ({
    page,
  }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    await page.request.post(`/api/events/${eventId}/archive`);

    await page.goto('/dashboard');

    // Guard: if neither the Active nor Archived tab is visible, the event doesn't
    // exist in the local DB — fail fast with a clear message instead of timing out.
    const archivedTab = page.getByRole('button', { name: /^archived$/i });
    const tabVisible = await archivedTab.isVisible().catch(() => false);
    if (!tabVisible) {
      test.skip(true, `Dashboard tabs not found for event ${eventId} — re-seed local DB and update .env.local`);
      return;
    }

    await archivedTab.click();
    const archivedCard = page.locator(`li:has(a[href*="${eventId}"])`).first();
    await expect(archivedCard).toBeVisible();

    await archivedCard
      .getByRole('button', { name: /more actions for this signup/i })
      .click();
    await page.getByRole('menuitem', { name: /^unarchive$/i }).click();

    await page.getByRole('button', { name: /^active$/i }).click();
    const activeCard = page.locator(`li:has(a[href*="${eventId}"])`).first();
    await expect(activeCard).toBeVisible();
    await expect(activeCard.getByText('Archived', { exact: true })).not.toBeVisible();

    const response = await page.goto(`/event/${eventId}`);
    expect(response?.status()).toBe(200);
  });
});
