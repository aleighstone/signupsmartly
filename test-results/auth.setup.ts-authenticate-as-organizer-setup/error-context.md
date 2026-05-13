# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate as organizer
- Location: e2e/auth.setup.ts:16:6

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "SignupSmartly" [ref=e5] [cursor=pointer]:
        - /url: /
        - img [ref=e6]
        - text: SignupSmartly
      - heading "Sign in" [level=1] [ref=e7]
      - paragraph [ref=e8]: Sign in to manage your events
    - generic [ref=e9]:
      - paragraph [ref=e10]: Failed to fetch
      - button "Continue with Google" [ref=e11] [cursor=pointer]:
        - img [ref=e12]
        - text: Continue with Google
      - generic [ref=e19]: or
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Email
          - textbox "Email" [ref=e24]: allisonleighstone@gmail.com
        - generic [ref=e25]:
          - generic [ref=e26]: Password
          - textbox "Password" [ref=e27]: Events123!
        - button "Sign in" [ref=e28] [cursor=pointer]
    - generic [ref=e29]:
      - paragraph [ref=e30]:
        - text: Forgot password?
        - link "Request a sign in link" [ref=e31] [cursor=pointer]:
          - /url: /login/request-link
      - paragraph [ref=e32]:
        - text: Don't have an account?
        - link "Sign up" [ref=e33] [cursor=pointer]:
          - /url: /signup
  - alert [ref=e34]
```

# Test source

```ts
  1  | /**
  2  |  * Auth setup — runs once before all organizer tests.
  3  |  * Logs in via the UI and saves the session to e2e/.auth/organizer.json
  4  |  * so individual tests don't need to log in themselves.
  5  |  *
  6  |  * Credentials come from environment variables — set these in .env.local:
  7  |  *   E2E_ORGANIZER_EMAIL=your@email.com
  8  |  *   E2E_ORGANIZER_PASSWORD=yourpassword
  9  |  */
  10 | 
  11 | import { test as setup, expect } from '@playwright/test';
  12 | import path from 'path';
  13 | 
  14 | const AUTH_FILE = path.join(__dirname, '.auth/organizer.json');
  15 | 
  16 | setup('authenticate as organizer', async ({ page }) => {
  17 |   const email = process.env.E2E_ORGANIZER_EMAIL;
  18 |   const password = process.env.E2E_ORGANIZER_PASSWORD;
  19 | 
  20 |   if (!email || !password) {
  21 |     throw new Error(
  22 |       'E2E_ORGANIZER_EMAIL and E2E_ORGANIZER_PASSWORD must be set in .env.local'
  23 |     );
  24 |   }
  25 | 
  26 |   await page.goto('/login');
  27 |   await page.getByLabel(/email/i).fill(email);
  28 |   await page.getByLabel(/password/i).fill(password);
  29 |   await page.getByRole('button', { name: /sign in/i }).click();
  30 | 
  31 |   // Wait until we land on the dashboard
> 32 |   await page.waitForURL('**/dashboard', { timeout: 10_000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  33 |   await expect(page.getByText('Your Signups')).toBeVisible();
  34 | 
  35 |   // Save auth state for reuse
  36 |   await page.context().storageState({ path: AUTH_FILE });
  37 | });
  38 | 
```