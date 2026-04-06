# Spec: Public Signup Visibility (Who's Signed Up)

## Overview

Volunteers on the public signup page can see who has already claimed spots,
via a modal triggered from a link on each slot. This applies to both partially
filled and fully filled slots.

Showing signups is **opt-out** — on by default for all events. Organizers can
disable it per event. Comment visibility is a separate **opt-in** per slot,
controlled alongside the comment label and required settings from the
comment-label spec.

---

## Motivation

Currently, partially filled slots only show a remaining count ("2 spots
remaining") with no indication of who has already signed up. Names only surface
once a slot is 100% full and moves to the Filled Roles section. This means
the social coordination benefit — seeing who else is involved — is invisible
for most of the signup lifecycle.

The modal approach surfaces this information without crowding the signup page,
which must remain clean and action-oriented as its primary job is to get
volunteers to click Sign Up.

---

## Current rendering behaviour (for reference)

| Slot state | Currently shown |
|---|---|
| 0% filled | Still Needed — slot card with Sign Up button |
| 1–99% filled | Still Needed — slot card with "X spots remaining" + Sign Up button. **Names not shown.** |
| 100% filled | Filled Roles — slot name + name(s) of signers. No Sign Up button. |

This spec changes the 1–99% and 100% cases.

---

## New behaviour

### Partially filled slots (1–99%) — Still Needed section

Add a "See who →" link below the remaining count:

```
Timer · 9:00 AM – 12:00 PM
2 spots remaining · 3 of 5 filled · See who →        [Sign Up]
```

Tapping "See who →" opens the signups modal.

Only show the link when:
- `show_signups` is `true` on the event (default)
- At least 1 person has signed up for that slot

If `show_signups` is false, render the slot card exactly as today.

### Fully filled slots — Filled Roles section

Replace the flat name rendering with a "View signups →" link:

**Before:**
```
✓ Filled Roles
  Timer · 9:00 AM – 12:00 PM
  Dale Doback
```

**After (when show_signups is true and capacity = 1):**
```
✓ Filled Roles
  Timer · 9:00 AM – 12:00 PM
  Dale Doback
```
*(No change for single-capacity slots — one name is fine inline)*

**After (when show_signups is true and capacity > 1):**
```
✓ Filled Roles
  Timer · 9:00 AM – 12:00 PM
  5 volunteers · View signups →
```

This keeps the Filled Roles section compact for multi-capacity slots while
still surfacing the detail one tap away.

---

## The signups modal

One shared `SignupsModal` component, used by both entry points.

### Props

```ts
type SignupsModalProps = {
  isOpen:          boolean;
  onClose:         () => void;
  slotName:        string;
  slotTime?:       string;       // formatted time range, if applicable
  signups:         PublicSignup[];
  showComments:    boolean;      // from slot.comment_show_publicly
  commentLabel:    string;       // from slot.comment_label, default 'Comment'
};

type PublicSignup = {
  name:     string;
  comment?: string | null;
};
```

### Layout

```tsx
<dialog className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-charcoal/40" onClick={onClose} />

  {/* Modal card */}
  <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-soft-md">

    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-charcoal font-heading">
          {slotName}
        </h2>
        {slotTime && (
          <p className="text-sm text-muted font-body mt-0.5">{slotTime}</p>
        )}
      </div>
      <button onClick={onClose} className="text-muted hover:text-charcoal ml-4">
        ✕
      </button>
    </div>

    {/* Signup list */}
    <ul className="space-y-3 max-h-72 overflow-y-auto">
      {signups.map((s, i) => (
        <li key={i} className="flex flex-col">
          <span className="text-sm font-medium text-charcoal font-body flex items-center gap-1.5">
            <span className="text-sage text-xs">✓</span>
            {s.name}
          </span>
          {showComments && s.comment && (
            <span className="text-xs text-muted font-body mt-0.5 ml-4">
              {commentLabel}: {s.comment}
            </span>
          )}
        </li>
      ))}
    </ul>

    {/* Footer */}
    <p className="mt-5 text-xs text-muted font-body text-center border-t border-charcoal/10 pt-4">
      Organized with SignupSmartly
    </p>
  </div>
</dialog>
```

---

## Volunteer disclosure on the signup form

When `show_signups` is true for the event, add a one-line notice inside the
signup modal below the comment field (or below the email field if no comment):

```tsx
{event.show_signups && (
  <p className="text-xs text-muted font-body mt-3">
    Your name will be visible to others viewing this signup page.
  </p>
)}
```

If the slot also has `comment_show_publicly = true`, extend the notice:

```tsx
<p className="text-xs text-muted font-body mt-3">
  Your name{slot.comment_show_publicly ? ` and ${slot.comment_label || 'comment'}` : ''} will
  be visible to others viewing this signup page.
</p>
```

---

## Database changes

### `events` table

```sql
alter table events
  add column show_signups boolean not null default true;
```

All existing events default to `true` — no change in visible behaviour for
fully filled slots (names were already shown), but partially filled slots now
show the "See who →" link.

### `slots` table

Add alongside the comment label fields from the comment-label spec:

```sql
alter table slots
  add column comment_show_publicly boolean not null default false;
```

Defaults to `false` — comments are not shown publicly unless the organizer
explicitly enables it per slot.

---

## Files to create / modify

| Action | File | Purpose |
|---|---|---|
| Create | `app/event/[slug]/SignupsModal.tsx` | The modal component |
| Modify | `app/event/[slug]/page.tsx` (or SignupPage client component) | Render "See who →" + "View signups →" links; pass `show_signups` + signup data |
| Modify | `app/event/[slug]/SignupForm.tsx` | Add volunteer disclosure line |
| Modify | `app/create-event/CreateEventForm.tsx` | Add show_signups toggle to event meta section |
| Modify | `app/dashboard/event/[id]/edit/EditEventForm.tsx` | Same |
| Modify | `app/api/events/route.ts` (POST) | Accept + store `show_signups` |
| Modify | `app/api/events/[id]/route.ts` (PATCH) | Accept + store `show_signups` |
| Modify | `app/api/events/[slug]/route.ts` (GET, public) | Return `show_signups` + signups per slot when enabled |

---

## Event meta toggle (create + edit forms)

In the event details section — not in the slot form — add a toggle alongside
other event-level settings:

```tsx
<label className="flex items-start gap-3 cursor-pointer">
  <input
    type="checkbox"
    defaultChecked={true}
    {...form.register('show_signups')}
    className="mt-0.5 h-4 w-4 rounded border-charcoal/30 text-sage
               focus:ring-sage/30 focus:ring-2"
  />
  <span>
    <span className="text-sm font-medium text-charcoal font-body block">
      Show who has signed up
    </span>
    <span className="text-xs text-muted font-body block mt-0.5">
      Volunteers can tap a slot to see who else has signed up.
      Turn off for anonymous signups.
    </span>
  </span>
</label>
```

---

## API: public event endpoint

The public event endpoint (`GET /api/events/[slug]`) currently returns slot
data with signup counts. When `show_signups` is true, it must also return the
names (and conditionally comments) for each slot's existing signups.

Add to the slot query:

```ts
// Only fetch signup names/comments when show_signups is true
if (event.show_signups) {
  // For each slot, include active (non-cancelled) signups
  // Return: name, comment (only if slot.comment_show_publicly is true)
  const signups = await supabase
    .from('signups')
    .select('name, comment, slot_id')
    .in('slot_id', slotIds)
    .eq('cancelled', false);
}
```

**Important:** even when `show_signups` is true, only return `comment` for
slots where `comment_show_publicly` is true. Never expose comments
that the organizer has not explicitly made public.

---

## Rendering logic summary

```
For each slot on the public signup page:

  if slot is empty (0 signups):
    → render as today, no modal link

  if slot has signups AND event.show_signups is true:

    if slot is partially filled (capacity > filled):
      → show "X of Y filled · See who →" link in Still Needed card
      → Sign Up button remains prominent

    if slot is fully filled:
      if capacity == 1:
        → show name inline in Filled Roles (as today)
      if capacity > 1:
        → show "X volunteers · View signups →" in Filled Roles

  if event.show_signups is false:
    → render as today for all states
```

---

## Critical: existing event edit behaviour

When an organizer edits an existing event, `EditEventForm.tsx` must seed its
form state from the values already stored in the DB — not from hardcoded
defaults. This applies to every new field in this spec and the comment-label
spec:

**Event level:** `show_signups` must be read from `event.show_signups` and used
as the initial checkbox state. If it is `true` (the DB default), the checkbox
renders checked. If an organizer previously unchecked it and saved, it comes
back as `false` and renders unchecked.

**Slot level:** `comment_label`, `comment_required`, and `comment_show_publicly`
must each be read from the existing slot record and used to seed the
corresponding form fields. Do not fall back to hardcoded defaults for existing
slots.

**Why this matters:** if the form initialises new fields with hardcoded defaults
instead of DB values, an organizer editing an unrelated field (e.g. changing
the event title) will silently overwrite their previously saved settings on
submit — resetting `show_signups` to `true`, clearing a custom `comment_label`,
etc. This must not happen.

The pattern to follow is the same as all existing slot fields: read from
`event.slots.map((s) => ({ ..., comment_label: s.comment_label ?? 'Comment', ... }))`.

---

## Edge cases

| Case | Behaviour |
|---|---|
| Slot has 1 capacity, 1 signup (fully filled) | Name shown inline in Filled Roles as today — no modal needed |
| Slot has signups but organizer turns off show_signups mid-event | Links disappear immediately; existing signups unaffected |
| Volunteer has no comment but slot has comment_show_publicly=true | Only name shown in modal, no comment row |
| Very long comment in modal | Wrap naturally; modal has max-h-72 with overflow-y-auto |
| Event has 0 signups total | No modal links appear anywhere |
| Organizer disables show_signups after signups exist | No data is deleted; just not rendered publicly |

---

## What's New entry

```ts
{
  type: 'new',
  text: 'See who\'s signed up — volunteers can now tap any slot to see who has already claimed a spot. Shown by default; organizers can turn it off for anonymous signups.',
},
```
