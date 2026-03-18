# SignupSmartly Stage 2 RLS — QA Report
**Date:** 2026-03-18
**QA Run By:** Claude (Cowork agent)
**Organizer Account:** allisonleighstone@gmail.com
**Volunteer Email:** allison.troup@gmail.com
**Scheduled Event:** QA Regression Scheduled (`0c1aeaf1-59c8-474e-8986-274fe40f55cd`)
**Undated Simple Event:** QA Regression Simple List (`00b36709-791f-44f4-9b73-833cca19f3a8`)

---

## Summary Verdict: ❌ FAIL

Two critical environment variable misconfigurations in Vercel production cause the volunteer signup flow and cron endpoint to fail. All other tested functionality passes.

| Test | Result | Notes |
|------|--------|-------|
| A — Public event browsing (scheduled) | ✅ PASS | |
| B — Public event browsing (simple undated) | ✅ PASS | |
| C1 — Volunteer signup → confirm → preferences (scheduled) | ❌ FAIL | HTTP 500 on `POST /api/signup` |
| C2 — Volunteer signup → confirm → preferences (undated) | ⚠️ BLOCKED | Blocked by C1 failure |
| D — Organizer dashboard & notification settings | ⚠️ PARTIAL | Settings save works; dashboard events list empty |
| E — Reminders + digest cron endpoint | ❌ FAIL | HTTP 401; `CRON_SECRET` not set in Vercel |
| Neg-1 — Anon cannot read sensitive signup fields | ✅ PASS | No email/comment/cancel_token in public page payloads |
| Neg-2 — Unauthenticated notification-override PATCH | ✅ PASS | HTTP 401 |
| Neg-3 — Preferences save with invalid token | ✅ PASS | HTTP 404 "Signup not found" |

---

## Root Cause: Missing Vercel Environment Variables

The Vercel production deployment is missing two environment variables that exist in `.env.local` but were never added to the Vercel project settings:

### 1. `SUPABASE_SERVICE_ROLE_KEY` — **CRITICAL**

`lib/supabase-service.ts` falls back to the anon key when this is absent:
```
const keyToUse = serviceRoleKey ?? anonKey;
```
With RLS now enabled, the anon key is blocked by RLS policies on `signups`, `organization_members`, and other tables. All server-side operations in `lib/db.ts` (which uses `serviceSupabase`) fail silently or throw errors.

**Impact:**
- `POST /api/signup` → HTTP 500 (RLS blocks anon INSERT into `signups`)
- Dashboard events list → empty (RLS blocks anon SELECT from `organization_members`)
- Cron endpoint DB queries → would fail even if auth passed

### 2. `CRON_SECRET` — **CRITICAL**

`/api/reminders/process` checks `!process.env.CRON_SECRET` first. If undefined, it returns HTTP 401 immediately regardless of the provided token.

**Impact:**
- `POST /api/reminders/process` → always HTTP 401 in production

**Fix:** Add both variables to the Vercel project's Environment Variables (Settings → Environment Variables):
- `SUPABASE_SERVICE_ROLE_KEY` = value from `.env.local`
- `CRON_SECRET` = value from `.env.local`

---

## Test A: Public Event Browsing (Scheduled) — ✅ PASS

**URL:** `https://www.signupsmartly.com/event/0c1aeaf1-59c8-474e-8986-274fe40f55cd`

- Page loads without 401/403/404 ✅
- Coverage meter renders (0% — 0 of 2 spots filled) ✅
- "Still Needed" list renders with Spotter role and Sign Up button ✅
- No sensitive fields in page HTML: `email=null`, `cancel_token=null`, `comment=null` ✅
- No Next.js `__NEXT_DATA__` hydration payload present ✅
- No console errors ✅

The `events_select_published_or_member` RLS policy (`TO anon, USING (published = true)`) works correctly — published events are publicly readable.

---

## Test B: Public Event Browsing (Simple Undated) — ✅ PASS

**URL:** `https://www.signupsmartly.com/event/00b36709-791f-44f4-9b73-833cca19f3a8`

- Page loads successfully ✅
- No "No date" placeholder text visible ✅ (null `start_date` handled cleanly — title and slot list shown without date)
- Coverage meter renders ✅
- Signup modal opened: **no reminder UI shown** for undated simple list ✅ (checkbox and timing dropdown absent)
- No sensitive fields in page payload ✅

---

## Test C1: Volunteer Signup → Confirm → Preferences (Scheduled) — ❌ FAIL

**Step 1 — Signup form UI:** Modal opens correctly on scheduled event with:
- Name, Email, Comment fields ✅
- "Send a reminder" checkbox (checked by default) with "1 day before" dropdown ✅

**Step 2 — POST /api/signup:**
```
POST https://www.signupsmartly.com/api/signup
Body: { slotId, name: "QA Volunteer", email: "allison.troup@gmail.com", reminder_opt_in: true, reminder_offset: "1_day" }
Response: { "error": "An unexpected error occurred" }
HTTP Status: 500
```
**Root cause:** `createSignup()` in `lib/db.ts` uses `serviceSupabase`, which falls back to anon key. The anon INSERT into the `signups` table is blocked by RLS (code `42501`):
```
Direct anon INSERT test: { "code": "42501", "message": "new row violates row-level security policy for table \"signups\"" } HTTP 401
```
The thrown Supabase `PostgrestError` is not an `Error` instance, so the catch block returns the generic "An unexpected error occurred" message.

**Additional UX finding:** When the POST returns 500, the modal stays open with no error message shown to the user. The failure is silent.

**Steps 3–4 (confirm page, preferences update):** Not reachable — signup never created.

---

## Test C2: Volunteer Signup → Confirm → Preferences (Undated Simple List) — ⚠️ BLOCKED

Blocked by the same `SUPABASE_SERVICE_ROLE_KEY` issue as C1. Signup modal UI verified to display correctly (no reminder UI for undated events). API call not retested as root cause is identical.

---

## Test D: Organizer Dashboard & Notification Settings — ⚠️ PARTIAL

### D1 — Dashboard page (`/dashboard`) — ⚠️ PARTIAL FAIL

- Page loads and user is authenticated (Settings / Sign out visible) ✅
- **Events list shows "Nothing to see here"** ❌

Root cause: `getEventsForUser()` in `lib/db.ts` uses `serviceSupabase`. Without the service role key, it queries `organization_members` with the anon key, which has no RLS policy for anon access → empty result → function returns `[]` → empty dashboard.

### D2 — Settings page (`/dashboard/settings`) — ✅ PASS

- Page loads ✅
- Notification frequency changed: Weekly digest → Daily digest (two saves)
- Both `PATCH /api/settings/notifications` calls → **HTTP 200** ✅

This works because the settings API uses `createClient()` (user's authenticated session), not `serviceSupabase`. The `users_update_own` RLS policy applies correctly.

### D3 — Per-event signups page (`/dashboard/event/[id]/signups`) — ✅ PASS

- Page loads with event detail, coverage meter, signup table, and notification override dropdown ✅
- Changed override from "Daily digest" → "Instantly"
- `PATCH /api/events/[id]/notification-override` → **HTTP 200** ✅
- Setting persists after page refresh ✅

### D4 — Negative auth: logged-out access

| Protected URL | Expected | Actual |
|---|---|---|
| `/dashboard/settings` | Redirect to login | ✅ Redirects to `/login?next=/dashboard/settings` |
| `/dashboard/event/[id]/signups` | Redirect to login | ⚠️ Returns **404** (not a redirect) |

The per-event signups page returns 404 for unauthenticated access instead of redirecting to login. Content is not exposed, but the behavior is inconsistent with the settings page.

---

## Test E: Reminders + Digest Cron — ❌ FAIL

```
POST https://www.signupsmartly.com/api/reminders/process
Authorization: Bearer aazDkYIjsjis9ULrhjJ-ISkyAzfS1deSRE5Bek-TluNavRQuaQt4lfqCLGm8RtI8
Response: { "error": "Unauthorized" }
HTTP Status: 401
```

Root cause: The route checks `!process.env.CRON_SECRET` before comparing tokens. Since `CRON_SECRET` is not set in Vercel, the check evaluates to `true` and returns 401 immediately.

**Secondary issue (would surface after fixing the env var):** The cron route also uses `serviceSupabase` for all DB queries (signups with joins, `organizer_notification_digest`). Without a valid service role key, those queries would also fail under RLS.

---

## Negative / Security Tests — ✅ ALL PASS

### Neg-1: Anon cannot read sensitive signup fields
Public event pages (`/event/[id]`) contain no email addresses, `cancel_token`, `email`, or `comment` fields anywhere in the HTML or hydrated data. RLS correctly prevents direct anon reads from `signups`. ✅

### Neg-2: Unauthenticated notification-override PATCH
```
PATCH /api/events/[id]/notification-override  (no auth)
Response: { "error": "Unauthorized" }
HTTP Status: 401  ✅
```

### Neg-3: Preferences save with invalid token
```
PATCH /api/signup/preferences
Body: { token: "00000000-0000-0000-0000-000000000000", reminder_opt_in: false, reminder_offset: "1_day" }
Response: { "error": "Signup not found" }
HTTP Status: 404  ✅
```

---

## Console Errors
No browser console errors observed across any tested page.

---

## Action Items (Priority Order)

### 🔴 Critical — Fix Before Launch

1. **Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables.**
   Vercel Dashboard → Project → Settings → Environment Variables.
   Use the value from `.env.local`. This unblocks `POST /api/signup`, the organizer dashboard events list, and all `lib/db.ts` operations under RLS.

2. **Add `CRON_SECRET` to Vercel environment variables.**
   Same location. Use the value from `.env.local`. This unblocks the `/api/reminders/process` cron endpoint.

### 🟡 Minor — Polish

3. **Show an error message in the signup modal on 500 response.**
   Currently the modal stays open silently when the POST fails. Add a visible error like "Something went wrong, please try again."

4. **Fix unauthenticated redirect for `/dashboard/event/[id]/signups`.**
   Returns 404 instead of redirecting to `/login?next=...`. Add the same auth middleware guard used by `/dashboard/settings`.

### 🟢 Re-test After Fix

Once the two Vercel env vars are added, re-run Tests C1, C2, and E in full to validate:
- Volunteer signup → confirm page → preferences update (both event types)
- Cron endpoint processes reminders and digest rows
- Organizer dashboard events list populates correctly
