# Email Notification Improvements — Spec

Two small, independent improvements to the email notification system.

---

## Feature 4 — Confirmation Email: Link Event Name to Signup Page

### What
In the volunteer confirmation email, the event name should be a hyperlink to the public signup page (`/event/[id]`).

### Why
Volunteers often want to revisit the signup page after signing up — to check details, see who else signed up, or share with a friend. The confirmation email is the natural place to provide that link.

### Where
File: `lib/email.ts` (or wherever `sendSignupConfirmation` / the confirmation email template lives).

Find the place where the event title is rendered in the confirmation email body and wrap it in an anchor tag.

### Behaviour
- The event name text becomes a clickable link: `<a href="{APP_URL}/event/{eventId}">{event.title}</a>`
- Use `process.env.NEXT_PUBLIC_APP_URL` as the base URL (already used elsewhere in email templates)
- The link should open in a new tab (standard for email links: `target="_blank"`)
- Applies to all confirmation emails regardless of signup type (scheduled or simple list)

### What does NOT change
- Email subject line
- Any other email template (reminders, organizer digest, founder digest)
- The cancel link (already present and separate)

### QA
1. Sign up for a slot → receive confirmation email → event name is a link → clicking it opens the correct public signup page
2. Simple list signup → same behaviour
3. Link uses production app URL in production, not localhost

---

## Feature 8 — Reminders: Additional Timing Options

### What
Currently volunteers can choose between two reminder timing options:
- 1 day before
- Morning of

Add more options:
- **1 week before** (7 days)
- **3 days before**
- Keep existing: **1 day before**, **Morning of**

### Where

**Database:** The `reminder_offset` column on the `signups` table is likely an enum or string. Add the new values:
- `1_week` — 7 days before the slot/event start
- `3_days` — 3 days before

Check the current type definition in `types/database.ts` and the Supabase migration files.

**Migration:** Add a new migration to extend the enum or check constraint on `reminder_offset`.

**UI — Signup modal** (`components/SignupModal.tsx` or similar):
Add the new options to the reminder timing dropdown/select, in order:
1. 1 week before
2. 3 days before
3. 1 day before ← current default
4. Morning of

**Email processing** (`app/api/reminders/process/route.ts`):
In `computeSendTime()`, add cases for the new offsets:

```ts
if (offset === '1_week') {
  const baseIso = slot.start_time || event.start_date!;
  const base = getDateInTz(baseIso);
  return new Date(base.getTime() - 7 * 24 * 60 * 60 * 1000);
}

if (offset === '3_days') {
  const baseIso = slot.start_time || event.start_date!;
  const base = getDateInTz(baseIso);
  return new Date(base.getTime() - 3 * 24 * 60 * 60 * 1000);
}
```

### Default value
Keep `1_day` as the default — no change to existing signups.

### Existing signups
No migration of existing data needed. Existing `reminder_offset` values (`1_day`, `morning_of`) remain valid and continue to work.

### What does NOT change
- The reminder email template itself
- The opt-in checkbox behaviour
- The `reminder_sent_at` / tombstone logic

### QA
1. Sign up for a slot → select "1 week before" → cron runs → reminder arrives ~7 days before
2. Sign up → select "3 days before" → reminder arrives ~3 days before
3. Existing "1 day before" and "Morning of" options still work
4. Dropdown shows all 4 options in correct order
5. New option values are saved correctly to DB (check Supabase Studio after signup)

---

## Files to Change Summary

| File | Change |
|---|---|
| `lib/email.ts` (or confirmation email template) | Wrap event title in `<a>` link to signup page |
| `components/SignupModal.tsx` (or reminder select) | Add 1 week / 3 days options to dropdown |
| `app/api/reminders/process/route.ts` | Add `1_week` and `3_days` cases to `computeSendTime()` |
| `types/database.ts` | Add new values to `reminder_offset` type |
| `supabase/migrations/` | New migration to extend `reminder_offset` enum/constraint |
