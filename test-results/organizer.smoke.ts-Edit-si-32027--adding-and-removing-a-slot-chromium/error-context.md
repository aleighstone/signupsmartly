# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: organizer.smoke.ts >> Edit signup page >> description remains editable after adding and removing a slot
- Location: e2e/organizer.smoke.ts:366:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /^\+ add (spot|item)$/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /^\+ add (spot|item)$/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "This page could not be found." [level=2] [ref=e6]
  - alert [ref=e7]
```

# Test source

```ts
  275 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  276 |     if (!eventId) {
  277 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  278 |       return;
  279 |     }
  280 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  281 |     await page.getByLabel(/title/i).first().fill('Playwright Cancel Test');
  282 |     await page.getByRole('button', { name: /← back to signups/i }).click();
  283 |     // Close via Escape key (backdrop button is obscured by the modal card)
  284 |     await page.keyboard.press('Escape');
  285 |     await expect(page).toHaveURL(/edit/);
  286 |     await expect(page.getByRole('dialog')).not.toBeVisible();
  287 |   });
  288 | 
  289 |   test('saving edits updates existing signup without creating duplicates', async ({ page }) => {
  290 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  291 |     if (!eventId) {
  292 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  293 |       return;
  294 |     }
  295 | 
  296 |     await page.goto('/dashboard');
  297 |     const dashboardCardsBefore = await page
  298 |       .locator('button[aria-label="More actions for this signup"]:visible')
  299 |       .count();
  300 | 
  301 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  302 |     const titleInput = page.getByLabel(/title/i).first();
  303 |     const originalTitle = (await titleInput.inputValue()).trim();
  304 |     const editedTitle = `${originalTitle} (Playwright edit)`;
  305 | 
  306 |     await titleInput.fill(editedTitle);
  307 |     await page.getByRole('button', { name: /^save$/i }).click();
  308 |     await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
  309 |       timeout: 15_000,
  310 |     });
  311 | 
  312 |     await page.goto('/dashboard');
  313 |     const dashboardCardsAfterSave = await page
  314 |       .locator('button[aria-label="More actions for this signup"]:visible')
  315 |       .count();
  316 |     expect(dashboardCardsAfterSave).toBe(dashboardCardsBefore);
  317 |     await expect(
  318 |       page.locator(`a[href*="/dashboard/event/${eventId}/signups"]:visible`)
  319 |     ).toHaveCount(1);
  320 | 
  321 |     // Cleanup so the shared seeded event title remains unchanged for other tests.
  322 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  323 |     await page.getByLabel(/title/i).first().fill(originalTitle);
  324 |     await page.getByRole('button', { name: /^save$/i }).click();
  325 |     await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
  326 |       timeout: 15_000,
  327 |     });
  328 |   });
  329 | 
  330 | 
  331 |   test('description can be changed and persists after save', async ({ page }) => {
  332 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  333 |     if (!eventId) {
  334 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  335 |       return;
  336 |     }
  337 | 
  338 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  339 |     const description = editDescriptionTextarea(page);
  340 |     await expect(description).toBeVisible();
  341 |     const originalDescription = await description.inputValue();
  342 |     const updatedDescription = `Playwright persisted description ${Date.now()}`;
  343 | 
  344 |     try {
  345 |       await description.fill(updatedDescription);
  346 |       await expect(description).toHaveValue(updatedDescription);
  347 |       await page.getByRole('button', { name: /^save$/i }).click();
  348 |       await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
  349 |         timeout: 15_000,
  350 |       });
  351 | 
  352 |       await page.goto(`/dashboard/event/${eventId}/edit`);
  353 |       await expect(editDescriptionTextarea(page)).toHaveValue(updatedDescription);
  354 |     } finally {
  355 |       await page.goto(`/dashboard/event/${eventId}/edit`);
  356 |       await editDescriptionTextarea(page).fill(originalDescription);
  357 |       await page.getByRole('button', { name: /^save$/i }).click();
  358 |       await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), {
  359 |         timeout: 15_000,
  360 |       }).catch(() => {
  361 |         // If cleanup navigation fails, leave the test failure to report the main issue.
  362 |       });
  363 |     }
  364 |   });
  365 | 
  366 |   test('description remains editable after adding and removing a slot', async ({ page }) => {
  367 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  368 |     if (!eventId) {
  369 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  370 |       return;
  371 |     }
  372 | 
  373 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  374 |     const addSlotButton = page.getByRole('button', { name: /^\+ add (spot|item)$/i });
> 375 |     await expect(addSlotButton).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  376 |     await addSlotButton.click();
  377 | 
  378 |     const removeButton = page.getByRole('button', { name: /^remove (spot|item)$/i }).last();
  379 |     await expect(removeButton).toBeVisible();
  380 |     await removeButton.click();
  381 | 
  382 |     const description = editDescriptionTextarea(page);
  383 |     const text = `Editable after slot churn ${Date.now()}`;
  384 |     await description.fill(text);
  385 |     await expect(description).toHaveValue(text);
  386 |   });
  387 | });
  388 | 
  389 | test.describe('Draft event', () => {
  390 |   test('shows Draft pill, disabled Signup Page, and Publish action in menu', async ({ page }) => {
  391 |     const draftId = process.env.E2E_TEST_DRAFT_EVENT_ID;
  392 |     if (!draftId) {
  393 |       test.skip(true, 'E2E_TEST_DRAFT_EVENT_ID not set');
  394 |       return;
  395 |     }
  396 |     await page.goto('/dashboard');
  397 |     // Scope to the specific draft card to avoid matching other events
  398 |     await expect(dashboardSignupsLinkForEvent(page, draftId)).toBeVisible();
  399 |     await expect(page.getByText('Draft').first()).toBeVisible();
  400 |     await expect(
  401 |       page.getByRole('button', { name: /not yet published/i }).first()
  402 |     ).toBeDisabled();
  403 |     await dashboardMenuButtonForEvent(page, draftId).click();
  404 |     await expect(page.getByRole('menuitem', { name: /^publish$/i })).toBeVisible();
  405 |     await expect(page.getByRole('menuitem', { name: /^edit signup$/i })).toBeVisible();
  406 |     await expect(page.getByRole('menuitem', { name: /^copy signup$/i })).toBeVisible();
  407 |     await expect(page.getByRole('menuitem', { name: /^view my signups$/i })).toBeVisible();
  408 |     await expect(page.getByRole('menuitem', { name: /^archive$/i })).toBeVisible();
  409 |     await expect(page.getByRole('menuitem', { name: /^delete$/i })).toBeVisible();
  410 |   });
  411 | 
  412 |   test('shows draft banner and Publish button on edit page', async ({ page }) => {
  413 |     const draftId = process.env.E2E_TEST_DRAFT_EVENT_ID;
  414 |     if (!draftId) {
  415 |       test.skip(true, 'E2E_TEST_DRAFT_EVENT_ID not set');
  416 |       return;
  417 |     }
  418 |     await page.goto(`/dashboard/event/${draftId}/edit`);
  419 |     await expect(page.getByText(/this signup is not live yet/i)).toBeVisible();
  420 |     await expect(page.getByRole('button', { name: /^publish$/i })).toBeVisible();
  421 |   });
  422 | });
  423 | 
  424 | test.describe('Copy signup', () => {
  425 |   test('copy from three-dot menu lands on edit page of new draft', async ({ page }) => {
  426 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  427 |     if (!eventId) {
  428 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  429 |       return;
  430 |     }
  431 |     await page.request.post(`/api/events/${eventId}/unarchive`);
  432 |     await page.goto('/dashboard');
  433 |     await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();
  434 |     await dashboardMenuButtonForEvent(page, eventId).click();
  435 |     await page.getByRole('menuitem', { name: /^copy signup$/i }).click();
  436 |     // Should navigate to edit page of the new draft copy
  437 |     await page.waitForURL(/\/dashboard\/event\/.+\/edit/, { timeout: 10_000 });
  438 |     // Draft banner confirms the copy started as a draft
  439 |     await expect(page.getByText(/this signup is not live yet/i)).toBeVisible();
  440 |   });
  441 | });
  442 | 
  443 | test.describe('Archive signup', () => {
  444 |   test('archive action is available and confirms from overflow menu', async ({ page }) => {
  445 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  446 |     if (!eventId) {
  447 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  448 |       return;
  449 |     }
  450 | 
  451 |     let archived = false;
  452 | 
  453 |     await page.request.post(`/api/events/${eventId}/unarchive`);
  454 | 
  455 |     try {
  456 |       await page.goto('/dashboard');
  457 |       await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();
  458 | 
  459 |       await dashboardMenuButtonForEvent(page, eventId).click();
  460 |       page.once('dialog', async (dialog) => {
  461 |         expect(dialog.type()).toBe('confirm');
  462 |         await dialog.accept();
  463 |       });
  464 |       await page.getByRole('menuitem', { name: /^archive$/i }).click();
  465 |       archived = true;
  466 |     } finally {
  467 |       if (archived) {
  468 |         await page.request.post(`/api/events/${eventId}/unarchive`);
  469 |       }
  470 |     }
  471 |   });
  472 | 
  473 |   test('archived row menu keeps v2 labels and actions', async ({ page }) => {
  474 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  475 |     if (!eventId) {
```