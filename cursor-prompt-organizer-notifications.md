# Cursor Prompt — Feature: Organizer Signup Notifications

## Context

SignupSmartly is a Next.js 14 (App Router) + TypeScript app using Supabase (Postgres + Auth), Resend for transactional email, Tailwind CSS, and Vercel for deployment. Organizers have Supabase auth accounts. Volunteers sign up without an account.

This prompt implements **organizer signup notifications**: emails sent to organizers when volunteers sign up for their events. Organizers control frequency at a global level (account settings) with a per-event override.

> **Vercel constraint:** The app is on Vercel's hobby plan, which limits cron jobs to run at most once per day. The volunteer reminders feature already occupies one cron job slot. This feature must use a single cron job for all digest processing (daily + weekly combined), described in section 8.

---

## 1. Database Changes

### `users` table — global notification preference
```sql
ALTER TABLE users
  ADD COLUMN notification_preference text NOT NULL DEFAULT 'daily'
    CHECK (notification_preference IN ('instant', 'daily', 'weekly', 'never'));
```

### `events` table — per-event override
```sql
ALTER TABLE events
  ADD COLUMN notification_override text NULL
    CHECK (notification_override IN ('instant', 'daily', 'weekly', 'never'));
```
`NULL` means "use the organizer's global preference." A non-null value overrides it for that event only.

### `organizer_notification_digest` table — tracks digest state
```sql
CREATE TABLE organizer_notification_digest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  signup_id uuid NOT NULL REFERENCES signups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  digest_sent_at timestamptz NULL
);
```
Every new signup is written here. Instant notifications are sent and immediately marked `digest_sent_at = now()`. Daily/weekly digest jobs query rows where `digest_sent_at IS NULL`.

---

## 2. Effective Preference Helper

Create a utility function used in both the signup handler and cron jobs:

```ts
// lib/notifications.ts
export function effectiveNotificationPreference(
  userPreference: string,
  eventOverride: string | null
): string {
  return eventOverride ?? userPreference;
}
```

---

## 3. Account Settings — Global Notification Preference

Add a **"Notifications"** section to the organizer's account/profile settings page (create this page at `/dashboard/settings` if it doesn't exist, or add a section to an existing settings page).

### UI
- Section heading: "Signup Notifications"
- Description: "Choose how often you want to hear about new signups across all your events."
- Radio group or segmented control with four options:
  - **Instantly** — "Get an email as soon as someone signs up"
  - **Daily digest** — "Get a summary email each morning with overnight signups" *(default)*
  - **Weekly digest** — "Get a summary email every Monday morning"
  - **Never** — "Don't send me signup notification emails"
- Save button that PATCHes `/api/settings/notifications`

### API
```
PATCH /api/settings/notifications
Body: { notification_preference: 'instant' | 'daily' | 'weekly' | 'never' }
Auth: required (Supabase session)
Response: 200 OK
```
Update `users.notification_preference` for the authenticated user.

---

## 4. Per-Event Notification Override

On the **Signups page** (`/dashboard/event/[id]/signups`), add a small **"Notification settings"** control near the top of the page, below the event title.

### UI
- Label: "Notifications for this event:"
- Inline dropdown (small, secondary style) with five options:
  - "Use my default ([current global preference])" — maps to `null` in DB
  - "Instantly"
  - "Daily digest"
  - "Weekly digest"
  - "Never"
- Auto-saves on change (no separate save button needed); show a brief success toast.

### API
```
PATCH /api/events/[id]/notification-override
Body: { notification_override: 'instant' | 'daily' | 'weekly' | 'never' | null }
Auth: required; verify the event belongs to the authenticated organizer
Response: 200 OK
```

---

## 5. Signup Handler — Trigger Instant Notifications

In the existing signup creation handler (`POST /api/signups` or equivalent):

After successfully inserting a new `signup` row:

1. Insert a row into `organizer_notification_digest` for the new signup.
2. Look up the event's organizer (`events.user_id` or via `organization_members`), their `users.notification_preference`, and the event's `notification_override`.
3. Compute the effective preference using `effectiveNotificationPreference()`.
4. If effective preference is `'instant'`:
   - Send the instant notification email via Resend immediately.
   - Mark the `organizer_notification_digest` row `digest_sent_at = now()`.
5. If `'daily'`, `'weekly'`, or `'never'`: leave `digest_sent_at` as `NULL` (digest job handles it, or it's never sent).

All of this should be done **after** returning the signup response to the volunteer — use a fire-and-forget pattern or a background task so it doesn't slow down the signup confirmation redirect.

---

## 6. Email: Instant Notification

Create a Resend email template for instant notifications. Use the existing email layout.

### Subject
`[Event Title] — [Volunteer Name] just signed up`

### Body
- Heading: "New signup!"
- Table of signup details:
  - **Event:** [Event Title]
  - **Spot / Item:** [Slot or item name]
  - **Date / Time:** [If applicable]
  - **Volunteer:** [Name]
  - **Email:** [Email address] (linked as mailto)
  - **Comment:** [If provided]
- CTA button: **"View all signups"** → `/dashboard/event/[id]/signups`
- Footer: "You're receiving this because you have instant notifications on for this event. [Change notification settings]" → `/dashboard/settings`

---

## 7. Email: Digest Notification

Create a Resend email template for digest notifications (shared by daily and weekly). Use the existing email layout.

### Subject
- Daily: `SignupSmartly — Your signup summary for [Day, Month Date]`
- Weekly: `SignupSmartly — Your weekly signup summary`

### Body
- Heading: "Here's who signed up" + date range
- Group signups by event. For each event with new signups:
  - **Event name** as a subheading
  - A compact table: Spot/Item | Volunteer Name | Email | Time (if applicable) | Comment
  - Link: "View all signups →" for that event
- If only one event: skip the grouping header, just show the table.
- If no signups (edge case — shouldn't happen but guard against it): don't send the email.
- Footer: "Change how often you receive these emails: [Notification settings]" → `/dashboard/settings`

---

## 8. Digest Cron Job

> **Important:** Due to the Vercel hobby plan's once-per-day cron limit, there is a **single combined digest job** that handles both daily and weekly digest logic in one run. Do not create two separate cron entries.

### Single digest job — runs at 7:00 AM UTC every day
```
POST /api/notifications/digest
```
No request body needed — the job determines internally which digest types to process based on the current day.

Cron schedule in `vercel.json`: `0 7 * * *`

Protected by `Authorization: Bearer [CRON_SECRET]` header check (same `CRON_SECRET` env var used by the volunteer reminders cron).

### Digest logic

The job runs two passes on every execution:

**Pass 1 — Daily digests:** Find all organizers whose effective notification preference (accounting for per-event overrides) is `'daily'` and who have `organizer_notification_digest` rows with `digest_sent_at IS NULL` created in the last 24 hours.

**Pass 2 — Weekly digests:** Only execute this pass if today is **Monday**. Find all organizers whose effective preference is `'weekly'` and who have `organizer_notification_digest` rows with `digest_sent_at IS NULL` created in the last 7 days. Skip this pass entirely on all other days.

For each qualifying organizer in either pass:
1. Collect all their pending digest rows, grouped by event.
2. Build and send one digest email covering all their events (use the appropriate subject line — daily vs. weekly).
3. Mark all included rows `digest_sent_at = now()`.

Process in batches of 50 organizers per pass.

**Important:** For events where the organizer has set `notification_override = 'never'`, skip those signups in the digest even if the organizer's global preference would include them.

---

## 9. Edge Cases to Handle

- **Organizer is also the volunteer**: If an organizer signs up for their own event, still insert the digest row but skip sending the notification (check `signup.email === organizer email`).
- **Multiple organizers per event**: The current data model has `organization_members`. If an event's organization has multiple members, send notifications only to the owner (the user with the `owner` role in `organization_members`), unless you want to extend to all members later — leave a TODO comment.
- **Event with no date (simple list, `start_date IS NULL`)**: Notifications still work normally — date/time fields are just omitted from the email body.
- **Organizer deletes account**: `organizer_notification_digest` rows cascade-delete via the foreign key on `user_id`.
- **Signup is cancelled before digest sends**: In the digest query, join back to `signups` and exclude rows where `signups.cancelled = true`. Mark those digest rows `digest_sent_at = now()` as a tombstone so they're not reprocessed.
- **Timezone for digest send time**: Use the organization's timezone to determine "7:00 AM". If `organizations.timezone` is null, default to `'America/New_York'`. The cron runs in UTC — compute which organizations are in a timezone where it's currently ~7 AM and process only those, OR simplify by running at a fixed UTC time that covers your primary user base and document the limitation.
