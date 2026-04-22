# Dev Log

---

## 2026-04-22

### Shipped

| What | File(s) | Status |
|---|---|---|
| Fix cron: accept GET requests from Vercel scheduler | `app/api/reminders/process/route.ts` | deployed |
| Organizer smoke tests: draft, unsaved changes, copy signup | `e2e/organizer.smoke.ts`, `playwright.config.ts` | deployed |
| Playwright config: explicit testMatch for chromium project | `playwright.config.ts` | deployed |
| AGENTS.md: remind user to start supabase + dev server before tests | `AGENTS.md` | deployed |
| Reminder timing options: 1 week before + 3 days before | `components/SignupModal.tsx`, `app/api/reminders/process/route.ts` | deployed |
| Confirmation email: event name links to signup page | `lib/email.ts` | deployed |
| What's New page updated with above two features | `data/changelog.ts` | deployed |

### Backlog

| Item | Notes |
|---|---|
| Publish a draft from dashboard — E2E test | Publish button exists, no test that verifies it actually goes live |
| Clean up orphan draft events after test runs | Each test run leaves drafts in local DB — consider a teardown step |

### Lessons

| What happened | Fix / note |
|---|---|
| Cron was sending GET but route only handled POST | Add `export async function GET` that delegates to POST |
| Playwright strict mode failed on multiple "Draft" pills | Use `.first()` when testing "at least one exists" |
| Backdrop button intercepted by modal card | Use `page.keyboard.press('Escape')` instead of clicking backdrop |
| `chromium` project ran only auth setup, no tests | Add explicit `testMatch: /organizer\.smoke\.ts/` to chromium project |
| Tests ran without dev server — user had to cancel and restart | Always remind: supabase start + npm run dev before any test command |

### Resume here

> Next session: nothing urgent. Either tackle the backlog items above or start a new feature.

---

## 2026-04-20

### Shipped

| What | File(s) | Status |
|---|---|---|
| Playwright E2E smoke suite | `e2e/auth.setup.ts`, `organizer.smoke.ts`, `volunteer.smoke.ts`, `playwright.config.ts` | committed |
| Fix: modal selector in volunteer tests | `e2e/volunteer.smoke.ts` | committed |
| Fix: submit button scoped to dialog | `e2e/volunteer.smoke.ts` | committed |
| Local user setup script | `scripts/setup-local-user.ts` | committed |
| Local dev cheat sheet | `LOCAL_DEV_GUIDE.docx` | committed |
| Dev log + AGENTS.md update | `DEV_LOG.md`, `AGENTS.md` | committed |

### Backlog

| Item | Notes |
|---|---|
| Draft mode / copy signup | Spec written. Ship status unconfirmed — check git log |
| Unsaved changes modal | Spec written. Ship status unconfirmed — check git log |
| `FOUNDER_DIGEST_EMAIL` | Add to Vercel env vars |
| `E2E_TEST_DRAFT_EVENT_ID` | Add to `.env.local` to enable skipped draft visibility test |

### Tests still needed

| Test case | Risk |
|---|---|
| Slot count decrements after signup | high |
| Duplicate email signup rejected | high |
| Published visible / draft returns 404 | high |
| Cancel signup from organizer table | medium |
| Cancel link on confirmation page | medium |

### Lessons

| What happened | Fix / note |
|---|---|
| Local auth worked but app showed nothing | User row existed but org_members row was missing |
| Playwright ignored `.env.local` | Add `dotenv` call explicitly in `playwright.config.ts` |
| Submit button clicked wrong element | Always scope to `getByRole('dialog')` before querying inside modals |

---
