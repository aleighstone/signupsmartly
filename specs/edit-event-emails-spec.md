# Spec: Edit Event Notification Emails

## Overview

Three new email functions to add to `lib/email.ts`, triggered when an organizer
edits a published event. All three follow the exact same HTML structure and
visual style as existing emails in that file.

**Dependency:** These are called from `app/api/events/[id]/route.ts` as
specified in `specs/edit-event-spec.md`. Implement this spec second, after the
edit event page + API are working.

---

## File to modify

`lib/email.ts` — add three new exported functions at the bottom of the file.

---

## Shared patterns (copy from existing functions)

- `safeFormatDate` helper — copy inline as done in other functions
- `safeFormatTime` helper — copy inline
- Same HTML wrapper: `bg-sand` body, `max-width: 600px`, white card,
  charcoal header with logo + "SignupSmartly" wordmark
- Same green details box: `background-color: #F0F9F0`, row dividers
  `border-bottom: 1px solid #E5F2E5`
- Same footer: `border-top: 1px solid #E5F2E5`, `font-size: 14px`,
  `color: #71717A`

---

## 1. `sendSignupCancelledByOrganizer`

Sent to each volunteer whose signup was removed as part of a slot deletion.

### Function signature

```ts
export async function sendSignupCancelledByOrganizer(params: {
  signup: Signup;
  slot: Slot;
  event: Event;
  reason?: string | null;
}): Promise<void>
```

### Subject

```
SignupSmartly: Your signup for ${event.title} has been cancelled
```

### Email content

**H1:** `Your signup has been cancelled`

**Intro paragraph:**
```
Your sign-up for the following spot has been removed by the event organizer.
```

**Details box rows:**
- **Event:** `{event.title}`
- **Date:** formatted `event.start_date` (omit row if no date)
- **{Spot/Item}:** `{slot.role_name}` (label is "Spot" for scheduled, "Item" for simple)
- **Time:** `{start_time} – {end_time}` (scheduled only, omit if not present)
- **Location:** `{event.location}` (omit row if not set)

**Reason row** (only render if `reason` is non-empty):
```html
<div style="margin-top: 16px; padding: 12px 16px; background-color: #F9F9F9;
     border-radius: 8px; border-left: 3px solid #27272A;">
  <p style="margin: 0; font-size: 14px; color: #27272A;">
    <strong>Note from organizer:</strong> {reason}
  </p>
</div>
```

**No action buttons** — the signup is already cancelled, there is nothing to
click. Do not include a cancel link or manage preferences link.

**Footer:**
```
Questions? Contact the event organizer directly.
```
(Plain text in footer, no link — organizer contact info is not stored.)

### Error handling

```ts
if (error) {
  throw new Error(`Failed to send cancellation email: ${error.message}`);
}
```

---

## 2. `sendEventDateChanged`

Sent to all remaining volunteers when the organizer changes the event's
start or end date.

### Function signature

```ts
export async function sendEventDateChanged(params: {
  signup: Signup;
  slot: Slot;
  event: Event;            // the event with updated dates already applied
  oldStartDate: string | null;
  oldEndDate: string | null;
}): Promise<void>
```

### Subject

```
SignupSmartly: Date update for ${event.title}
```

### Email content

**H1:** `The date for this event has been updated`

**Intro paragraph:**
```
The organizer has updated the date for an event you're signed up for.
Here are the updated details:
```

**Details box rows:**
- **Event:** `{event.title}`
- **Updated date:** formatted `event.start_date` (new date) — label in **bold green** (`color: #15803D`) to draw the eye
- **Previous date:** formatted `oldStartDate` — label in muted style (`color: #71717A`, `text-decoration: line-through` on the date value)
- **{Spot/Item}:** `{slot.role_name}`
- **Time:** `{start_time} – {end_time}` (scheduled only, omit if not present)
- **Location:** `{event.location}` (omit if not set)

**Buttons row** (two side-by-side buttons):

```html
<a href="${generateAddToCalendarUrl({ event, slot, volunteerName: signup.name })}"
   style="display: inline-block; background-color: #15803D; color: #FFFFFF;
          padding: 12px 20px; border-radius: 8px; text-decoration: none;
          font-weight: 600; font-size: 14px;">
  Re-add to Calendar
</a>
<a href="${cancelUrl}"
   style="display: inline-block; background-color: #FFFFFF; color: #27272A;
          padding: 12px 20px; border-radius: 8px; text-decoration: none;
          font-weight: 600; font-size: 14px; border: 2px solid #27272A;">
  Cancel my signup
</a>
```

The cancel link uses the existing `cancelUrl` pattern:
`${APP_URL}/signup/cancel?token=${signup.cancel_token}`

**Footer:**
```
Manage reminder preferences →
[link to ${APP_URL}/signup/preferences?token=${signup.cancel_token}]
```

### Error handling

```ts
if (error) {
  throw new Error(`Failed to send date changed email: ${error.message}`);
}
```

---

## 3. `sendEventLocationChanged`

Sent to all remaining volunteers when the organizer changes the event's
location.

### Function signature

```ts
export async function sendEventLocationChanged(params: {
  signup: Signup;
  slot: Slot;
  event: Event;            // event with updated location already applied
  oldLocation: string | null;
}): Promise<void>
```

### Subject

```
SignupSmartly: Location update for ${event.title}
```

### Email content

**H1:** `The location for this event has been updated`

**Intro paragraph:**
```
The organizer has updated the location for an event you're signed up for.
```

**Details box rows:**
- **Event:** `{event.title}`
- **New location:** `{event.location}` — label in **bold green** (`color: #15803D`)
- **Previous location:** `{oldLocation}` — muted with strikethrough on the value (omit this row if `oldLocation` was null/empty)
- **Date:** formatted `event.start_date` (omit if no date)
- **{Spot/Item}:** `{slot.role_name}`
- **Time:** `{start_time} – {end_time}` (scheduled only)

**Single button:**

```html
<a href="${cancelUrl}"
   style="display: inline-block; background-color: #FFFFFF; color: #27272A;
          padding: 12px 20px; border-radius: 8px; text-decoration: none;
          font-weight: 600; font-size: 14px; border: 2px solid #27272A;">
  Cancel my signup
</a>
```

(No re-add to calendar button here — the date didn't change.)

**Footer:** same manage preferences link as `sendEventDateChanged`.

### Error handling

```ts
if (error) {
  throw new Error(`Failed to send location changed email: ${error.message}`);
}
```

---

## Summary table

| Function | Recipient | Trigger | Key CTA |
|----------|-----------|---------|---------|
| `sendSignupCancelledByOrganizer` | Affected volunteer | Slot deleted with signups | None (informational) |
| `sendEventDateChanged` | All remaining signups | `start_date` or `end_date` changed | Re-add to Calendar + Cancel signup |
| `sendEventLocationChanged` | All remaining signups | `location` changed | Cancel signup |

---

## Notes

- `generateAddToCalendarUrl` is already imported and used in `sendSignupReminder` —
  use the same import
- All three functions should only send if `signup.email` is non-null — the caller
  in `route.ts` already guards this, but add a defensive check inside each function
  as well
- Do not add PostHog tracking — these are transactional system emails
