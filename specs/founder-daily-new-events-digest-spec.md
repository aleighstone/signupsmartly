# Spec: Founder daily digest — new published events

## Overview

Send **Allison** (product owner) one email per day listing **new published events** created in the last 24 hours. This is internal ops visibility, not an organizer-facing feature.

---

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Row type | **New events** (rows in `events`), not volunteer signups |
| Visibility | **`published = true` only** |
| Missing creator | **`created_by IS NULL` → omit row** from the digest |
| Time window | **Rolling 24 hours** ending at cron run time (no extra state / “since last send” table) |
| Cron schedule | Keep existing Vercel cron: **`0 9 * * *`** (09:00 UTC) — acceptable |
| Subject branding | **`SUS`** in subject is intentional (not a typo) |

---

## Trigger and infra

- **Single daily cron** already calls `POST /api/reminders/process` with `Authorization: Bearer CRON_SECRET` (Hobby plan: do **not** add a second cron entry).
- Run the founder digest **in the same handler** after other daily work.
- **Refactor guard:** Today the handler returns early when there are no pending volunteer reminders, which **skips** organizer digests. The founder digest (and organizer digest) must run **even when** the reminder batch is empty — only the reminder loop should be conditional.

---

## Data query

Using **service Supabase** (same as cron):

- From `events`:
  - `published = true`
  - `created_at >= (now - 24 hours)` (ISO boundary consistent with existing `twentyFourHoursAgo` pattern in the reminders route)
  - `created_by IS NOT NULL`
- Join **`users`** on `events.created_by = users.id` for organizer **`email`** (and optionally `name` for display).
- Order by `created_at` ascending (oldest-first in the list) unless product prefers newest-first — default **newest first** (`desc`) is fine for “what happened yesterday”; spec says **easiest** → **`created_at DESC`**.

---

## Email

- **To:** `process.env.FOUNDER_DIGEST_EMAIL` (set to `allisonleighstone@gmail.com` in Vercel / `.env.local`). If unset, **skip sending** (no-op).
- **From:** Same as other transactional mail (`RESEND_FROM_EMAIL` / existing Resend helper pattern in `lib/email.ts`).
- **Subject:** `DAILY SUS UPDATE: New Events`
- **If zero rows after filters:** **Do not send** (save Resend quota).

### Body (minimum)

For each event:

- **Creator:** organizer email from `users.email` (and optionally name if present).
- **Signup type:** human-readable — `Scheduled` vs `Simple` (from `events.signup_type`).
- **Event title** (helps scan the list).
- **Link:** public signup URL — `{APP_URL}/event/{id}` using the same `NEXT_PUBLIC_APP_URL` base as `lib/email.ts`.

Reuse the existing HTML email wrapper / typography used by other `lib/email.ts` templates for consistency.

---

## Files to change (implementation checklist)

| File | Change |
|------|--------|
| `specs/founder-daily-new-events-digest-spec.md` | This document |
| `lib/email.ts` | New `sendFounderNewEventsDigest()` (or similar) |
| `app/api/reminders/process/route.ts` | Remove unconditional early return that skips digests; run founder digest after organizer digest passes |
| `.env.example` (if present) | Document `FOUNDER_DIGEST_EMAIL` |

---

## Out of scope

- Multiple recipients, CC, or per-org filtering
- New volunteer signups / roster changes
- Dashboard UI or opt-out (founder-only internal email)
- Changing cron schedule or timezone

---

## Privacy / compliance note

Digest includes **organizer email addresses**. Acceptable for internal founder reporting; do not forward or expose outside trusted use.
