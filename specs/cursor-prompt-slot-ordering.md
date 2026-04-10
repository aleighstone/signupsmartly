# Cursor Prompt: Slot Ordering

## What to build

Add up/down reordering controls to slot cards in the create and edit forms.
Organizers click ChevronUp/ChevronDown to reorder slots. A new `sort_order`
column persists the order. The public page respects it.

Install lucide-react if not already installed:
```bash
npm install lucide-react
```

---

## Step 1 — Database migration

Create `supabase/migrations/20260410000000_slot_sort_order.sql`:

```sql
ALTER TABLE slots ADD COLUMN sort_order INTEGER;
```

---

## Step 2 — Update `lib/slot-utils.ts`

### 2a — Delete `sortScheduledSlotsForSave`

Remove the `sortScheduledSlotsForSave` function entirely. It is no longer
used — slot order is now controlled explicitly by the organizer and must not
be re-sorted before saving.

### 2b — Rewrite `sortSlotsForVolunteerDisplay`

Replace the existing implementation with:

```ts
export function sortSlotsForVolunteerDisplay(
  slots: SlotWithSignups[],
  signupType: 'scheduled' | 'simple'
): SlotWithSignups[] {
  const copy = [...slots];
  if (signupType === 'simple') {
    // Primary: sort_order ASC (nulls last), tiebreak: created_at ASC
    copy.sort((a, b) => {
      const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return copy;
  }
  // Scheduled: primary sort by start_time, then sort_order within same time
  copy.sort((a, b) => {
    const byStart = startTimeSortMs(a) - startTimeSortMs(b);
    if (byStart !== 0) return byStart;
    const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.role_name.localeCompare(b.role_name, undefined, { sensitivity: 'base' });
  });
  return copy;
}
```

---

## Step 3 — Update `types/database.ts`

Add `sort_order: number | null` to the slot type definition. Search for the
`Slot` or `SlotWithSignups` interface and add the field. If types are
auto-generated from Supabase, add it manually for now.

---

## Step 4 — Update `app/create-event/CreateEventForm.tsx`

### 4a — Remove the `sortScheduledSlotsForSave` import and all calls to it

Search for `sortScheduledSlotsForSave` and remove the import and any calls.
Slots are now saved in array order — do not re-sort before building the
API payload.

### 4b — Add move handlers

The forms use `setValue` manually (not `useFieldArray`). Add these handlers
alongside the existing `removeScheduledSlot` and `removeSimpleSlot`:

```ts
const moveScheduledSlot = (index: number, direction: 'up' | 'down') => {
  const slots = scheduledForm.getValues('slots');
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= slots.length) return;
  const updated = [...slots];
  [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
  scheduledForm.setValue('slots', updated);
};

const moveSimpleSlot = (index: number, direction: 'up' | 'down') => {
  const slots = simpleForm.getValues('slots');
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= slots.length) return;
  const updated = [...slots];
  [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
  simpleForm.setValue('slots', updated);
};
```

### 4c — Assign sort_order on save

When building the slots payload for the API, assign `sort_order` as the
array index. For both scheduled and simple save paths, add:
```ts
sort_order: index,
```
to each slot in the `.map((s, index) => ({ ... }))` call.

### 4d — Replace "Remove" buttons with icon controls in scheduled slot cards

Find the slot card header that contains the `Remove` button for scheduled
slots (around line 731). Replace it with:

```tsx
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

{scheduledSlots.length > 1 && (
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={() => moveScheduledSlot(index, 'up')}
      disabled={index === 0}
      className="p-1 text-muted hover:text-charcoal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      aria-label="Move up"
    >
      <ChevronUp size={14} />
    </button>
    <button
      type="button"
      onClick={() => moveScheduledSlot(index, 'down')}
      disabled={index === scheduledSlots.length - 1}
      className="p-1 text-muted hover:text-charcoal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      aria-label="Move down"
    >
      <ChevronDown size={14} />
    </button>
    <button
      type="button"
      onClick={() => removeScheduledSlot(index)}
      className="p-1 text-muted hover:text-coral transition-colors"
      aria-label="Remove slot"
    >
      <Trash2 size={14} />
    </button>
  </div>
)}
```

### 4e — Same replacement for simple list slot cards

Find the `Remove` button for simple slots (around line 992) and apply the
same pattern using `moveSimpleSlot` and `removeSimpleSlot`, with
`simpleSlots.length > 1` as the condition.

---

## Step 5 — Update `app/dashboard/event/[id]/edit/EditEventForm.tsx`

### 5a — Remove the `sortScheduledSlotsForSave` import and all calls to it

Same as Step 4a.

### 5b — Add move handlers

The edit form has a single `removeSlot` handler shared between slot types.
Add move handlers similarly:

```ts
const moveSlot = (index: number, direction: 'up' | 'down', type: 'scheduled' | 'simple') => {
  if (type === 'scheduled') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= scheduledSlots.length) return;
    const updated = [...scheduledSlots];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setScheduledSlots(updated);
  } else {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= simpleSlots.length) return;
    const updated = [...simpleSlots];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSimpleSlots(updated);
  }
};
```

Adapt this to match exactly how the edit form manages slot state — look at
how `removeSlot` / `doRemoveSlot` mutate state and follow the same pattern.

### 5c — Assign sort_order on save

Same as Step 4c — add `sort_order: index` to each slot in the save payload.

### 5d — Replace "Remove" text buttons with icon controls

The edit form has slot card components (`ScheduledSlotCard` and
`SimpleSlotCard` or similar) that receive `onRemove` as a prop. Find the
"Remove" button inside those components (around lines 670 and 823) and
replace with the same three-icon pattern:

```tsx
{totalSlots > 1 && (
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={() => onMoveUp?.()}
      disabled={isFirst}
      className="p-1 text-muted hover:text-charcoal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      aria-label="Move up"
    >
      <ChevronUp size={14} />
    </button>
    <button
      type="button"
      onClick={() => onMoveDown?.()}
      disabled={isLast}
      className="p-1 text-muted hover:text-charcoal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      aria-label="Move down"
    >
      <ChevronDown size={14} />
    </button>
    <button
      type="button"
      onClick={() => onRemove(index)}
      className="p-1 text-muted hover:text-coral transition-colors"
      aria-label="Remove slot"
    >
      <Trash2 size={14} />
    </button>
  </div>
)}
```

Add `onMoveUp`, `onMoveDown`, `isFirst`, `isLast`, and `totalSlots` props
to the slot card component interfaces as needed.

---

## Important constraints

- **Do not use `useFieldArray`** — both forms manage slot arrays manually
  with `setValue` / local state. Stick to the same pattern.
- **Do not re-sort slots before saving** — array order is the source of
  truth. Remove all calls to `sortScheduledSlotsForSave`.
- **ChevronUp is disabled (not hidden) at index 0.** ChevronDown is disabled
  (not hidden) at the last index. Both icons always render when there are
  multiple slots.
- **All three controls (up, down, trash) only render when there are 2 or
  more slots.** With a single slot show nothing.
- **The trash icon replaces the text "Remove" everywhere** — in both create
  and edit forms, for both scheduled and simple slot types.
- **Do not touch `SlotList.tsx`** — the public page component is unchanged.
  Ordering is handled upstream in `sortSlotsForVolunteerDisplay`.
- **Run `supabase db reset` locally after adding the migration** to apply
  the new column to the local database.
