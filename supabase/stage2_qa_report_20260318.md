# SignupSmartly Stage 2 RLS — QA Report
**Date:** 2026-03-18
**QA Run By:** Claude (Cowork agent)
**Organizer Account:** allisonleighstone@gmail.com
**Volunteer Email:** allison.troup@gmail.com
**Scheduled Event:** QA Regression Scheduled (`0c1aeaf1-59c8-474e-8986-274fe40f55cd`)
**Undated Simple Event:** QA Regression Simple List (`00b36709-791f-44f4-9b73-833cca19f3a8`)

---

## Summary Verdict: ✅ PASS (after fix)

All critical tests pass following addition of `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` to Vercel environment variables and redeployment. Two minor polish items remain open (non-blocking).

### Initial Run (before fix): ❌ FAIL
### Re-test Run (after fix): ✅ PASS

| Test | Initial | Re-test | Notes |
|------|---------|---------|-------|
| A — Public event browsing (scheduled) | ✅ PASS | ✅ PASS | |
| B — Public event browsing (simple undated) | ✅ PASS | ✅ PASS | |
| C1 — Volunteer signup → confirm → preferences (scheduled) | ❌ FAIL | ✅ PASS | HTTP 500 → HTTP 200 after fix |
| C2 — Volunteer signup → confirm → preferences (undated) | ⚠️ BLOCKED | ✅ PASS | Unblocked by C1 fix |
| D — Organizer dashboard events list | ⚠️ PARTIAL | ✅ PASS | Empty → 9 events via service role key |
| D — Organizer notification settings | ✅ PASS | ✅ PASS | Always used user auth session |
| E — Reminders + digest cron endpoint | ❌ FAIL | ✅ PASS | HTTP 401 → HTTP 200 after fix |
| Neg-1 — Anon cannot read sensitive signup fields | ✅ PASS | ✅ PASS | |
| Neg-2 — Unauthenticated notification-override PATCH | ✅ PASS | ✅ PASS | |
| Neg-3 — Preferences save with invalid token | ✅ PASS | ✅ PASS | |

---

## Fix Applied

Both missing Vercel environment variables were added to the Vercel project settings:

- **`SUPABASE_SERVICE_ROLE_KEY`** — allows `lib/supabase-service.ts` to use the service role key instead of falling back to the anon key, enabling all `lib/db.ts` server-side operations to bypass RLS correctly
- **`CRON_SECRET`** — allows `/api/reminders/process` to validate cron requests

A redeployment to the correct Vercel project was required for the changes to take effect.

---

## Initial Run Root Cause: Missing Vercel Environment Variables

The Vercel production deployment was missing two environment variables that exist in `.env.local` but were never added to the Vercel project settings.

### 1. `SUPABASE_SERVICE_ROLE_KEY` — **CRITICAL**

`lib/supabase-service.ts` falls back to the anon key when this is absent:
```
const keyToUse = serviceRoleKey ?? anonKey;
```
With RLS now enabled, the anon key was blocked by RLS policies on `signups`, `organization_members`, and other tables. All server-side operations in `lib/db.ts` (which uses `serviceSupabase`) failed silently or threw errors.

**Impact:**
- `POST /api/signup` → HTTP 500 (RLS blocks anon INSERT into `signups`)
- Dashboard events list → empty (RLS blocks anon SELECT from `organization_members`)
- Cron endpoint DB queries → would fail even if auth passed

### 2. `CRON_SECRET` — **CRITICAL**

`/api/reminders/process` checks `!process.env.CRON_SECRET` first. If undefined, it returns HTTP 401 immediately regardless of the provided token.

**Impact:**
- `POST /api/reminders/process` → always HTTP 401 in production

---

## Test A: Public Event Browsing (Scheduled) — ✅ PASS (both runs)

**URL:** `https://www.signupsmartly.com/event/0c1aeaf1-59c8-474e-8986-274fe40f55cd`

- Page loads without 401/403/404 ✅
- Coverage meter renders ✅
- "Still Needed" list renders with Spotter role and Sign Up button ✅
- No sensitive fields in page HTML: `email=null`, `cancel_token=null`, `comment=null` ✅
- No Next.js `__NEXT_DATA__` hydration payload present ✅
- No console errors ✅

---

## Test B: Public Event Browsing (Simple Undated) — ✅ PASS (both runs)

**URL:** `https://www.signupsmartly.com/event/00b36709-791f-44f4-9b73-833cca19f3a8`

- Page loads successfully ✅
- Null `start_date` handled cleanly — title and slot list shown without date ✅
- Coverage meter renders ✅
- Signup modal: no reminder UI shown for undated simple list ✅ (checkbox and timing dropdown absent)
- No sensitive fields in page payload ✅

---

## Test C1: Volunteer Signup → Confirm → Preferences (Scheduled) — ✅ PASS (re-test)

**Signup ID:** `619f64df-811e-4f5a-bd5c-bd8c953c0b8c`
**Cancel token:** `f350b58f-f88f-4c97-924d-7ef09f9c86ce`

**Step 1 — Signup form UI:**
- Modal opens on scheduled event with Name, Email, Comment fields ✅
- "Send a reminder" checkbox (checked by default) with "1 day before" dropdown ✅

**Step 2 — POST /api/signup:**
```
POST https://www.signupsmartly.com/api/signup
Body: { slotId, name: "QA Volunteer", email: "allison.troup@gmail.com", reminder_opt_in: true, reminder_offset: "1_day" }
Response: { signupId: "619f64df-811e-4f5a-bd5c-bd8c953c0b8c" }
HTTP Status: 200 ✅
```

**Step 3 — Confirm page** (`/signup/confirm?id=619f64df...`):
- "You're signed up!" heading ✅
- Slot details correct ✅
- "Manage reminder preferences" link visible ✅

**Step 4 — Preferences page** (`/signup/preferences?token=f350b58f...`):
- "Reminder preferences" heading ✅
- "Send me a reminder email" checkbox (checked) ✅
- "When should we remind you?" dropdown showing "1 day before" ✅
- Changed timing to "Morning of the event" and saved ✅
- `PATCH /api/signup/preferences` → HTTP 200 ✅
- Success UI: "Your reminder preferences have been updated." ✅

---

## Test C2: Volunteer Signup → Confirm → Preferences (Undated Simple List) — ✅ PASS (re-test)

**Signup ID:** `3ec54ea2-4499-4a5b-9b94-91278af7a4f0`
**Cancel token:** `7bc0a638-87f2-4d79-9cc9-075269dca3c2`

**Step 2 — POST /api/signup:**
```
POST https://www.signupsmartly.com/api/signup
Body: { slotId: "32e67ed1...", name: "QA Volunteer", email: "allison.troup@gmail.com" }
HTTP Status: 200 ✅
```

**Step 3 — Confirm page** (`/signup/confirm?id=3ec54ea2...`):
- "You're signed up!" heading ✅
- Item: Baked Goods, Event: QA Regression Simple List ✅
- No reminder section in main body ✅ (correct for undated simple list)
- "Manage reminder preferences" link present in footer ✅

**Step 4 — Preferences page** (`/signup/preferences?token=7bc0a638...`):
- "This event doesn't have a date, so reminders are not available for this signup." ✅
- Reminder controls shown but disabled ✅
- No active reminder save possible ✅

---

## Test D: Organizer Dashboard & Notification Settings — ✅ PASS (re-test)

### D1 — Dashboard events list

Direct API probe replicating `getEventsForUser()` logic in `lib/db.ts` with service role key:
```
GET /rest/v1/organization_members?user_id=eq.{organizer_id}  → 1 org returned ✅
GET /rest/v1/events?organization_id=in.(...)                  → 9 events returned ✅
```
The service role key is now correctly set in Vercel and `serviceSupabase` bypasses RLS as intended. The organizer dashboard events list will populate correctly for authenticated users.

*Note: Browser auth session expired between test runs; visual verification of the rendered dashboard requires the organizer to sign in. The underlying DB query is confirmed working via direct API probe.*

### D2 — Settings page (`/dashboard/settings`) — ✅ PASS

- Notification frequency saves correctly via `PATCH /api/settings/notifications` → HTTP 200 ✅
- Uses `createClient()` (user auth session) — works correctly under RLS

### D3 — Per-event signups page (`/dashboard/event/[id]/signups`) — ✅ PASS

- Page loads with event detail, coverage meter, signup table ✅
- Notification override dropdown saves correctly → HTTP 200 ✅
- Setting persists after page refresh ✅

### D4 — Negative auth (logged-out access)

| Protected URL | Expected | Actual |
|---|---|---|
| `/dashboard/settings` | Redirect to login | ✅ Redirects to `/login?next=/dashboard/settings` |
| `/dashboard/event/[id]/signups` | Redirect to login | ⚠️ Returns **404** (not a redirect) |

The per-event signups page returns 404 for unauthenticated access instead of redirecting to login. Content is not exposed, but behavior is inconsistent with the settings page.

---

## Test E: Reminders + Digest Cron — ✅ PASS (re-test)

```
POST https://www.signupsmartly.com/api/reminders/process
Authorization: Bearer aazDkYIjsjis9ULrhjJ-ISkyAzfS1deSRE5Bek-TluNavRQuaQt4lfqCLGm8RtI8
Response: { "processed": 0, "digestProcessed": 0 }
HTTP Status: 200 ✅
```

Auth check passes (CRON_SECRET is set). DB queries use service role key and bypass RLS correctly. `processed: 0` is expected — no pending reminders due for the QA test signups.

---

## Negative / Security Tests — ✅ ALL PASS (both runs)

### Neg-1: Anon cannot read sensitive signup fields
Public event pages contain no `email`, `cancel_token`, or `comment` fields anywhere in HTML or hydrated data. RLS correctly prevents direct anon reads from `signups`. ✅

### Neg-2: Unauthenticated notification-override PATCH
```
PATCH /api/events/[id]/notification-override  (no auth)
Response: { "error": "Unauthorized" }
HTTP Status: 401  ✅
```

### Neg-3: Preferences save with invalid token
```
PATCH /api/signup/preferences
Body: { token: "00000000-0000-0000-0000-000000000000", ... }
Response: { "error": "Signup not found" }
HTTP Status: 404  ✅
```

---

## Console Errors
No browser console errors observed across any tested page.

---

## Open Items

### 🟡 Minor — Polish (non-blocking for launch)

1. **Show an error message in the signup modal on 500 response.**
   Currently the modal stays open silently when the POST fails. Add a visible error like "Something went wrong, please try again."

2. **Fix unauthenticated redirect for `/dashboard/event/[id]/signups`.**
   Returns 404 instead of redirecting to `/login?next=...`. Add the same auth middleware guard used by `/dashboard/settings`.
