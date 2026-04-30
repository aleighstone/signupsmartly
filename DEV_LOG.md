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
| Playwright fix: strict mode violation on “Draft” text in draft card test | `e2e/organizer.smoke.ts` | deployed |
| Style guide: typography updated to reflect display/heading split | `public/styleguide/index.html` | deployed |
| EventHeader: date/location match slot card time/name styles (charcoal, not muted) | `components/EventHeader.tsx` | deployed |
| Signup page visual hierarchy: date/time hero layout for single vs multi-date events | `lib/calendar.ts`, `components/SlotList.tsx` | deployed |
| “Go to future spots” link on multi-date signup pages (replaced auto-scroll after UX testing) | `components/SlotList.tsx`, `e2e/volunteer.smoke.ts`, `data/changelog.ts` | deployed |
| Open Graph metadata: event pages + What's New | `app/event/[id]/page.tsx`, `app/whats-new/page.tsx` | deployed |
| Archive feature: Active/Archived dashboard tabs, confirmation modal, archive/unarchive API, public 404, reminder skip | `components/EventCard.tsx`, `components/DashboardEventList.tsx`, `app/dashboard/page.tsx`, `app/api/events/[id]/archive/route.ts`, `app/api/events/[id]/unarchive/route.ts`, `app/event/[id]/page.tsx`, `app/api/reminders/process/route.ts`, `lib/db.ts`, `supabase/migrations/20260424173000_add_event_archived.sql` | deployed |
| Organizer “← My Dashboard” breadcrumb on public event page | `app/event/[id]/page.tsx` | deployed |
| Volunteer name/email localStorage autofill in signup form | `components/SignupForm.tsx` | deployed |
| What's New page updated with all above features | `data/changelog.ts` | deployed |
| Playwright: archive/unarchive lifecycle tests + stale-DB guard + copy-test scoped to correct card | `e2e/organizer.smoke.ts` | deployed |
| Spec reconciliation: all 4 shipped specs updated to match final behavior | `specs/` | committed |

### Backlog

| Item | Notes |
|---|---|
| Publish a draft from dashboard — E2E test | Publish button exists, no test that verifies it goes live |
| Organizer breadcrumb — E2E test | No Playwright coverage yet |
| Volunteer autofill — E2E test | No Playwright coverage yet (localStorage-only feature) |

### Lessons

| What happened | Fix / note |
|---|---|
| `supabase db reset` wipes `auth.users` — login broke after reset | Use `supabase.auth.admin.createUser` in setup-local-user.ts; never seed auth via raw SQL |
| Direct `auth.users` SQL insert caused “Database error querying schema” | Supabase auth triggers need all fields set correctly — always use the admin API |
| Seed script had hardcoded UUIDs that broke after reset | Look up organizer UUID dynamically by email at seed time; no hardcoded IDs needed |
| `getByText('Draft')` matched event title heading AND pill badge | Use `{ exact: true }` when the target text appears in longer strings nearby |
| Copy test used `.first()` on three-dot menu — first card was a draft, no Copy item | Scope to `li:has(a[href*=”${eventId}”])` to target the specific known-published event |
| Archive test timed out on Archived tab button when DB was empty | Added `isVisible()` guard that skips with a clear “re-seed” message instead of timing out |
| Auto-scroll on page load hid the event header and description | Replaced `useEffect` scroll with a manual “Go to future spots” link button |

### Resume here

> All major features from today are deployed. No urgent backlog. Next session: either add E2E coverage for the organizer breadcrumb, or start a new feature.

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

## 2026-04-28

### Completed

- Added Playwright regression coverage for edit/save behavior so an edit does not create duplicate signups (`e2e/organizer.smoke.ts`).
- Standardized breadcrumb back-link placement/styling so back links appear above headings on dashboard/create flows (`app/create-event/CreateEventForm.tsx`, `app/create-event/page.tsx`, `app/dashboard/event/[id]/edit/EditEventForm.tsx`, `app/dashboard/event/[id]/signups/page.tsx`, `app/dashboard/event/[id]/roster/page.tsx`, `app/signup/confirm/page.tsx`).
- Fixed `/create-event` simple-mode description editor lock-up by giving scheduled/simple description editors unique IDs, names, and remount keys (`app/create-event/CreateEventForm.tsx`).
- Verified with `npm run build` (passes).

### Backlog

- Add API-level test coverage for `PATCH /api/events/[id]` to assert event row count remains unchanged on edit saves.
