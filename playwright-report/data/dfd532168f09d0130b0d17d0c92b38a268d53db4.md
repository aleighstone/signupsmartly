# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: organizer.smoke.ts >> Create signup flow >> can save a draft after switching signup types with a description
- Location: e2e/organizer.smoke.ts:160:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('dialog')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "SignupSmartly home" [ref=e5] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e6]
          - generic [ref=e7]: SignupSmartly
        - generic [ref=e8]:
          - link "Create Signup" [ref=e9] [cursor=pointer]:
            - /url: /create-event
            - generic [ref=e10]: Create Signup
          - button "Open menu" [ref=e12] [cursor=pointer]:
            - img [ref=e13]
    - main [ref=e14]:
      - generic [ref=e15]:
        - button "← Back to Dashboard" [ref=e17] [cursor=pointer]
        - heading "Create Signup" [level=1] [ref=e18]
        - generic [ref=e19]:
          - generic [ref=e20]: I want to
          - combobox "Signup type" [ref=e21]:
            - option "organize by schedule"
            - option "request items in a simple list" [selected]
            - option "create an availability poll"
          - button "Help" [ref=e22] [cursor=pointer]:
            - generic [ref=e23]: "?"
        - generic [ref=e24]:
          - generic [ref=e25]:
            - heading "Signup Details" [level=2] [ref=e26]
            - generic [ref=e27]:
              - generic [ref=e28]:
                - generic [ref=e29]: Title *
                - textbox "Potluck items" [active] [ref=e30]
                - paragraph [ref=e31]: Title required
              - generic [ref=e32]:
                - generic [ref=e33]: Description
                - generic [ref=e34]:
                  - tablist "Editor mode" [ref=e35]:
                    - tab "Write" [selected] [ref=e36] [cursor=pointer]
                    - tab "Preview" [ref=e37] [cursor=pointer]
                  - generic [ref=e38]:
                    - button "B" [ref=e39] [cursor=pointer]
                    - button "I" [ref=e40] [cursor=pointer]
                    - button "Link" [ref=e41] [cursor=pointer]
                  - textbox "Description" [ref=e43]:
                    - /placeholder: optional
                    - text: Description entered after switching to simple list
              - generic [ref=e44]:
                - generic [ref=e45]: Location
                - textbox "optional" [ref=e46]
              - generic [ref=e47]:
                - generic [ref=e48]: Date (optional)
                - textbox [ref=e49]
              - generic [ref=e51] [cursor=pointer]:
                - checkbox "Display signup names and comments. Turn off for anonymous signups." [checked] [ref=e52]
                - generic [ref=e53]:
                  - generic [ref=e54]: Display signup names and comments.
                  - generic [ref=e55]: Turn off for anonymous signups.
          - generic [ref=e56]:
            - heading "Items" [level=2] [ref=e57]
            - generic [ref=e59]:
              - generic [ref=e61]: Item 1
              - generic [ref=e62]:
                - generic [ref=e63]: Item name *
                - textbox "Entree" [ref=e64]: Test item
              - generic [ref=e65]:
                - generic [ref=e66]: Need *
                - spinbutton [ref=e67]: "1"
              - generic [ref=e68]:
                - generic [ref=e69]: Description (optional)
                - generic [ref=e70]:
                  - tablist "Editor mode" [ref=e71]:
                    - tab "Write" [selected] [ref=e72] [cursor=pointer]
                    - tab "Preview" [ref=e73] [cursor=pointer]
                  - generic [ref=e74]:
                    - button "B" [ref=e75] [cursor=pointer]
                    - button "I" [ref=e76] [cursor=pointer]
                    - button "Link" [ref=e77] [cursor=pointer]
                  - generic [ref=e78]:
                    - textbox "optional" [ref=e79]
                    - generic: 0 / 800
              - generic [ref=e80]:
                - generic [ref=e81]: Signup settings for this item
                - generic [ref=e83] [cursor=pointer]:
                  - checkbox "Require a comment response when signing up" [ref=e84]
                  - generic [ref=e85]: Require a comment response when signing up
                - generic [ref=e86]:
                  - generic [ref=e87]: Customize the title of the comment field (max 60 characters).
                  - textbox "Customize the title of the comment field (max 60 characters)." [ref=e88]:
                    - /placeholder: Comment
                    - text: Playwright Switch Description Draft 1778705582177
            - button "+ Add item" [ref=e89] [cursor=pointer]
          - group [ref=e90]:
            - generic "Customize appearance Color & font" [ref=e91] [cursor=pointer]:
              - generic [ref=e92]: Customize appearance
              - generic [ref=e93]:
                - generic [ref=e94]: Color & font
                - img [ref=e95]
          - generic [ref=e97]:
            - button "Publish" [ref=e98] [cursor=pointer]
            - button "Save as Draft" [ref=e99] [cursor=pointer]
  - alert [ref=e100]
```

# Test source

```ts
  72  |     const bottomIsMenu = await page.evaluate(({ x, y }) => {
  73  |       const element = document.elementFromPoint(x, y);
  74  |       return Boolean(element?.closest('[role="menu"]'));
  75  |     }, {
  76  |       x: box!.x + 12,
  77  |       y: box!.y + box!.height - 6,
  78  |     });
  79  |     expect(bottomIsMenu).toBe(true);
  80  |   });
  81  | 
  82  |   test('event row actions navigate to edit and signups pages', async ({ page }) => {
  83  |     const eventId = process.env.E2E_TEST_EVENT_ID;
  84  |     if (!eventId) {
  85  |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  86  |       return;
  87  |     }
  88  | 
  89  |     await page.goto('/dashboard');
  90  |     await expect(dashboardSignupsLinkForEvent(page, eventId)).toBeVisible();
  91  |     await dashboardEventRow(page, eventId)
  92  |       .getByRole('link', { name: /edit signup/i })
  93  |       .click();
  94  |     await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/edit`), { timeout: 10_000 });
  95  | 
  96  |     await page.goto('/dashboard');
  97  |     await dashboardSignupsLinkForEvent(page, eventId).click();
  98  |     await page.waitForURL(new RegExp(`/dashboard/event/${eventId}/signups`), { timeout: 10_000 });
  99  |   });
  100 | });
  101 | 
  102 | test.describe('Create signup flow', () => {
  103 |   test('can load create form', async ({ page }) => {
  104 |     await page.goto('/create-event');
  105 |     await expect(page.getByText(/I want to/i)).toBeVisible();
  106 |     // Both submit buttons present
  107 |     await expect(page.getByRole('button', { name: /^publish$/i })).toBeVisible();
  108 |     await expect(page.getByRole('button', { name: /save as draft/i })).toBeVisible();
  109 |   });
  110 | 
  111 |   test('back button on pristine form navigates immediately', async ({ page }) => {
  112 |     await page.goto('/create-event');
  113 |     await page.getByRole('button', { name: /← back to dashboard/i }).click();
  114 |     await expect(page).toHaveURL(/\/dashboard/);
  115 |   });
  116 | 
  117 |   test('back button on dirty form shows unsaved changes modal', async ({ page }) => {
  118 |     await page.goto('/create-event');
  119 |     // Type something to make the form dirty
  120 |     await page.getByPlaceholder(/falcons track meet/i).fill('Test event title');
  121 |     await page.getByRole('button', { name: /← back to dashboard/i }).click();
  122 |     // Modal should appear
  123 |     await expect(page.getByText(/unsaved changes/i)).toBeVisible();
  124 |     await expect(page.getByRole('button', { name: /discard/i })).toBeVisible();
  125 |   });
  126 | 
  127 |   test('unsaved changes modal discard navigates to dashboard', async ({ page }) => {
  128 |     await page.goto('/create-event');
  129 |     await page.getByPlaceholder(/falcons track meet/i).fill('Test event title');
  130 |     await page.getByRole('button', { name: /← back to dashboard/i }).click();
  131 |     await page.getByRole('button', { name: /discard/i }).click();
  132 |     await expect(page).toHaveURL(/\/dashboard/);
  133 |   });
  134 | 
  135 | 
  136 |   test('description remains editable after switching signup types', async ({ page }) => {
  137 |     await page.goto('/create-event');
  138 | 
  139 |     const scheduledFirst = 'Scheduled description before switch';
  140 |     const simpleEdit = 'Scheduled description before switch plus simple edit';
  141 |     const scheduledFinal = 'Final create description after switching twice';
  142 | 
  143 |     await expect(createDescriptionTextarea(page, 'scheduled')).toBeVisible();
  144 |     await createDescriptionTextarea(page, 'scheduled').fill(scheduledFirst);
  145 |     await expect(createDescriptionTextarea(page, 'scheduled')).toHaveValue(scheduledFirst);
  146 | 
  147 |     await signupTypeSelect(page).selectOption('simple');
  148 |     await expect(createDescriptionTextarea(page, 'simple')).toBeVisible();
  149 |     await expect(createDescriptionTextarea(page, 'simple')).toHaveValue(scheduledFirst);
  150 |     await createDescriptionTextarea(page, 'simple').fill(simpleEdit);
  151 |     await expect(createDescriptionTextarea(page, 'simple')).toHaveValue(simpleEdit);
  152 | 
  153 |     await signupTypeSelect(page).selectOption('scheduled');
  154 |     await expect(createDescriptionTextarea(page, 'scheduled')).toBeVisible();
  155 |     await expect(createDescriptionTextarea(page, 'scheduled')).toHaveValue(simpleEdit);
  156 |     await createDescriptionTextarea(page, 'scheduled').fill(scheduledFinal);
  157 |     await expect(createDescriptionTextarea(page, 'scheduled')).toHaveValue(scheduledFinal);
  158 |   });
  159 | 
  160 |   test('can save a draft after switching signup types with a description', async ({ page }) => {
  161 |     const title = `Playwright Switch Description Draft ${Date.now()}`;
  162 |     const description = 'Description entered after switching to simple list';
  163 | 
  164 |     await page.goto('/create-event');
  165 |     await createDescriptionTextarea(page, 'scheduled').fill('Initial scheduled description');
  166 |     await signupTypeSelect(page).selectOption('simple');
  167 |     await createDescriptionTextarea(page, 'simple').fill(description);
  168 |     await page.getByLabel(/title/i).first().fill(title);
  169 |     await page.getByPlaceholder(/entree/i).first().fill('Test item');
  170 |     await page.getByRole('button', { name: /save as draft/i }).click();
  171 | 
> 172 |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
      |                                            ^ Error: expect(locator).toBeVisible() failed
  173 |     await expect(page.getByRole('heading', { name: new RegExp(`${title} created!`, 'i') })).toBeVisible();
  174 |     await page.getByRole('button', { name: /no, i.?m good/i }).click();
  175 |     await page.waitForURL(/dashboard/, { timeout: 15_000 });
  176 |     await expect(page.getByText(title)).toBeVisible();
  177 |   });
  178 | });
  179 | 
  180 | test.describe('Draft mode', () => {
  181 |   test('save as draft creates a draft event on dashboard', async ({ page }) => {
  182 |     await page.goto('/create-event');
  183 | 
  184 |     // Fill minimum required fields for a simple list
  185 |     await page.getByRole('combobox').selectOption('simple');
  186 |     await page.getByLabel(/title/i).first().fill('Playwright Draft Test');
  187 |     // Item name (simple list)
  188 |     await page.getByPlaceholder(/entree/i).first().fill('Test item');
  189 | 
  190 |     // Save as draft
  191 |     await page.getByRole('button', { name: /save as draft/i }).click();
  192 | 
  193 |     // Should end up on dashboard (via post-creation modal → No, I'm good)
  194 |     // or navigate to dashboard directly after modal
  195 |     // Wait for either the modal or the dashboard
  196 |     await page.waitForURL(/dashboard|create-event/, { timeout: 15_000 });
  197 | 
  198 |     // Navigate to dashboard and verify at least one Draft pill appears
  199 |     await page.goto('/dashboard');
  200 |     await expect(page.getByText('Draft').first()).toBeVisible();
  201 |   });
  202 | });
  203 | 
  204 | test.describe('View My Signups page', () => {
  205 |   test('loads for a known event with header actions and notifications control', async ({ page }) => {
  206 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  207 |     if (!eventId) {
  208 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  209 |       return;
  210 |     }
  211 |     await page.goto(`/dashboard/event/${eventId}/signups`);
  212 |     await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
  213 |     await expect(page.getByRole('button', { name: /copy signup url/i })).toBeVisible();
  214 |     await expect(page.getByRole('link', { name: /edit event/i })).toBeVisible();
  215 |     await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
  216 |     await expect(page.getByText(/coverage/i).first()).toBeVisible();
  217 |     await expect(page.getByRole('table')).toBeVisible();
  218 |     await expect(page.getByText(/notifications for this event:/i)).toBeVisible();
  219 |     await expect(page.locator('#event-notification-override')).toBeVisible();
  220 |   });
  221 | 
  222 |   test('export dropdown shows expected menu items', async ({ page }) => {
  223 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  224 |     if (!eventId) {
  225 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  226 |       return;
  227 |     }
  228 |     await page.goto(`/dashboard/event/${eventId}/signups`);
  229 |     await page.getByRole('button', { name: /^export$/i }).click();
  230 |     await expect(page.getByRole('menuitem', { name: /^export csv$/i })).toBeVisible();
  231 |     await expect(page.getByRole('menuitem', { name: /^export list$/i })).toBeVisible();
  232 |     await expect(page.getByRole('menuitem', { name: /^print$/i })).toBeVisible();
  233 |   });
  234 | });
  235 | 
  236 | test.describe('Edit signup page', () => {
  237 |   test('back button on pristine edit form navigates immediately', async ({ page }) => {
  238 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  239 |     if (!eventId) {
  240 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  241 |       return;
  242 |     }
  243 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  244 |     await page.getByRole('button', { name: /← back to signups/i }).click();
  245 |     await expect(page).toHaveURL(/signups/);
  246 |   });
  247 | 
  248 |   test('back button on dirty edit form shows unsaved changes modal', async ({ page }) => {
  249 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  250 |     if (!eventId) {
  251 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  252 |       return;
  253 |     }
  254 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  255 |     await page.getByLabel(/title/i).first().fill('Playwright Dirty Edit Test');
  256 |     await page.getByRole('button', { name: /← back to signups/i }).click();
  257 |     await expect(page.getByRole('dialog')).toBeVisible();
  258 |     await expect(page.getByText(/unsaved changes/i)).toBeVisible();
  259 |   });
  260 | 
  261 |   test('unsaved changes modal discard navigates away from edit', async ({ page }) => {
  262 |     const eventId = process.env.E2E_TEST_EVENT_ID;
  263 |     if (!eventId) {
  264 |       test.skip(true, 'E2E_TEST_EVENT_ID not set');
  265 |       return;
  266 |     }
  267 |     await page.goto(`/dashboard/event/${eventId}/edit`);
  268 |     await page.getByLabel(/title/i).first().fill('Playwright Discard Test');
  269 |     await page.getByRole('button', { name: /← back to signups/i }).click();
  270 |     await page.getByRole('dialog').getByRole('button', { name: /discard/i }).click();
  271 |     await expect(page).toHaveURL(/signups/);
  272 |   });
```