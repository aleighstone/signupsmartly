# Spec: Required Comment + Custom Comment Label

## Overview

Organizers can optionally mark the "Comment" field on any slot as required,
and can rename it to something more meaningful for that slot — e.g. "What I'm
bringing", "Shirt size", "Dietary restrictions", "Player's jersey number".

This applies to both scheduled and simple list signup types.

---

## Motivation

User request: organizers wanted to collect structured information from volunteers
at signup time without building a separate form. Making the comment field
customizable and optionally required covers the majority of these use cases
with minimal complexity.

---

## Database changes

Add two columns to the `slots` table:

```sql
alter table slots
  add column comment_label    text    not null default 'Comment',
  add column comment_required boolean not null default false;
```

No migration needed for existing slots — defaults match current behaviour
(label = "Comment", not required).

---

## Files to create / modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `app/create-event/CreateEventForm.tsx` | Add label + required fields to slot form |
| Modify | `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Same for edit flow |
| Modify | `app/api/events/route.ts` (POST) | Accept + store new fields |
| Modify | `app/api/events/[id]/route.ts` (PATCH) | Accept + store new fields |
| Modify | `app/event/[slug]/SignupForm.tsx` (or equivalent) | Apply label + required validation |

---

## 1. Slot form UI (create + edit)

Add two controls below the existing "Instructions" field on each slot, inside a
subtle collapsed section or inline:

### Comment label field

```tsx
<div>
  <label className="block text-sm font-medium text-charcoal font-body mb-1">
    Comment field label
    <span className="ml-2 text-xs font-normal text-muted">(optional)</span>
  </label>
  <input
    type="text"
    placeholder="Comment"
    maxLength={60}
    {...form.register(`slots.${index}.comment_label`)}
    className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm
               text-charcoal focus:border-sage focus:outline-none focus:ring-2
               focus:ring-sage/30 font-body"
  />
  <p className="mt-1 text-xs text-muted font-body">
    Rename this field to something specific, e.g. "What I'm bringing"
  </p>
</div>
```

### Required toggle

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    {...form.register(`slots.${index}.comment_required`)}
    className="h-4 w-4 rounded border-charcoal/30 text-sage
               focus:ring-sage/30 focus:ring-2"
  />
  <span className="text-sm text-charcoal font-body">
    Require volunteers to fill this in
  </span>
</label>
```

### Zod schema additions (both forms)

Add to the slot schema in both `CreateEventForm.tsx` and `EditEventForm.tsx`:

```ts
comment_label:    z.string().max(60).optional(),
comment_required: z.boolean().optional(),
```

---

## 2. API schema changes

### POST `/api/events` and PATCH `/api/events/[id]`

Add to the slot object schema in both route handlers:

```ts
comment_label:    z.string().max(60).optional(),
comment_required: z.boolean().optional(),
```

When upserting slots, pass through `comment_label` and `comment_required`.
If omitted, default to `'Comment'` and `false` respectively.

---

## 3. Volunteer signup form

On the public signup page, the comment field renders using the slot's
`comment_label` and `comment_required` values:

```tsx
<div>
  <label className="block text-sm font-medium text-charcoal font-body mb-1">
    {slot.comment_label || 'Comment'}
    {slot.comment_required
      ? <span className="ml-1 text-coral">*</span>
      : <span className="ml-2 text-xs font-normal text-muted">(optional)</span>
    }
  </label>
  <textarea
    {...form.register('comment', {
      required: slot.comment_required
        ? `${slot.comment_label || 'Comment'} is required`
        : false,
    })}
    placeholder={`Any notes${slot.comment_required ? '' : ' (optional)'}`}
    rows={3}
    className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm ..."
  />
  {errors.comment && (
    <p className="mt-1 text-xs text-coral font-body">{errors.comment.message}</p>
  )}
</div>
```

---

## 4. Signups view (organizer roster)

The column header in the organizer's signups table currently reads "Comment".
Update it to use the slot's `comment_label`:

```tsx
<th>
  {slot.comment_label || 'Comment'}
</th>
```

If slots on the same event have different labels, show the label per row
rather than as a column header — or simplify by using "Note" as the generic
column header when labels differ.

---

## Behaviour notes

| Scenario | Behaviour |
|----------|-----------|
| Organizer leaves label blank | Displays as "Comment" (default) |
| Organizer checks required but no label | Field shows as "Comment *" |
| Existing signups on slot when required is toggled on | Historical signups unaffected — requirement only applies to new signups going forward |
| Label is 60+ characters | Capped by `maxLength` on input and `max(60)` in schema |
| Simple list slot | Same behaviour — label and required apply identically |

---

## What's New entry

```ts
{
  type: 'new',
  text: 'Custom comment labels — rename the comment field on any slot to something specific like "What I\'m bringing" or "Shirt size", and optionally make it required.',
},
```
