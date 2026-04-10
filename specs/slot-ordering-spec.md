# Spec: Slot Ordering

## Overview

Organizers can control the display order of slots/items on the public signup
page using up/down controls in the create and edit forms. A new `sort_order`
column persists the organizer's chosen order.

---

## Current behavior (being replaced)

- **Simple lists** — currently sorted alphabetically by `role_name` on the
  public page. This was implicit and unintentional; creation order is more
  useful as a default.
- **Scheduled events** — sorted by `start_time`, then `end_time`, then
  `role_name`. The time-based primary sort is correct and stays. The
  `role_name` tiebreaker is replaced by `sort_order`.

---

## New sort behavior on the public page

### Simple lists
1. `sort_order ASC` (organizer-defined)
2. `created_at ASC` as tiebreaker (handles existing slots with no sort_order)

### Scheduled events
1. `start_time ASC` (unchanged — time ordering is always primary)
2. `sort_order ASC` within same `start_time` group (replaces role_name tiebreaker)
3. `role_name` as final tiebreaker (handles existing slots with no sort_order)

The key principle: organizer ordering only controls position *within* a
same-time group for scheduled events. An 8am slot will always appear before
a 9am slot regardless of sort_order.

---

## Database migration

Add a nullable integer column to `slots`:

```sql
ALTER TABLE slots ADD COLUMN sort_order INTEGER;
```

Nullable intentionally — existing slots have no sort_order and the sort
logic handles nulls gracefully using tiebreakers. No backfill required.

---

## How sort_order is assigned on save

The form manages ordering by array position (the up/down controls swap items
in the form array). On save, `sort_order` is assigned as the slot's current
array index (0, 1, 2...). This is simple and correct.

**Consequence:** `sortScheduledSlotsForSave` in `lib/slot-utils.ts` currently
sorts slots by date/time before building the API payload. This sort must be
**removed** from the save path — the array order now reflects organizer intent
and must not be re-sorted before saving. The `sortScheduledSlotsForSave`
function can be deleted or kept as a utility but must not be called during save.

---

## Up/down controls in the form

### Placement
Controls appear in the slot card header, to the left of the trash icon:

```
[ChevronUp] [ChevronDown] [Trash2]
```

The trash icon replaces the current text "Remove" button in all slot cards
across both create and edit forms.

### Visibility
All three controls only render when there are 2 or more slots. With a single
slot, show nothing (same rule as current "Remove" behavior).

### Disabled states
- `ChevronUp` is **visible but disabled** when the slot is first in the list (index 0)
- `ChevronDown` is **visible but disabled** when the slot is last in the list
- Disabled buttons use reduced opacity (`opacity-40`) and `cursor-not-allowed`

### Behavior
Clicking up/down swaps the slot with its neighbor in the form array using
react-hook-form's `swap()` method from `useFieldArray`. No sort_order value
is stored in form state — order is purely positional in the array.

### Icon sizes
Use `size={14}` on all three Lucide icons to stay visually balanced with the
surrounding text in the slot card header.

---

## Files to change

| File | Change |
|---|---|
| `supabase/migrations/[timestamp]_slot_sort_order.sql` | New migration adding `sort_order` column |
| `lib/slot-utils.ts` | Update `sortSlotsForVolunteerDisplay` for both types; delete or deprecate `sortScheduledSlotsForSave` |
| `app/create-event/CreateEventForm.tsx` | Add up/down/trash controls to scheduled and simple slot cards; remove `sortScheduledSlotsForSave` call; assign sort_order on save |
| `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Same controls; same sort_order assignment on save |
| `types/database.ts` | Add `sort_order: number \| null` to slot type if manually typed |

---

## What is NOT changing

- The public `SlotList` component does not change — ordering is handled by
  `sortSlotsForVolunteerDisplay` before slots are passed to it
- The separation of open vs. filled slots on the public page is unchanged —
  sort_order applies within each group, not across them
- Drag-and-drop is explicitly out of scope
- No "reset to default order" option in v1
