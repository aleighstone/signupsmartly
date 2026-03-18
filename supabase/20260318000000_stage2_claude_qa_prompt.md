# Claude Co-work Agent QA Prompt

You are a QA engineer validating Row Level Security (RLS) policies for SignupSmartly.

## Objective
Verify end-to-end that enabling RLS with the provided policy set does not break:
- Public event browsing
- Volunteer signup -> confirm page -> reminder preferences patch
- Organizer dashboard pages and notification settings
- Volunteer reminders and organizer digests processing via the shared cron endpoint

Also verify that public/anon access does not expose sensitive signup fields.

## Context / Assets
RLS policy files exist in the repo:
- `supabase/20260318000000_stage2_enable_rls.sql`
- `supabase/20260318000000_stage2_rollback_rls.sql`

The app endpoints involved:
- `POST /api/signup` (volunteer signup)
- `/signup/confirm?id=...` (server-rendered confirm page)
- `/signup/preferences?token=...` (server-rendered preferences page)
- `PATCH /api/signup/preferences` (save reminder settings)
- `/dashboard/settings` (global signup notification frequency)
- `/dashboard/event/[id]/signups` (per-event notification override)
- `/api/events/[id]/notification-override` (save per-event override)
- `/api/reminders/process` (shared cron endpoint: volunteer reminders + organizer digests)

## Safety Rules
1. Use test data whenever possible (create/modify only events and signups created for this QA run).
2. Prefer a single test organizer account and one test volunteer email (both should be under your control).
3. If anything unexpected occurs, stop and report; do not continue experiments that could spam users.

## What to record
For each test step, capture:
- Screenshot (or short screen recording) if UI-related
- The HTTP status code and response body (JSON) for any API call
- Any console errors in the browser (if present)
- Confirmation that sensitive fields (`email`, `comment`, `cancel_token`) do not appear in public page payloads

## Test Setup (do this first)
1. Identify these values:
   - `TEST_ORG`: organizer account email (must be logged into the dashboard during tests)
   - `TEST_VOLUNTEER_EMAIL`: volunteer email used for signups
   - `SCHEDULED_EVENT_ID`: ID of a published scheduled event
   - `SIMPLE_UNDATED_EVENT_ID`: ID of a published simple list event with `start_date = NULL`
2. In the app UI, open and confirm both public event pages load successfully:
   - `https://www.signupsmartly.com/event/[SCHEDULED_EVENT_ID]`
   - `https://www.signupsmartly.com/event/[SIMPLE_UNDATED_EVENT_ID]`
3. Confirm global notification settings in the organizer UI:
   - `/dashboard/settings`
   - Set `Daily digest` first for digest testing. (Instantly is optional to verify instant email.)

## Test Execution

### Test A: Public event browsing (scheduled)
1. In a private/incognito window that is NOT logged in as an organizer:
   - Visit: `/event/[SCHEDULED_EVENT_ID]`
2. Expected:
   - Page loads (no 401/403/404 from the Next.js route)
   - Coverage meter renders
   - “Still Needed” list renders
3. Sensitive payload check:
   - Search the page for any occurrence of the volunteer email or fields that look like email/comment/cancel tokens.
   - If there is a client-side payload (e.g. Next.js data hydration), verify those strings are not present.

### Test B: Public event browsing (simple undated)
1. In the same private/incognito window:
   - Visit: `/event/[SIMPLE_UNDATED_EVENT_ID]`
2. Expected:
   - Page loads successfully
   - There is NO visible “No date” placeholder text
   - Reminder UI (in signup modal) is either hidden or non-functional as specified (no reminders for undated simple list)

### Test C: Volunteer signup -> confirm -> manage reminder preferences
Run this twice:
- once for scheduled event (Test C1)
- once for undated simple list event (Test C2)

#### Test C1: Scheduled event signup
1. In private/incognito, submit a volunteer signup on `/event/[SCHEDULED_EVENT_ID]`.
   - Name: `QA Volunteer`
   - Email: `TEST_VOLUNTEER_EMAIL`
   - Choose reminder checkbox ON with one of:
     - 1 day before OR morning of
2. Expected:
   - Signup request completes successfully (no 500)
3. Confirm page:
   - After signup, verify the app navigates to `/signup/confirm?id=[signupId]`
   - Expected: confirm details render, and “Manage reminder preferences” link appears
4. Update preferences:
   - Open `/signup/preferences?token=[cancel_token]`
   - Change reminder on/off or timing (must be valid per UI)
   - Save changes (PATCH request)
   - Expected: save succeeds (HTTP 200) and success UI renders

#### Test C2: Undated simple list signup
1. Submit a volunteer signup on `/event/[SIMPLE_UNDATED_EVENT_ID]`.
2. Expected:
   - Signup request completes successfully
3. Confirm page and preferences:
   - Open confirm page
   - Open manage preferences
   - Expected:
     - If reminders are not available for undated simple lists, UI should indicate that (and disable save accordingly)

### Test D: Organizer dashboard and notification settings
1. Log in as `TEST_ORG`.
2. Visit:
   - `/dashboard`
   - `/dashboard/settings`
3. Expected:
   - Pages load
   - You can update notification frequency (instant/daily/weekly/never)
   - HTTP calls succeed (no 500)

4. Per-event override:
   - Visit `/dashboard/event/[SCHEDULED_EVENT_ID]/signups`
   - Change the per-event notification override dropdown
   - Expected: change saves successfully and persists after refresh
5. Negative authorization checks:
   - While logged out, attempt to open `/dashboard/event/.../signups` and `/dashboard/settings`
   - Expected: redirect to login

### Test E: Reminders + digest processing (cron endpoint)
Because this is a hobby plan and/or cron scheduling is limited, validate via manual invocation locally or in production (only with your controlled CRON_SECRET).

1. Create at least one new volunteer signup while:
   - Global preference = `Daily digest`
   - Per-event preference = default (or set to Daily digest)
2. Trigger the cron handler:
   - Call `POST /api/reminders/process`
   - Include header: `Authorization: Bearer <CRON_SECRET>`
   - Capture HTTP status and response JSON
3. Expected:
   - Response indicates processed rows (may be `processed: N`)
   - Organizer receives the digest email
4. Verify tombstoning behavior:
   - Ensure reminder_sent_at is set for reminders that were processed
   - Ensure digest_sent_at is set for processed digest rows (if you can inspect in UI/DB)

## Security/Negative Tests (RLS-specific)
These steps are important to validate RLS works and is not just “server role bypassing everything.”

### Negative 1: Ensure anon cannot read signups sensitive fields
1. In a private/incognito window:
   - Try to load public pages only (already covered).
2. Expected:
   - No sensitive fields appear in hydrated page data.

### Negative 2: Attempt forbidden per-event override
1. Log out.
2. Attempt to call:
   - `PATCH /api/events/[SCHEDULED_EVENT_ID]/notification-override`
   - Expected: HTTP 401/403.

### Negative 3: Attempt volunteer preferences save without token
1. Call `PATCH /api/signup/preferences` with an invalid token.
2. Expected: HTTP 404 (Signup not found) or HTTP 400 (invalid request).

## Pass/Fail Criteria
Pass if:
- No user-facing 500 errors occur in signup, confirm, preferences, organizer settings, or per-event override.
- Public pages do not reveal sensitive signup fields.
- Cron invocation results in expected email dispatches and state updates.

Fail if:
- Any signup or preferences call fails with 401/403/500.
- Any public page payload reveals volunteer email/comment/cancel token.
- Organizer settings or per-event overrides fail unexpectedly.

## Output Format for Your Report
Return a structured report with:
- Test A/B/C/D/E: pass/fail for each
- Screenshots or notes
- API call status codes and responses
- Any console errors

