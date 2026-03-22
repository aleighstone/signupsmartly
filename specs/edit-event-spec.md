# Spec: Edit Event — Page + API

## Overview

Allow organizers to edit a published event's details and slots from a dedicated
edit page at `/dashboard/event/[id]/edit`. Entry points are a new "Edit" button
on the dashboard event card and a text link on the signups page.

The signup type (`scheduled` vs `simple`) **cannot be changed** after creation —
it is displayed as read-only on the edit form.

---

## Files to create / modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `app/api/events/[id]/route.ts` | PATCH endpoint — update event + slots |
| Create | `app/dashboard/event/[id]/edit/page.tsx` | Server component wrapper — loads data |
| Create | `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Client component — the form |
| Modify | `app/dashboard/page.tsx` | Add Edit CTA to event card |
| Modify | `app/dashboard/event/[id]/signups/page.tsx` | Add Edit event text link |

---

## 1. Edit CTA placements

### Dashboard event card (`app/dashboard/page.tsx`)

In the button row that currently has "View My Signups" and "Signup Page", add a
third button **after** "Signup Page":

```tsx
<Link
  href={`/dashboard/event/${event.id}/edit`}
  className="rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body"
>
  Edit
</Link>
```

### Signups page (`app/dashboard/event/[id]/signups/page.tsx`)

Below the event title and date on the left side of the header, add a subtle
text link:

```tsx
<Link
  href={`/dashboard/event/${id}/edit`}
  className="text-sm text-muted hover:text-charcoal transition-colors font-body"
>
  Edit event →
</Link>
```

Place it directly after the `<p>` that shows the formatted date range.

---

## 2. Edit page server component (`app/dashboard/event/[id]/edit/page.tsx`)

Server component. Auth-guards the same way as the signups page — redirect to
login if no user.

Fetch the event with its slots using the existing
`getEventWithSlotsForDashboard(id)` function. If not found, call `notFound()`.

Pass the event data to `<EditEventForm>` as a prop.

Page layout uses `<AppLayout>` with a "← Back to signups" link at the top
pointing to `/dashboard/event/${id}/signups`.

```tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getEventWithSlotsForDashboard } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { EditEventForm } from './EditEventForm';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/event/${id}/edit`);

  const event = await getEventWithSlotsForDashboard(id);
  if (!event) notFound();

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href={`/dashboard/event/${id}/signups`} className="text-sm text-muted hover:text-charcoal transition-colors">
          ← Back to signups
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-charcoal font-heading mb-6">Edit signup</h1>
      <EditEventForm event={event} />
    </AppLayout>
  );
}
```

---

## 3. EditEventForm client component (`app/dashboard/event/[id]/edit/EditEventForm.tsx`)

`'use client'` component. Uses `react-hook-form` + `zod` matching the patterns
in `CreateEventForm.tsx`.

### Props

```ts
interface EditEventFormProps {
  event: EventWithSlots; // from @/types/database
}
```

### Form fields

**Event details section:**
- Title (required text input)
- Description (optional textarea)
- Location (optional for simple, shown for both)
- Start date (date input, optional)
- End date (date input, optional, only show if signup_type === 'scheduled')
- Signup type: **read-only display** — show as a small badge/label, not an input. e.g. `Scheduled` or `Simple list`. Add a note: "Signup type cannot be changed after creation."

**Terminology — derive from `signup_type` and use consistently throughout the form:**

```ts
const isSimple = event.signup_type === 'simple';
const slotLabel = isSimple ? 'Item' : 'Spot';      // singular
const slotsLabel = isSimple ? 'Items' : 'Spots';   // plural
```

Use `slotLabel` / `slotsLabel` everywhere in the UI — section headings, button
labels, input labels, error messages, and the confirmation modal. Never use the
word "slot" in user-visible text.

**Slots section:**

Section heading: `{slotsLabel}` (e.g. "Spots" or "Items")

Render each existing slot as an editable row. Each row shows:
- `{slotLabel} name` label on the text input (e.g. "Spot name" or "Item name")
- Capacity (number input, min 1), labelled "Capacity"
- Start time / end time (only for scheduled type)
- A delete button (trash icon or "Remove" link)

Below the slot list, an `Add {slotLabel}` button appends a new blank slot row
(e.g. "Add Spot" or "Add Item").

### Slot deletion logic (client-side)

When the organizer clicks delete on a slot:

- If the slot has **no signups** (`slot.signups.length === 0`): remove it from the
  form state immediately, no confirmation needed.

- If the slot has **signups**: open a confirmation modal (see below). Do not
  remove from form state until confirmed.

**Slot delete confirmation modal:**

```
Title: "Remove this {slotLabel}?"
Body:  "The following volunteers will have their signup cancelled and
        will be notified by email:"
       [bullet list of volunteer names]
       Optional reason field (textarea, placeholder: "Reason for removal (optional — included in notification email)")
Buttons: [Cancel]  [Remove {slotLabel} and notify volunteers]
```

### Capacity validation (client-side)

On blur of the capacity field, if the new value is less than the number of
existing signups for that slot, show an inline error beneath the field:

```
"This {slotLabel.toLowerCase()} has {n} volunteer(s) signed up. Capacity cannot be below {n}."
```

e.g. "This spot has 3 volunteer(s) signed up. Capacity cannot be below 3."

Disable the Save button while any slot has a capacity error.

### Save behaviour

On submit, send a `PATCH /api/events/[id]` request with:

```ts
{
  title: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  slots: {
    id?: string;          // existing slots have an id; new slots omit it
    role_name: string;
    capacity: number;
    start_time?: string | null;  // scheduled only
    end_time?: string | null;    // scheduled only
  }[];
  deleted_slot_ids: {
    id: string;
    reason?: string | null;  // from the confirmation modal
  }[];
}
```

On success: redirect to `/dashboard/event/${id}/signups` using `router.push`.

On error: show an error banner at the top of the form.

---

## 4. PATCH API route (`app/api/events/[id]/route.ts`)

### Auth + ownership

Verify the user is authenticated. Verify they own the event:

```ts
const { data: event } = await supabase
  .from('events')
  .select('id, organization_id, start_date, end_date, location, title')
  .eq('id', id)
  .single();

// Check user is a member of the event's org
const { data: membership } = await serviceSupabase
  .from('organization_members')
  .select('id')
  .eq('organization_id', event.organization_id)
  .eq('user_id', user.id)
  .maybeSingle();

if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

### Request schema (Zod)

```ts
const patchEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  slots: z.array(z.object({
    id: z.string().uuid().optional(),
    role_name: z.string().min(1),
    capacity: z.number().min(1),
    start_time: z.string().nullable().optional(),
    end_time: z.string().nullable().optional(),
  })),
  deleted_slot_ids: z.array(z.object({
    id: z.string().uuid(),
    reason: z.string().nullable().optional(),
  })).optional(),
});
```

### Processing order

**Step 1 — Check for date/location changes** (store for email triggers later):
```ts
const dateChanged =
  parsed.start_date !== event.start_date || parsed.end_date !== event.end_date;
const locationChanged = parsed.location !== event.location;
```

**Step 2 — Update event metadata:**
```ts
await supabase.from('events').update({
  title, description, location, start_date, end_date,
}).eq('id', id);
```

**Step 3 — Process slot deletions:**

For each id in `deleted_slot_ids`:
- Fetch all signups for that slot (need name, email, cancel_token)
- Delete all signups for that slot
- Delete the slot
- Collect the cancelled signups for email sending

**Step 4 — Process slot upserts:**

For slots with an `id`: update `role_name`, `capacity`, `start_time`, `end_time`.
For slots without an `id`: insert as new slot with `event_id`.

**Step 5 — Trigger emails (non-blocking, fire-and-forget):**

```ts
// Wrap all email sending in a single non-blocking try/catch
try {
  const { sendSignupCancelledByOrganizer, sendEventDateChanged, sendEventLocationChanged } =
    await import('@/lib/email');

  // Cancellation emails for each deleted signup
  for (const { signup, slot, reason } of cancelledSignups) {
    if (signup.email) {
      await sendSignupCancelledByOrganizer({ signup, slot, event: updatedEvent, reason });
    }
  }

  // Date change notification to all remaining signups
  if (dateChanged) {
    for (const { signup, slot } of remainingSignups) {
      if (signup.email) {
        await sendEventDateChanged({
          signup, slot, event: updatedEvent,
          oldStartDate: event.start_date,
          oldEndDate: event.end_date,
        });
      }
    }
  }

  // Location change notification to all remaining signups
  if (locationChanged) {
    for (const { signup, slot } of remainingSignups) {
      if (signup.email) {
        await sendEventLocationChanged({
          signup, slot, event: updatedEvent,
          oldLocation: event.location,
        });
      }
    }
  }
} catch (emailErr) {
  console.error('Edit event emails failed (non-blocking):', emailErr);
}
```

**Step 6 — Return success:**
```ts
return NextResponse.json({ id });
```

### Error handling

- 400 if schema validation fails
- 401 if not authenticated
- 403 if user doesn't own the event
- 409 if any slot would have capacity below its current signup count (double-check server-side even though client validates)
- 500 on unexpected error (use existing `reportProductionError`)

---

## 5. PostHog events

| Event | Properties | Trigger |
|-------|-----------|---------|
| `event_edited` | `event_id`, `date_changed`, `location_changed`, `slots_deleted`, `slots_added` | On successful PATCH |

Track in the `EditEventForm` client component after a successful save.

---

## Notes

- Do not allow changing `signup_type` — display it read-only only
- Slot deletion cascade (deleting signups) must use `serviceSupabase` to bypass RLS
- The `remainingSignups` query (for date/location notifications) should fetch all
  signups across all slots that are NOT in the deleted set
- Keep the `EditEventForm` in a separate file from the page — the form is a client
  component and the page is a server component
