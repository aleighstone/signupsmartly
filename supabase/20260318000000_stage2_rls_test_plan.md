# Stage 2 RLS Test Plan (SignupSmartly)

## Purpose
Verify that enabling Row Level Security (RLS) and applying the policies in:
- `supabase/20260318000000_stage2_enable_rls.sql`

does not break the live volunteer + organizer flows, and that public/anon access cannot read sensitive signup data.

## Preconditions
1. `SUPABASE_SERVICE_ROLE_KEY` is set in **Vercel server environment** (and any server runtime).
2. You have the rollback SQL ready:
   - `supabase/20260318000000_stage2_rollback_rls.sql`
3. You can call cron endpoints locally or via temporary/manual invocation:
   - Volunteer reminders + organizer digests share `/api/reminders/process`
   - Protected by `Authorization: Bearer <CRON_SECRET>`

## Test Data Setup
1. Create/choose one organizer account that will be the event owner.
2. Ensure at least one event is `published = true`.
3. Create one **scheduled** event (has `start_date` and slots with `start_time`/`end_time`).
4. Create one **simple list event** with `start_date = NULL` (undated).
5. Create at least one slot under each event with capacity > 0.
6. For organizer digest tests, configure:
   - `/dashboard/settings` → choose `Daily digest` (and optionally `Weekly digest`)
   - `/dashboard/event/[id]/signups` → ensure per-event override is `Use my default` equivalent (UI default)

## Smoke Tests (POST-RLS Enablement)

### A. Public Event Browsing (anon -> server render -> service role DB)
1. Open the public event page for the scheduled event:
   - `/event/[publicEventId]`
   - Expected:
     - Page loads successfully.
     - Coverage meter renders.
     - “Still Needed” list renders.
     - Filled roles show **names only** (no email/comment exposed).
2. Open the public event page for the undated simple list event:
   - `/event/[publicEventId]`
   - Expected:
     - No “No date” placeholder text.
     - Page loads successfully.

### B. Volunteer Signup + Confirm + Preferences
For each event type (scheduled and simple):
1. Volunteer submits signup via the public signup modal.
   - Expected:
     - Signup completes (no 500).
2. Confirm page loads:
   - `/signup/confirm?id=[signupId]`
   - Expected:
     - Confirmation details render.
     - “Cancel signup” link works (navigates).
     - “Manage reminder preferences” link works.
3. Reminder preferences update:
   - Open `/signup/preferences?token=[cancel_token]`
   - Change reminder setting(s) and save (PATCH `/api/signup/preferences`).
   - Expected:
     - Save succeeds (no 401/403/500).

### C. Organizer Dashboard Pages (authenticated organizer)
1. `/dashboard` loads.
   - Expected:
     - Event list renders.
     - Coverage meters render (consistent width).
2. `/dashboard/settings` loads and you can update:
   - `notification_preference` (Instantly / Daily digest / Weekly digest / Never)
   - Expected:
     - Save succeeds (200).
3. `/dashboard/event/[id]/signups` loads for the event.
   - Expected:
     - Signups table renders.
     - Notification override dropdown renders.
     - Changing override persists (200).

### D. Organizer Instant Notifications (on signup)
1. Set global preference to **Instantly** or per-event override to **Instantly**.
2. Create a fresh volunteer signup.
3. Expected:
   - Organizer receives an instant notification email.

### E. Digest Notifications + Cron Processing
1. Ensure pending digest rows exist by making a new signup after setting:
   - global preference = `Daily digest` (and optionally `Weekly digest`)
2. Trigger the cron handler manually (local):
   - `POST /api/reminders/process`
   - Header: `Authorization: Bearer <CRON_SECRET>`
3. Expected:
   - Organizer receives the correct digest email (daily or weekly depending on day).
4. Confirm that `digest_sent_at` becomes non-null for processed rows.

## Negative Tests (Security Verification)
1. From an unauthenticated browser session, attempt to access:
   - `/dashboard/*` pages
   - Expected: redirect to login (existing behavior).
2. Attempt to directly fetch sensitive signup fields (if you have a way to query Supabase anon):
   - Confirm that anon cannot SELECT sensitive fields from `signups`.
3. Attempt to write/modify signup rows from anon context (should fail).
   - Expected: no unauthorized writes succeed.

## Acceptance Criteria
- No volunteer signup flow returns 4xx/5xx.
- Organizer dashboard/settings/signups override all work.
- Reminder preferences save works.
- Digest/instant emails send as expected when preferences are set.
- Security advisor warnings are eliminated (RLS enabled).
- Sensitive signup data is not exposed via public pages.

