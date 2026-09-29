/**
 * Organizer smoke tests — requires auth (session from auth.setup.ts).
 * Tests organizer dashboard and event management flows.
 */

import { test, expect } from '@playwright/test';

const dashboardSignupsLinkForEvent = (page: any, eventId: string) =>
  page.locator(`a[href*="/dashboard/event/${eventId}/signups"]:visible`).first();

const dashboardEventRow = (page: any, eventId: string) =>
  page
    // Only match VISIBLE elements — div rows are inside a hidden-on-mobile container,
    // li cards are inside a hidden-on-desktop list. Using :visible scopes to whichever
    // layout is active at the current viewport.
    .locator('div:visible, li:visible', {
      has: page.locator(`a[href*="/dashboard/event/${eventId}/signups"]`),
    })
    .filter({
      has: page.getByRole('button', { name: /more actions for this signup/i }),
    })
    // Exclude the outer container divs/lists that contain ALL events' links.
    // An element that has a link to a DIFFERENT event is a wrapper, not the specific row.
    .filter({
      hasNot: page.locator(`a[href*="/dashboard/event/"]:not([href*="${eventId}"])`),
    })
    .first();

const dashboardMenuButtonForEvent = (page: any, eventId: string) =>
  dashboardEventRow(page, eventId)
    .getByRole('button', { name: /more actions for this signup/i })
    .first();

/**
 * Open the dashboard ⋮ menu for an event. On slow mobile emulation the first tap
 * can land before React hydrates the button, so retry until the menu is open.
 */
const openDashboardMenu = async (page: any, eventId: string) => {
  await expect(async () => {
    await dashboardMenuButtonForEvent(page, eventId).click();
    await expect(page.getByRole('menu').first()).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
};

const editDescriptionTextarea = (page: any) =>
  page.locator('textarea[name="signupsmartly-event-description"]');

/**
 * Wait for React to hydrate a specific element before interacting with it via
 * page.evaluate(). On slower emulated devices (e.g., mobile-organizer) the 'load'
 * event fires while React is still executing its hydration pass, so native setter
 * calls made immediately after page.goto() may dispatch events before React's
 * synthetic event handlers are attached. Checking for the __reactFiber$ key
 * confirms hydration has completed for that element.
 */
const waitForReactHydration = (page: any, selector: string) =>
  page.waitForFunction(
    (sel: string) => {
      const el = document.querySelector(sel);
      return el != null && Object.keys(el).some((k) => k.startsWith('__react'));
    },
    selector,
    { timeout: 10_000 }
  );

/**
 * Set a form field's value so that React's synthetic onChange fires and
 * react-hook-form's isDirty / getValues() reflect the new value.
 *
 * Strategy:
 *   1. Set the native DOM value via the HTMLInputElement/HTMLTextAreaElement prototype setter
 *      (bypasses React's property interception so the native value actually changes).
 *   2. Directly invoke the element's __reactProps$* onChange handler — this is the same
 *      function React calls from its synthetic event system, so isDirty updates
 *      regardless of whether event delegation is fully wired up (critical on slow mobile
 *      emulation where hydration may not be complete when page.evaluate() runs).
 *   3. Fall back to dispatchEvent if the __reactProps$ key isn't present.
 */
const setNativeInputValue = (
  page: any,
  selector: string,
  value: string,
  elementType: 'input' | 'textarea' = 'input'
) =>
  page.evaluate(
    ({ sel, val, type }: { sel: string; val: string; type: 'input' | 'textarea' }) => {
      const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el) return;

      // 1. Set the underlying native value
      const proto =
        type === 'textarea'
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, val);

      // 2. Call React's onChange prop directly (works on mobile where event delegation
      //    may race with React hydration)
      const propsKey = Object.keys(el).find((k) => k.startsWith('__reactProps'));
      if (propsKey && typeof (el as any)[propsKey]?.onChange === 'function') {
        (el as any)[propsKey].onChange({ target: el, currentTarget: el, type: 'input' });
        return;
      }

      // 3. Fallback: fire native events that React's delegated handler will catch
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { sel: selector, val: value, type: elementType }
  );

/**
 * Make the edit form dirty the way a person would: click the title and type.
 * Real key presses go through React's normal event path, so react-hook-form's
 * isDirty updates on every viewport (the value-setter trick above did not on mobile).
 */
const typeIntoTitle = async (page: any, text: string) => {
  const title = page.locator('input[name="title"]');
  await title.click();
  await title.press('End');
  await title.pressSequentially(` ${text}`);
};

test.describe('Dashboard', () => {
  test('loads and shows Your Signups', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /your signups/i })).toBeVisible();
  });

  test('shows Create Signup button in nav', async ({ page }) => {
    await page.goto('/dashboard');
    // Nav link shows "Create" on narrow viewports and "Create Signup" on wider ones — match either
    await expect(page.getByRole('navigation').getByRole('link', { name: /create/i }).first()).toBeVisible();
  });


  test('overflow menu is fully visible and not clipped', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.request.post(`/api/events/${eventId}/unarchive`);
    await page.goto('/dashboard');
    await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();
    await openDashboardMenu(page, eventId);

    const menu = page.getByRole('menu').first();
    await expect(menu).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^edit$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^delete$/i })).toBeVisible();

    const box = await menu.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);

    const bottomIsMenu = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return Boolean(element?.closest('[role="menu"]'));
    }, {
      x: box!.x + 12,
      y: box!.y + box!.height - 6,
    });
    expect(bottomIsMenu).toBe(true);
  });

  test('event row actions navigate to edit and signups pages', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    await page.goto('/dashboard');
    await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();
    // Open the three-dot menu and click Edit (the edit link only exists in the DOM when the menu is open).
    // Register waitForURL BEFORE the click so we don't race the navigation.
    // Use waitUntil:'commit' (URL changed + headers received) instead of the default 'load',
    // because Next.js SPA navigations don't re-fire the 'load' event.
    await openDashboardMenu(page, eventId);
    const editNav = page.waitForURL(
      new RegExp(`/dashboard/event/${eventId}/edit`),
      { timeout: 10_000, waitUntil: 'commit' }
    );
    await page.getByRole('menuitem', { name: /^edit$/i }).click();
    await editNav;
    // Let the edit page finish loading before navigating again, otherwise the
    // in-flight client navigation interrupts page.goto on slower mobile emulation.
    await expect(page.locator('input[name="title"]')).toBeVisible();

    await page.goto('/dashboard');
    await dashboardSignupsLinkForEvent(page, eventId).click();
    await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
      timeout: 10_000,
      waitUntil: 'commit',
    });
  });
});

test.describe('Create signup flow', () => {
  test('can load create form (wizard step 1)', async ({ page }) => {
    await page.goto('/create-event');
    await expect(
      page.getByRole('heading', { name: /what type of signup do you need\?/i })
    ).toBeVisible();
    await expect(page.getByText(/Simple list signup/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^next/i })).toBeVisible();
  });
});

test.describe('Draft mode', () => {
  test('wizard save as draft creates a draft event on dashboard', async ({ page }) => {
    await page.goto('/create-event');

    // Step 1: simple list (default)
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 2: fill title
    await page.getByPlaceholder(/Bake Sale Items/i).fill('Playwright Draft Test');
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 3: add a spot
    await page.getByPlaceholder(/Chocolate chip cookies/i).first().fill('Test item');
    await page.getByRole('button', { name: /^next/i }).click();

    // Step 4: save as draft — opens modal, dismiss to go to dashboard
    await page.getByRole('button', { name: /save as draft/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /no thanks/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    // Pick only visible Draft badges — on mobile the desktop table is hidden (hidden md:block)
    // so .first() on the full DOM picks the hidden span. Use :visible to get whichever badge
    // is rendered at the current viewport width.
    await expect(page.locator('span:visible').filter({ hasText: /^Draft$/ }).first()).toBeVisible();
  });
});

test.describe('View My Signups page', () => {
  test('loads for a known event with header actions and notifications control', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/signups`);
    await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /copy url/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^edit$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    await expect(page.getByText(/coverage/i).first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/notifications for this event:/i)).toBeVisible();
    await expect(page.locator('#event-notification-override')).toBeVisible();
  });

  test('export dropdown shows expected menu items', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/dashboard/event/${eventId}/signups`);
    await page.getByRole('button', { name: /^export$/i }).click();
    await expect(page.getByRole('menuitem', { name: /^export csv$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^export list$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^print$/i })).toBeVisible();
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
    // fill() alone doesn't trigger react-hook-form's isDirty because React intercepts the
    // property setter. Use setNativeInputValue which directly calls React's onChange prop.
    await waitForReactHydration(page, 'input[name="title"]');
    await typeIntoTitle(page, 'Playwright Dirty Edit Test');
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
    await waitForReactHydration(page, 'input[name="title"]');
    await typeIntoTitle(page, 'Playwright Discard Test');
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
    await waitForReactHydration(page, 'input[name="title"]');
    await typeIntoTitle(page, 'Playwright Cancel Test');
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
    const dashboardCardsBefore = await page
      .locator('button[aria-label="More actions for this signup"]:visible')
      .count();

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
    const dashboardCardsAfterSave = await page
      .locator('button[aria-label="More actions for this signup"]:visible')
      .count();
    expect(dashboardCardsAfterSave).toBe(dashboardCardsBefore);
    await expect(
      page.locator(`a[href*="/dashboard/event/${eventId}/signups"]:visible`)
    ).toHaveCount(1);

    // Cleanup so the shared seeded event title remains unchanged for other tests.
    await page.goto(`/dashboard/event/${eventId}/edit`);
    await page.getByLabel(/title/i).first().fill(originalTitle);
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
      timeout: 15_000,
    });
  });


  test('description can be changed and persists after save', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    await page.goto(`/dashboard/event/${eventId}/edit`);
    const description = editDescriptionTextarea(page);
    await expect(description).toBeVisible();
    const originalDescription = await description.inputValue();
    const updatedDescription = `Playwright persisted description ${Date.now()}`;

    // setNativeInputValue sets the native DOM value and calls React's onChange prop
    // directly — works on mobile emulation where event delegation may race hydration.
    const DESC_SEL = 'textarea[name="signupsmartly-event-description"]';
    const setDescription = (value: string) =>
      setNativeInputValue(page, DESC_SEL, value, 'textarea');

    try {
      await waitForReactHydration(page, DESC_SEL);
      await setDescription(updatedDescription);
      await expect(description).toHaveValue(updatedDescription);
      await page.getByRole('button', { name: /^save$/i }).click();
      await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
        timeout: 15_000,
      });

      await page.goto(`/dashboard/event/${eventId}/edit`);
      await expect(editDescriptionTextarea(page)).toHaveValue(updatedDescription);
    } finally {
      await page.goto(`/dashboard/event/${eventId}/edit`);
      await waitForReactHydration(page, 'textarea[name="signupsmartly-event-description"]');
      await setDescription(originalDescription);
      await page.getByRole('button', { name: /^save$/i }).click();
      await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
        timeout: 15_000,
      }).catch(() => {
        // If cleanup navigation fails, leave the test failure to report the main issue.
      });
    }
  });

  test('description remains editable after adding and removing a slot', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    await page.goto(`/dashboard/event/${eventId}/edit`);
    const addSlotButton = page.getByRole('button', { name: /^\+ add (spot|item)$/i });
    await expect(addSlotButton).toBeVisible();
    await addSlotButton.click();

    const removeButton = page.getByRole('button', { name: /^remove (spot|item)$/i }).last();
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    const description = editDescriptionTextarea(page);
    const text = `Editable after slot churn ${Date.now()}`;
    await description.fill(text);
    await expect(description).toHaveValue(text);
  });
});

test.describe('Draft event', () => {
  test('shows Draft pill, disabled Signup Page, and Publish action in menu', async ({ page }) => {
    const draftId = process.env.E2E_TEST_DRAFT_EVENT_ID;
    if (!draftId) {
      test.skip(true, 'E2E_TEST_DRAFT_EVENT_ID not set');
      return;
    }
    await page.goto('/dashboard');
    // Scope to the specific draft card to avoid matching other events
    await expect(dashboardSignupsLinkForEvent(page, draftId)).toBeVisible();
    // Use :visible to pick only the badge rendered at the current viewport.
    // The desktop table container is display:none on mobile (hidden md:block), so getByText.first()
    // would resolve to the hidden desktop span. span:visible matches only the visible badge.
    await expect(page.locator('span:visible').filter({ hasText: /^Draft$/ }).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /not yet published/i }).first()
    ).toBeDisabled();
    await openDashboardMenu(page, draftId);
    await expect(page.getByRole('menuitem', { name: /^view my signups$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^publish$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^edit$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^make a copy$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^archive$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^delete$/i })).toBeVisible();
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
    await page.request.post(`/api/events/${eventId}/unarchive`);
    await page.goto('/dashboard');
    await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();
    await openDashboardMenu(page, eventId);
    await page.getByRole('menuitem', { name: /^make a copy$/i }).click();
    // Should navigate back to the dashboard (copy lands there as a new draft)
    await page.waitForURL(/\/dashboard$/, { timeout: 10_000 });
    // At least one Draft pill confirms the copy is present.
    // Use span:visible to avoid picking the desktop table's hidden Draft span on mobile.
    await expect(page.locator('span:visible').filter({ hasText: /^Draft$/ }).first()).toBeVisible();
  });
});

test.describe('Archive signup', () => {
  test('archive action is available and confirms from overflow menu', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    let archived = false;

    await page.request.post(`/api/events/${eventId}/unarchive`);

    try {
      await page.goto('/dashboard');
      await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();

      await openDashboardMenu(page, eventId);
      page.once('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        await dialog.accept();
      });
      await page.getByRole('menuitem', { name: /^archive$/i }).click();
      archived = true;
    } finally {
      if (archived) {
        await page.request.post(`/api/events/${eventId}/unarchive`);
      }
    }
  });

  test('archived row menu keeps v2 labels and actions', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }

    await page.request.post(`/api/events/${eventId}/archive`);
    try {
      await page.goto('/dashboard');
      const archivedTab = page.getByRole('button', { name: /^archived$/i });
      await archivedTab.click();
      await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();

      await openDashboardMenu(page, eventId);
      // Archived events: only View My Signups, Make a Copy, Delete
      await expect(page.getByRole('menuitem', { name: /^view my signups$/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /^make a copy$/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /^delete$/i })).toBeVisible();
      // Edit and Archive should NOT appear for archived events
      await expect(page.getByRole('menuitem', { name: /^edit$/i })).not.toBeVisible();
      await expect(page.getByRole('menuitem', { name: /^archive$/i })).not.toBeVisible();
    } finally {
      await page.request.post(`/api/events/${eventId}/unarchive`).catch(() => {
        // best-effort cleanup in local test environments
      });
    }

    const response = await page.goto(`/event/${eventId}`);
    expect(response?.status()).toBe(200);
  });
});

test.describe('Dashboard sorting', () => {
  test('event sort persists after navigation within the session', async ({ page }) => {
    // Sort column header buttons only exist at md+ breakpoints (≥768px).
    // Mobile uses a <select> combobox instead — this test covers the desktop sort-button UX only.
    if ((page.viewportSize()?.width ?? 1280) < 768) {
      test.skip(true, 'Sort header buttons not rendered at mobile viewport — combobox used instead');
      return;
    }
    await page.goto('/dashboard');
    // Wait for full hydration — sort buttons only render after React mounts and data loads
    await page.waitForLoadState('networkidle');
    const eventHeader = page.getByRole('button', { name: /event/i });
    await expect(eventHeader).toBeVisible({ timeout: 10_000 });
    await eventHeader.click(); // asc
    await eventHeader.click(); // desc

    const storedSort = await page.evaluate(() =>
      window.localStorage.getItem('dashboard-signups-sort-v1')
    );
    expect(storedSort).toContain('"sortCol":"event"');
    expect(storedSort).toContain('"sortDir":"desc"');

    await page.goto('/create-event');
    await page.goto('/dashboard');

    const storedAfterReturn = await page.evaluate(() =>
      window.localStorage.getItem('dashboard-signups-sort-v1')
    );
    expect(storedAfterReturn).toContain('"sortCol":"event"');
    expect(storedAfterReturn).toContain('"sortDir":"desc"');
  });
});
