# Cursor Prompt — Feature: Volunteer Reminder Emails

## Context

SignupSmartly is a Next.js 14 (App Router) + TypeScript app using Supabase (Postgres + Auth), Resend for transactional email, Tailwind CSS, and Vercel for deployment. Volunteers sign up without an account. Organizers have Supabase auth accounts.

This prompt implements **volunteer reminder emails**: opt-in reminders sent to volunteers before their signed-up event slot, with timing they choose at signup.

---

## 1. Database Changes

Add the following columns to the `signups` table:

```sql
ALTER TABLE signups
  ADD COLUMN reminder_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN reminder_offset text NOT NULL DEFAULT '1_day'
    CHECK (reminder_offset IN ('1_day', 'morning_of', '1_hour')),
  ADD COLUMN reminder_sent_at timestamptz NULL;
```

> `reminder_offset` values:
> - `'1_day'` — send 24 hours before the slot start time (or event date if no time)
> - `'morning_of'` — send at 8:00 AM on the day of the slot (in the event's organization timezone)
> - `'1_hour'` — send 1 hour before the slot start time (only meaningful when a start_time exists; fall back to `morning_of` behavior if no time)

---

## 2. Signup Modal UI (`/event/[id]` page)

Below the existing **Comment** field in the signup modal, add a reminder preferences row:

- A checkbox: **"Send me a reminder email"** — checked by default (`reminder_opt_in = true`)
- When checked, show an inline dropdown immediately to the right or below:
  - "1 day before" (default)
  - "Morning of the event"
  - "1 hour before"
- When unchecked, hide the dropdown
- Apply existing Tailwind design system styles (Inter body font, sand/charcoal color tokens, `btn-primary` / `btn-secondary` sizing conventions)

Pass `reminder_opt_in` and `reminder_offset` to the existing signup POST handler and persist them to the `signups` row.

---

## 3. Manage Preferences Page (`/signup/preferences`)

Create a new page at `/signup/preferences?token=[cancel_token]`.

This page is linked from the footer of every confirmation email and every reminder email as **"Manage reminder preferences"**.

### Behavior
- Look up the signup by `cancel_token` (same token used for cancellation). Return a 404-style message if not found or already cancelled.
- Display the event name, slot/item name, and current reminder preference.
- Let the volunteer:
  - Toggle the reminder on/off
  - Change the timing (dropdown: same three options as above)
  - Save changes (PATCH `/api/signup/preferences`)
- Show a success message on save. No redirect needed.

### API
```
PATCH /api/signup/preferences
Body: { token: string, reminder_opt_in: boolean, reminder_offset: string }
Response: 200 OK or error
```

Validate `reminder_offset` against the allowed enum values server-side.

---

## 4. Email: Reminder

Create a new Resend email template for the reminder. Reuse the existing email layout/styling used for confirmation emails.

### Subject
- Scheduled: `Reminder: You're signed up for [Spot Name] on [Date]`
- Simple list: `Reminder: You're signed up to bring [Item Name] to [Event Title]`

### Body
Mirror the confirmation email structure, but open with a reminder framing:

- Heading: "Just a reminder — you're signed up!"
- Show the same fields as the confirmation email (Spot or Item, date, time if applicable, event, location)
- CTA buttons: **"Add to Calendar"** (Google Calendar link, same logic as confirmation) and **"Cancel signup"** (cancel token link)
- Footer link: "Manage reminder preferences" → `/signup/preferences?token=[cancel_token]`

---

## 5. Reminder Processing — Cron Job

Create a Vercel cron job that runs **every hour** (`0 * * * *` in `vercel.json`).

### Endpoint
```
POST /api/reminders/process
```
This endpoint should be protected — only callable by Vercel cron (check `Authorization: Bearer` header against an env var `CRON_SECRET`).

### Logic

For each `signup` where:
- `cancelled = false`
- `reminder_opt_in = true`
- `reminder_sent_at IS NULL`

Join to `slots` → `events` → `organizations` (for timezone).

Compute the **send-at time** based on `reminder_offset`:
- `'1_day'`: slot `start_time` on the slot `date` minus 24 hours. If no `start_time`, use midnight of the slot date minus 24 hours.
- `'morning_of'`: 8:00 AM in `organizations.timezone` on the slot/event date.
- `'1_hour'`: slot `start_time` minus 1 hour. If no `start_time`, fall back to `morning_of` logic.

For simple list events with no date (`start_date IS NULL`): skip — no reminder can be scheduled without a date.

If the computed send-at time is in the past **and within the last 2 hours** (to avoid sending stale reminders for missed windows), send the reminder email via Resend and set `reminder_sent_at = now()`.

Process in batches of 50 signups per cron run to stay within Resend's rate limits.

### Error handling
- If Resend returns an error for a specific signup, log the error but continue processing others. Do not mark `reminder_sent_at` so it will be retried next hour.
- If the slot/event date has already passed, skip and mark `reminder_sent_at = now()` (tombstone) so it's not reprocessed.

---

## 6. Confirmation Email Update

In the existing signup confirmation email, add a footer line:
> "Want to change your reminder settings? [Manage reminder preferences]"
Link to `/signup/preferences?token=[cancel_token]`.

---

## 7. Edge Cases to Handle

- **Simple list with no date**: Do not show reminder preferences in the signup modal (or show them greyed out with a note: "Reminders are only available for events with a date"). Skip in cron processing.
- **Slot with no start_time and `reminder_offset = '1_hour'`**: Fall back to `morning_of` behavior; do not error.
- **Organizer timezone**: Always resolve reminder send time using `organizations.timezone`. Default to `'America/New_York'` if timezone is null.
- **Cancellation before reminder sends**: Cron query already filters `cancelled = false`, so cancelled signups are naturally skipped.
- **Multiple signups by same email**: Each signup row is independent with its own `reminder_opt_in` and `reminder_sent_at`. No deduplication needed.
