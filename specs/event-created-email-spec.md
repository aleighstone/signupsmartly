# Spec: Event Created Confirmation Email

## Overview

When an organizer creates a new event, send them a confirmation email with key links so they have a paper trail and easy access to share the signup page and manage their event.

---

## Files to modify

- `lib/email.ts` — add `sendEventCreatedConfirmation()` function
- `app/api/events/route.ts` — call the new function after successful event creation

---

## 1. Add `sendEventCreatedConfirmation()` to `lib/email.ts`

Add the following new exported function at the end of `lib/email.ts`, following the same HTML email pattern used by `sendOrganizerInstantNotification`.

### Function signature

```ts
export async function sendEventCreatedConfirmation(params: {
  organizerEmail: string;
  eventId: string;
  eventTitle: string;
  startDate: string | null;
  endDate: string | null;
  signupType: 'scheduled' | 'simple';
}): Promise<void>
```

### Subject line

```
SignupSmartly: Your signup "${eventTitle}" is ready
```

### Email content

**Header:** Same dark charcoal header with logo as all other emails.

**H1:** `Your signup is ready to share!`

**Details box** (`bg: #F0F9F0`, same green tint as other emails):
- **Event:** `{eventTitle}`
- **Date:** formatted start date if present (use `safeFormatDate` helper — copy the same inline helper used in the other functions). If `endDate` is different from `startDate`, show range as `{startDate} – {endDate}`. If no date, omit this row entirely.
- **Type:** `Scheduled sign-up` if `signupType === 'scheduled'`, `Simple sign-up list` if `signupType === 'simple'`

**Signup URL section** — render the public signup URL as selectable plain text (not a hyperlink) so the organizer can easily copy and paste it into their own email to volunteers. Then a single "View Signups" button below.

```html
<p style="margin: 0 0 8px; color: #27272A;">Here is the link to your public signup page:</p>
<p style="margin: 0 0 24px; font-family: monospace; font-size: 14px; color: #15803D; word-break: break-all;">${signupUrl}</p>
<a href="${signupsUrl}" style="display: inline-block; background-color: #FFFFFF; color: #27272A; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; border: 2px solid #27272A;">View Signups</a>
```

The URL must **not** be wrapped in an `<a>` tag — keep it as a plain text `<p>` so it is easy to select and copy without accidentally navigating. The green monospace styling (`#15803D`) makes it visually distinct from the surrounding text.

**Footer** (same border-top footer style as other emails):
```
Manage notification settings → [link to ${APP_URL}/dashboard/settings]
```

### Full HTML template

Use the exact same wrapper structure as `sendOrganizerInstantNotification`:
- `background-color: #FAF9F6` body
- `max-width: 600px` centered container
- White card with `border-radius: 12px` and soft shadow
- Charcoal `#27272A` header with logo + "SignupSmartly" wordmark
- `padding: 24px` content area
- Green tint details box `#F0F9F0` with `border-bottom: 1px solid #E5F2E5` row dividers
- Footer `border-top: 1px solid #E5F2E5`, `font-size: 14px`, `color: #71717A`

### Error handling

Use the same pattern as the rest of the file — throw on error:
```ts
if (error) {
  throw new Error(`Failed to send event created email: ${error.message}`);
}
```

---

## 2. Update `app/api/events/route.ts`

After the slots insert succeeds (after line `if (slotsError) throw slotsError;`) and before `return NextResponse.json({ id: eventRow.id })`, add a non-blocking fire-and-forget email call:

```ts
// Send event created confirmation email (non-blocking)
try {
  const { sendEventCreatedConfirmation } = await import('@/lib/email');
  await sendEventCreatedConfirmation({
    organizerEmail: user.email!,
    eventId: eventRow.id,
    eventTitle: parsed.data.title,
    startDate: parsed.data.start_date ?? null,
    endDate: parsed.data.end_date ?? null,
    signupType: parsed.data.signup_type ?? 'scheduled',
  });
} catch (emailErr) {
  // Log but don't fail the request — event was created successfully
  console.error('Event created email failed (non-blocking):', emailErr);
}
```

**Important:** The email failure must not cause the API route to return an error. The event is already created at this point — a failed email should only log, never block the response.

---

## Notes

- `user.email` is always available here because the route already checks `if (!user)` at the top and returns 401
- No new API routes, no DB changes, no new env vars needed
- The `safeFormatDate` helper is duplicated in several functions in `email.ts` — copy it inline as done elsewhere, or optionally refactor it to a shared private helper at the top of the file (optional cleanup)
- PostHog tracking is not needed for this email — it's a transactional system email, not a user action
