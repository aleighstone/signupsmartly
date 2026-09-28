/**
 * Mobile & tablet visual screenshot script.
 *
 * Captures key pages at three viewport widths so you can quickly spot layout
 * issues without running a full browser manually.
 *
 * Run:
 *   npx playwright test --project=mobile-screenshots
 *
 * Output:
 *   e2e/screenshots/{viewport}/{page}.png   (full-page PNGs)
 *
 * Requires:
 *   - Local dev server running  (npm run dev)
 *   - Auth setup has run once   (npx playwright test --project=setup)
 *   - E2E_TEST_EVENT_ID set in .env.local   (published event with open slots)
 *   - E2E_TEST_DRAFT_EVENT_ID set in .env.local  (unpublished draft event)
 */

import { test, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ─── Viewport definitions ─────────────────────────────────────────────────────

const VIEWPORTS = [
  { label: 'mobile-390',  width: 390,  height: 844  },  // iPhone 14 / 15
  { label: 'mobile-430',  width: 430,  height: 932  },  // iPhone 15 Pro Max
  { label: 'tablet-768',  width: 768,  height: 1024 },  // iPad mini / md: breakpoint
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const OUT_DIR = path.join(__dirname, 'screenshots');

/** Save a full-page screenshot to e2e/screenshots/{viewport}/{name}.png */
async function snap(page: Page, viewport: string, name: string) {
  const dir = path.join(OUT_DIR, viewport);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
}

/** Navigate and wait for the page to settle before screenshotting. */
async function go(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

// ─── Pages to capture ─────────────────────────────────────────────────────────

/**
 * For each viewport we run the same set of page captures in one test so they
 * appear as a single tidy entry in the Playwright report.
 * test.use() inside a describe block sets the viewport for all tests in it.
 */

for (const vp of VIEWPORTS) {
  test.describe(`Screenshots — ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    // ── 1. Dashboard (organizer, authenticated) ──────────────────────────────
    test('01 dashboard', async ({ page }) => {
      await go(page, '/dashboard');
      await snap(page, vp.label, '01-dashboard');
    });

    // ── 2. Dashboard — Archived tab ──────────────────────────────────────────
    test('02 dashboard archived tab', async ({ page }) => {
      await go(page, '/dashboard');
      const archivedTab = page.getByRole('button', { name: /^archived$/i });
      if (await archivedTab.isVisible()) {
        await archivedTab.click();
        await page.waitForLoadState('networkidle');
      }
      await snap(page, vp.label, '02-dashboard-archived-tab');
    });

    // ── 3. Volunteer event page (public, no auth needed for the page itself) ─
    test('03 volunteer event page', async ({ page }) => {
      const eventId = process.env.E2E_TEST_EVENT_ID;
      if (!eventId) {
        test.skip(true, 'E2E_TEST_EVENT_ID not set');
        return;
      }
      await go(page, `/event/${eventId}`);
      await snap(page, vp.label, '03-volunteer-event-page');
    });

    // ── 4. Volunteer signup modal / flow ─────────────────────────────────────
    //    Opens the first Sign Up button so you can see the modal or inline form.
    test('04 volunteer signup flow', async ({ page }) => {
      const eventId = process.env.E2E_TEST_EVENT_ID;
      if (!eventId) {
        test.skip(true, 'E2E_TEST_EVENT_ID not set');
        return;
      }
      await go(page, `/event/${eventId}`);
      const signUpBtn = page.getByRole('button', { name: /sign up/i }).first();
      if (await signUpBtn.isVisible()) {
        await signUpBtn.click();
        // Give modal/form time to animate in
        await page.waitForTimeout(400);
      }
      await snap(page, vp.label, '04-volunteer-signup-flow');
    });

    // ── 5. View Signups page (organizer, authenticated) ───────────────────────
    test('05 view signups page', async ({ page }) => {
      const eventId = process.env.E2E_TEST_EVENT_ID;
      if (!eventId) {
        test.skip(true, 'E2E_TEST_EVENT_ID not set');
        return;
      }
      await go(page, `/dashboard/event/${eventId}/signups`);
      await snap(page, vp.label, '05-view-signups-page');
    });

    // ── 6. Edit event page (organizer, authenticated) ─────────────────────────
    test('06 edit event page', async ({ page }) => {
      const eventId = process.env.E2E_TEST_EVENT_ID;
      if (!eventId) {
        test.skip(true, 'E2E_TEST_EVENT_ID not set');
        return;
      }
      await go(page, `/dashboard/event/${eventId}/edit`);
      await snap(page, vp.label, '06-edit-event-page');
    });

    // ── 7. Create event wizard — step 1 ──────────────────────────────────────
    test('07 create event wizard step 1', async ({ page }) => {
      await go(page, '/create-event');
      await snap(page, vp.label, '07-create-wizard-step-1');
    });

    // ── 8. Create event wizard — step 2 (title / poll details) ───────────────
    test('08 create event wizard step 2', async ({ page }) => {
      await go(page, '/create-event');
      await page.getByRole('button', { name: /^next/i }).click();
      await page.waitForLoadState('networkidle');
      await snap(page, vp.label, '08-create-wizard-step-2');
    });

    // ── 9. Draft event edit page (organizer, authenticated) ───────────────────
    test('09 draft event edit page', async ({ page }) => {
      const draftId = process.env.E2E_TEST_DRAFT_EVENT_ID;
      if (!draftId) {
        test.skip(true, 'E2E_TEST_DRAFT_EVENT_ID not set');
        return;
      }
      await go(page, `/dashboard/event/${draftId}/edit`);
      await snap(page, vp.label, '09-draft-event-edit-page');
    });

    // ── 10. Nav / hamburger menu open ─────────────────────────────────────────
    //    The hamburger only exists on narrow viewports — tap it to show the menu.
    test('10 nav menu open', async ({ page }) => {
      await go(page, '/dashboard');
      const hamburger = page.getByRole('button', { name: /open menu/i });
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(300);
      }
      await snap(page, vp.label, '10-nav-menu-open');
    });
  });
}
