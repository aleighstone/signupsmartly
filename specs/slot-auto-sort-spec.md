# Spec: Auto-sort Scheduled Slots on Save

## Overview

When an organizer saves a **scheduled** signup (create or edit), slots are sorted
by date then start time before the payload is sent to the API. This means slots
always appear in chronological order on the volunteer-facing signup page and the
organizer's signups view, regardless of the order they were entered in the form.

**Simple list signups are not affected.** Simple list items have no date or time,
so order is entirely at the organizer's discretion. Drag-to-reorder for simple
lists is a separate, lower-priority feature.

---

## Motivation

User feedback from Christine:

> "I accidentally missed a game after I got to the end. Since there isn't an easy
> way to add in a spot in the middle of the listing of volunteer dates, I had to
> delete the spots after the game I missed and then re-enter them all back in."

Auto-sorting on save eliminates this entirely. The organizer can enter slots in
any order and they will always display chronologically.

---

## Sort order

1. `spot_date` ascending (YYYY-MM-DD string comparison works correctly)
2. `start_time` ascending (HH:MM string comparison works correctly)
3. `role_name` ascending as a tiebreaker (two roles at the same date + time)

Slots with no `start_time` sort after slots that have one, on the same date.

---

## Files to modify

| File | Change |
|------|--------|
| `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Sort `scheduledSlots` in `buildPayload()` before mapping to payload |
| `app/create-event/CreateEventForm.tsx` | Sort `data.slots` in `onSubmitScheduled()` before mapping to payload |

No API changes needed. No database schema changes needed.

---

## Implementation

### Shared sort helper

Define this once at the top of each file (or in a shared util if preferred):

```ts
function sortScheduledSlots<T extends { spot_date?: string; start_time?: string; role_name: string }>(
  slots: T[]
): T[] {
  return [...slots].sort((a, b) => {
    const dateA = a.spot_date ?? '';
    const dateB = b.spot_date ?? '';
    if (dateA !== dateB) return dateA < dateB ? -1 : 1;

    const timeA = a.start_time ?? 'ZZ'; // no time sorts last
    const timeB = b.start_time ?? 'ZZ';
    if (timeA !== timeB) return timeA < timeB ? -1 : 1;

    return a.role_name.localeCompare(b.role_name);
  });
}
```

Note: `'ZZ'` sorts after any valid HH:MM string, placing no-time slots last
within the same date. Use a copy (`[...slots]`) to avoid mutating React Hook
Form state.

---

### 1. `EditEventForm.tsx` — `buildPayload()`

Current code (lines ~244–257):
```ts
const slotsPayload = scheduledSlots.map((s) => {
  ...
});
```

Change to:
```ts
const sortedSlots = sortScheduledSlots(scheduledSlots);
const slotsPayload = sortedSlots.map((s) => {
  ...
});
```

Also update the `startDate` / `endDate` derivation just above it to use
`sortedSlots` instead of `scheduledSlots`, so `startDate = sortedSlots[0]` is
reliably the earliest date:

```ts
const sortedSlots = sortScheduledSlots(scheduledSlots);
const dates = sortedSlots.map((s) => s.spot_date).filter(Boolean) as string[];
const startDate = dates.length ? dates[0] : null;
const endDate =
  dates.length
    ? dates.length === 1
      ? dates[0]
      : dates.reduce((a, b) => (a > b ? a : b))
    : null;

const slotsPayload = sortedSlots.map((s) => { ... });
```

---

### 2. `CreateEventForm.tsx` — `onSubmitScheduled()`

Current code (lines ~369–373):
```ts
const dates = data.slots.map((s) => s.spot_date).filter(Boolean);
const startDate = dates.length ? dates[0] : null;
```

Change to sort first:
```ts
const sortedSlots = sortScheduledSlots(data.slots);
const dates = sortedSlots.map((s) => s.spot_date).filter(Boolean);
const startDate = dates.length ? dates[0] : null;
const endDate = ...  // same logic, uses sortedSlots dates

// Then use sortedSlots.map(...) instead of data.slots.map(...) for the
// slots array in the fetch body
```

---

## What the organizer experiences

- **No visible change during editing** — the form continues to show slots in the
  order they were entered. The form is a scratch pad; sorting is a save-time
  operation.
- **After save** — the organizer lands on the signups page where slots appear in
  chronological order. This is the "result" confirmation.
- **On re-edit** — slots load back into the edit form in sorted order (they are
  fetched from the DB in the order stored, which is now sorted).
- **No toast or notification needed** — the sorted result is self-evident.

---

## Edge cases

| Case | Behaviour |
|------|-----------|
| All slots same date, no times | Sort by role_name only |
| Some slots have times, some don't | Timed slots sort first within a date, untimed sort last |
| Two identical date + time + name | Stable sort preserves entry order (not a real-world concern) |
| Single slot | No-op |
| Slots with no date (validation should prevent this) | Sort to front (empty string sorts before any date) — safe to ignore |

---

## What's New entry

Add to `data/changelog.ts` under a new release date once shipped:

```ts
{
  date: 'April 2, 2026',
  changes: [
    {
      type: 'improved',
      text: 'Scheduled spots now sort automatically by date and time when you save — so you can enter spots in any order and they\'ll always appear chronologically.',
    },
  ],
},
```

---

## Out of scope

- Drag-to-reorder for simple list signups (separate spec, lower priority)
- Sorting the form fields in real time as the organizer types
- Any backend / API changes
