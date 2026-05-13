# Cursor Prompt: Availability Poll Feature

Full spec: `specs/availability-poll-spec.md`
Playwright tests (written first — use them as your acceptance criteria): `e2e/availability.smoke.ts`

---

## ⚠️ BEFORE YOU START — Steps for Allison (human required)

These must be done in order before Cursor writes any code.

### 1. Apply DB migrations in Supabase dashboard

Run both of these SQL statements (production + local):

```sql
-- 1. Add the new signup type
ALTER TYPE signup_type ADD VALUE IF NOT EXISTS 'availability';

-- 2. Add response_group_id to signups (groups all rows from one submission)
ALTER TABLE signups ADD COLUMN IF NOT EXISTS response_group_id uuid;
```

If `signup_type` is stored as a plain `text` column (not an enum), skip the ALTER TYPE
and just update the TypeScript types in Step 1 of Cursor's work below.

### 2. Seed a local test availability poll event

After Cursor ships Phase 1 (create form), create an availability poll manually
via the UI, publish it, and add a couple of test responses by visiting the public
page as a volunteer. Then:

```bash
# Add to .env.local:
E2E_TEST_AVAILABILITY_EVENT_ID=<uuid of the event you just created>
```

### 3. Screenshot (after Phase 3 ships)

Once the public page looks good, capture a screenshot of the availability poll
public page and save it to:
`public/marketing-content/SS_Availability_poll_placeholder.png`
(This replaces the placeholder on the use-cases page.)

---

## Overview

Add a third signup type — `'availability'` — for organizers who need to find a
date that works for enough people (mahjong groups, game nights, recurring meetups,
etc.). Members visit a link, check all dates they can make, submit once. The
organizer sees dates sorted by most available.

**Implementation rules:**
- All new behavior gates on `event.signup_type === 'availability'`
- Do NOT modify `SlotList.tsx` or `SignupModal.tsx` — create new components
- Do NOT modify `POST /api/signup` — create a new `POST /api/availability`
- Existing scheduled and simple list flows must be 100% unchanged
- Run `npm run test:e2e -- --project=chromium` after each phase to check regressions

---

## Phase 1 — Types, DB types, Create form, Edit form

### Step 1 — Update TypeScript types

**`types/database.ts`** — every occurrence of `'scheduled' | 'simple'` for
`signup_type` becomes `'scheduled' | 'simple' | 'availability'`.

**`app/create-event/CreateEventForm.tsx`** — the local `SignupType` union on
line 15 is `'scheduled' | 'simple' | 'template'`. Add `'availability'`:
```ts
type SignupType = 'scheduled' | 'simple' | 'availability' | 'template';
```

### Step 2 — Create form (`app/create-event/CreateEventForm.tsx`)

**2a. Add "Availability poll" to the type selector `<select>`.**

Find the `<select>` / combobox that lets the organizer pick Scheduled vs.
Simple list (it has `aria-label="Signup type"` or similar). Add a third option:
```html
<option value="availability">Availability poll</option>
```

**2b. Add a third form state block for availability.**

The create form has `scheduledForm` and `simpleForm` (both react-hook-form
instances). Add a third: `availabilityForm`. It needs the same fields as
`scheduledForm` but without `capacity` per slot.

The availability form schema should reuse the scheduled slot schema but omit
capacity validation (set capacity to a sentinel value of `9999` when saving).

**2c. Gate the rendered form section on `signupType === 'availability'`.**

When availability is selected, render a section labelled "Proposed dates" that
is structurally identical to the Scheduled slot builder, with these differences:
- Hide the "How many do you need?" (capacity) input per slot
- Do NOT hide start_time / end_time — leave them optional as-is
- Hide the entire Reminders settings section
- Change the Publish button copy to "Create poll" (Save as Draft stays the same)

**2d. Wire up `switchType` to handle `→ availability` and `availability →`.**

The existing `switchType` function copies description values between forms when
the type changes. Extend it to handle transfers to/from `'availability'`:
```ts
// When switching TO availability from scheduled or simple:
//   copy description from the outgoing form to availabilityForm
// When switching FROM availability to scheduled or simple:
//   copy description from availabilityForm to the incoming form
```

**2e. Wire the submit handler.**

When `signupType === 'availability'`, submit uses `availabilityForm`. Set
`capacity: 9999` on every slot before posting to `/api/events`.

**2f. Update the description textarea name attribute.**

The description textarea in the availability form section must have:
```
name="signupsmartly-event-description-availability"
```
This is how the Playwright test locates it.

### Step 3 — Edit form (`app/dashboard/event/[id]/edit/EditEventForm.tsx`)

When `event.signup_type === 'availability'`:
- Hide the capacity input per slot
- Hide the reminder settings section
- Change the page `<h1>` to "Edit availability poll" instead of "Edit signup"

No new form instance needed — the edit form is a single instance. Just add
conditional rendering based on `event.signup_type`.

---

## Phase 2 — Public event page (new components + API route)

### Step 4 — Create `components/AvailabilitySlotList.tsx`

New client component. Props:
```ts
interface AvailabilitySlotListProps {
  slots: SlotWithSignups[];
  onSubmit: (slotIds: string[], name: string, email: string) => Promise<void>;
  showSignups: boolean;
  onOpenSignups: (slot: SlotWithSignups) => void;
  isSubmitting: boolean;
  error: string | null;
  volunteerPageThemed?: boolean;
}
```

**Render:**
```
Which dates work for you?          ← h2, replaces "Open" / "Filled"

☐  [date label / time]             ← checkbox per slot
   3 people available · See who →  ← shown when showSignups && slot has responses

[Select dates and submit →]        ← single CTA, disabled until ≥1 checked
```

- All slots rendered as checkboxes in a single list — no open/filled split
- Slots sorted chronologically (reuse `sortSlotsForVolunteerDisplay`)
- "X people available" shown when `showSignups && slot.signups.length > 0`
- "See who →" button calls `onOpenSignups(slot)` — reuses existing `SignupsModal`
- "Select dates and submit →" button is `disabled` when no checkboxes are checked
- Clicking the CTA opens `AvailabilityModal` (Step 5)
- Apply `volunteerPageThemed` button styles same as `SlotList` does

**Apply themed colors** using the same `--theme-primary` / `--theme-btn-text`
CSS variable pattern as `SlotList.tsx`. Mirror the `openCountStyle`,
`buttonStyle`, and `linkColorStyle` logic exactly.

### Step 5 — Create `components/AvailabilityModal.tsx`

New client component. Props:
```ts
interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlots: SlotWithSignups[];   // the checked slots
  onSubmit: (name: string, email: string) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  volunteerPageThemed?: boolean;
}
```

**Structure** (matches `SignupModal` layout, not a copy — build fresh):
```
Tell us who you are

Name  [input]
Email [input]

Your selected dates:
  • [slot label 1]
  • [slot label 2]

[Submit my availability]    ← primary button
```

- Name + email: same validation as `SignupForm` (required, valid email)
- Selected dates: read-only list — user goes back to uncheck if they made a mistake
- NO reminder checkbox, NO reminder section
- Submit button: "Submit my availability"
- On submit: calls `props.onSubmit(name, email)`
- Error displayed inline above the submit button (same pattern as `SignupModal`)
- Close on backdrop click or Escape key

### Step 6 — Create `app/api/availability/route.ts`

```ts
// POST /api/availability
// Body: { slotIds: string[], name: string, email: string }
//
// Validate:
//   - slotIds is non-empty array (max 50)
//   - name and email are non-empty strings, email passes basic format check
//   - All slotIds belong to the same event
//   - That event has signup_type === 'availability'
//
// Conflict check:
//   - If ANY (slot_id, email) pair already exists in signups, return 409 with:
//     { error: "It looks like you've already submitted your availability." }
//
// Happy path:
//   - Generate a single response_group_id (crypto.randomUUID())
//   - Insert one row per slotId into signups with:
//       name, email, reminder_opt_in: false, reminder_offset: null,
//       response_group_id: <generated uuid>
//   - Use a Supabase transaction (or sequential inserts inside a try/catch
//     that deletes the group on failure)
//   - Send confirmation email (Step 8)
//   - Return { responseId: response_group_id }
//
// On success: redirect to /signup/confirm?id=<first signup row id>
```

Use `createClient()` from `@/lib/supabase-server` for the DB call (same as
other API routes).

### Step 7 — Update `app/event/[id]/EventPageClient.tsx`

Gate rendering on `event.signup_type`:

```tsx
if (event.signup_type === 'availability') {
  return (
    <>
      <AvailabilitySlotList
        slots={event.slots}
        showSignups={showSignups}
        onOpenSignups={setSignupsModalSlot}
        onSubmit={handleAvailabilitySubmit}
        isSubmitting={isSubmitting}
        error={error}
        volunteerPageThemed
      />
      <SignupsModal ... />  {/* reuse existing — same modal for "See who →" */}
    </>
  );
}
// existing scheduled/simple rendering below unchanged
```

Add `handleAvailabilitySubmit`:
```ts
const handleAvailabilitySubmit = async (slotIds: string[], name: string, email: string) => {
  setIsSubmitting(true);
  setError(null);
  try {
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIds, name, email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Submission failed');
    router.push(`/signup/confirm?id=${json.signupId}`);
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Something went wrong, please try again.');
    setIsSubmitting(false);
  }
};
```

### Step 8 — Update `app/event/[id]/page.tsx`

Replace the `CoverageMeter` block for availability type:

```tsx
{eventData.signup_type === 'availability' ? (
  <div className="mt-8 rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft">
    <p className="text-sm font-medium text-charcoal font-body">
      {totalResponses} {totalResponses === 1 ? 'response' : 'responses'} so far
    </p>
  </div>
) : (
  <div className="mt-8 rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft">
    <CoverageMeter ... />
  </div>
)}
```

Where `totalResponses` = `eventData.slots.reduce((sum, s) => sum + s.signups.length, 0)`.

---

## Phase 3 — Confirmation page, email, organizer view, dashboard

### Step 9 — Update `app/signup/confirm/page.tsx`

This page receives a signup `id` in the query string and loads the signup record.
Detect availability type by checking `signup.response_group_id IS NOT NULL` or
by loading the parent event's `signup_type`.

When `signup_type === 'availability'`, render:
```
You're all set!

Thanks for sharing your availability, [name].
[Organizer name] will follow up once a date is chosen.

Dates you marked:
  • [slot label 1]
  • [slot label 2]
```

Rules:
- Heading: "You're all set!" (NOT "You're signed up!")
- No "Add to Calendar" link
- No cancel link
- Load sibling rows via `response_group_id` to display all marked dates

### Step 10 — Add availability confirmation email to `lib/email.ts`

Add a new exported function `sendAvailabilityConfirmation`:

```ts
export async function sendAvailabilityConfirmation({
  to,
  name,
  eventTitle,
  organizerName,
  markedDates,   // string[] — human-readable date labels
}: {
  to: string;
  name: string;
  eventTitle: string;
  organizerName: string;
  markedDates: string[];
})
```

Subject: `Got your availability — ${eventTitle}`

Body:
```
Hi [name],

We've noted your availability for [eventTitle].

Dates you marked as available:
  • [date 1]
  • [date 2]

[organizerName] will reach out once a date is confirmed.
```

No cancel link. No reminder scheduling. Call this from `POST /api/availability`
after the DB inserts succeed.

### Step 11 — Create organizer availability view

**`app/dashboard/event/[id]/signups/page.tsx`** (or its client component) —
when `event.signup_type === 'availability'`, render the availability grid
instead of the roster table.

**Layout:**

```
← Back to dashboard    [Copy Signup URL]  [Edit Event]  [Export CSV]

[Event title]

Dates sorted by most available:

┌─────────────────────────────────────────────┐
│  Saturday, June 14        5 available        │
│  Jane P, Marcus T, Lily C, Sam W, Priya N   │
└─────────────────────────────────────────────┘
... one card per slot, sorted desc by signups.length ...

15 responses total from 7 people    ← data-testid or visible text for Playwright
```

**Data:**
- Sort slots by `slot.signups.length` descending before rendering
- Each card: slot label (date/time), count, comma-separated first names
- Footer: total response rows vs. distinct emails
  - `totalResponses = slots.reduce((sum, s) => sum + s.signups.length, 0)`
  - `distinctPeople = new Set(slots.flatMap(s => s.signups.map(su => su.email))).size`
- Add `data-availability-count` attribute to each count element (used by Playwright sort test)

**Export:** reuse existing CSV export mechanism — same button, same format (columns: Date, Name, Email).

**Do NOT render:**
- Coverage meter
- "Add manually" button
- Roster table

### Step 12 — Dashboard event card

In `components/DashboardEventList.tsx` (the redesigned dashboard), when
`event.signup_type === 'availability'`:

- Replace the coverage/filled stat with: `X responses · Y people`
  where X = total signup rows, Y = distinct emails (pass this data down from
  the dashboard page query or compute client-side from the signups count)
- Show a "Poll" badge instead of "Scheduled" / "Simple list" type badge
  (use `bg-violet-100 text-violet-700` to match the use-cases page badge)

---

## Constraints — do not violate these

1. **Do not modify `SlotList.tsx`** — new `AvailabilitySlotList` only
2. **Do not modify `SignupModal.tsx`** — new `AvailabilityModal` only
3. **Do not modify `POST /api/signup`** — new `POST /api/availability` only
4. **Zero changes to scheduled/simple event behavior** — every existing Playwright
   test in `organizer.smoke.ts` and `volunteer.smoke.ts` must still pass
5. **Reminder system untouched** — cron already skips rows where `reminder_opt_in = false`
6. **`SignupsModal` is reused as-is** for the "See who →" flow on the public page
7. **`EventHeader.tsx` is unchanged** — it already renders correctly for all types
8. **Do not add quorum / minimum-people logic** — out of scope

---

## Running tests

After Phase 1:
```bash
npx playwright test --project=chromium
```

After Phase 2 (once `E2E_TEST_AVAILABILITY_EVENT_ID` is set):
```bash
npx playwright test --project=availability-volunteer
```

After Phase 3:
```bash
npx playwright test --project=availability-organizer
npx playwright test --project=availability-volunteer
npx playwright test --project=chromium   # full regression
```
