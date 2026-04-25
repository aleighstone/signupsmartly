# Dev Log

---

## 2026-04-24

### Shipped

| What | File(s) | Status |
|---|---|---|
| Design system: Inter for headings, Quicksand display-only, Lucide icons | `app/globals.css`, `components/AppNav.tsx`, `components/EventCard.tsx`, `components/CoverageMeter.tsx`, `components/SlotList.tsx` | deployed |
| Seed script: relative dates, stable draft event, prints env IDs at end | `scripts/seed-demo-events.ts` | deployed |
| Local dev reset workflow: admin API auth user creation (no hardcoded UUID) | `scripts/setup-local-user.ts` | deployed |
| New cleanup script: deletes Playwright orphan draft events | `scripts/cleanup-test-data.ts` | deployed |
| Playwright fix: strict mode violation on "Draft" text in draft card test | `e2e/organizer.smoke.ts` | deployed |
| Style guide: typography updated to reflect display/heading split | `public/styleguide/index.html` | deployed |
| EventHeader: date/location match slot card time/name styles (charcoal, not muted) | `components/EventHeader.tsx` | deployed |
| Visual hierarchy spec written for Cursor | `specs/signup-page-visual-hierarchy-spec.md` | committed |
| Signup page visual hierarchy: date/time hero layout for single vs multi-date events | `lib/calendar.ts`, `components/SlotList.tsx` | deployed |
| Multi-day signup shortcut: “Go to future spots” link | `components/SlotList.tsx`, `e2e/volunteer.smoke.ts`, `data/changelog.ts` | deployed |
| Archive feature: dashboard Active/Archived tabs, archive/unarchive API, public 404 guard, reminder skip | `components/EventCard.tsx`, `components/DashboardEventList.tsx`, `app/dashboard/page.tsx`, `app/api/events/[id]/archive/route.ts`, `app/api/events/[id]/unarchive/route.ts`, `app/event/[id]/page.tsx`, `app/api/reminders/process/route.ts`, `lib/db.ts`, `supabase/migrations/20260424173000_add_event_archived.sql` | built; pending SQL + deploy |

### Backlog

| Item | Notes |
|---|---|
| ~~Implement visual hierarchy spec~~ | shipped |
| ~~Set `E2E_TEST_MULTI_DATE_EVENT_ID` in `.env.local`~~ | Done; production test event ID available for preview/prod testing |
| Apply archive migration to production | Run `supabase/migrations/20260424173000_add_event_archived.sql` in Supabase SQL Editor before deploying archive code |
| Publish a draft from dashboard — E2E test | Publish button exists, no test that verifies it goes live |

### Lessons

| What happened | Fix / note |
|---|---|
| `supabase db reset` wipes `auth.users` — login broke after reset | Use `supabase.auth.admin.createUser` in setup-local-user.ts; never seed auth via raw SQL |
| Direct `auth.users` SQL insert caused "Database error querying schema" | Supabase auth triggers need all fields set correctly — always use the admin API |
| Seed script had hardcoded UUIDs that broke after reset | Look up organizer UUID dynamically by email at seed time; no hardcoded IDs needed |
| `getByText('Draft')` matched event title heading AND pill badge | Use `{ exact: true }` when the target text appears in longer strings nearby |

### Resume here

> Next session: hand `specs/signup-page-visual-hierarchy-spec.md` to Cursor. After it ships, run `npm run test:e2e` (remember: supabase start + npm run dev first). Then update What's New.

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
