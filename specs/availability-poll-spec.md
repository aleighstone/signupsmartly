# Availability Poll — Product Spec

## Background

Organizers of recurring groups (mahjong, book clubs, sports teams, etc.) often need to
find a date that works for enough people before they can commit to an event. Today this
happens via group text chains: someone asks "who's free on the 4th, 11th, or 18th?",
everyone replies, and the organizer tallies manually.

SignupSmartly's data model maps naturally onto this: slots = proposed dates, signups =
availability declarations. The key differences from a normal signup are:

- **Multi-select**: one person marks all dates they can make in a single submission
- **No capacity limits**: every date accepts unlimited responses
- **No commitment**: people are expressing availability, not claiming a spot
- **No reminders**: nothing to remind someone about — they haven't committed to anything
- **Organizer goal**: find the date where the most people are free

---

## New Signup Type: `availability`

Add `'availability'` to the `signup_type` enum alongside `'scheduled'` and `'simple'`.

This is the only database schema change required. The `signups` table is unchanged — each
availability response creates one row per selected date, just like normal signups.

---

## Data Model Notes

**Slots** for an availability poll:
- `role_name`: the date label (e.g. "Saturday, June 7")
- `start_time` / `end_time`: optional — organizer may or may not specify a time
- `capacity`: set to `null` or a large sentinel (e.g. 9999) — effectively unlimited
- `instructions` / `role_description`: optional note per date (e.g. "Backup location")

**Signups** for an availability poll:
- Same table, same columns
- One row per person per available date (a person who marks 3 dates creates 3 rows)
- Uniqueness constraint: `(slot_id, email)` — same as today, prevents double-marking
- `reminder_opt_in`: always `false`, `reminder_offset`: always `null`

---

## Scope of Changes

### 1. Create Form (`app/dashboard/create/page.tsx`)

**Type selector**: Add "Availability poll" as a third option alongside Scheduled and
Simple list.

```
○ Scheduled        — time slots volunteers claim
○ Simple list      — items people sign up to bring
● Availability poll — find a date that works for everyone
```

**When availability poll is selected:**
- Show date entry UI (same slot-builder as Scheduled, but label says "Proposed dates")
- Hide the "How many do you need?" (capacity) field per slot — not applicable
- Start time / end time fields: unchanged — optional as normal, no label changes
- Reminder settings section: hidden entirely
- Submit button copy: "Create poll" instead of "Create signup"

### 2. Edit Form (`app/dashboard/event/[id]/edit/page.tsx`)

Same conditional rendering as create:
- Capacity field hidden for availability type
- Reminder settings hidden
- Page title: "Edit availability poll"

### 3. Public Event Page (`app/event/[id]/page.tsx` + `EventPageClient.tsx`)

**Layout change**: Instead of individual "Sign up" buttons per slot, show all proposed
dates at once with checkboxes. A single CTA at the bottom opens the submission modal.

**New component: `AvailabilitySlotList`** (replaces `SlotList` for this type)

```
Which dates work for you?

☐  Saturday, June 7
   3 people available

☐  Saturday, June 14
   5 people available

☐  Saturday, June 21
   1 person available

[Select dates and submit →]  ← disabled until ≥1 date is checked
```

- Checkboxes are the primary interaction
- If `show_signups` is on, show "X people available · See who →" under each date (same modal as existing `SignupsModal`, triggered per date)
- "Select dates and submit" button is disabled until at least one date is checked
- No "Filled" section — all dates stay visible regardless of response count

**Section heading**: "Which dates work for you?" (replaces "Open" / "Filled")

**No coverage meter**: Replace `CoverageMeter` with a simple response counter:
```
15 responses so far
```

### 4. Availability Submission Modal (`AvailabilityModal`)

New modal — replaces `SignupModal` for the availability type.

**Structure:**
```
Tell us who you are

Name  [                    ]
Email [                    ]

Your selected dates:
  • Saturday, June 7
  • Saturday, June 14

[Submit my availability]
```

- Name + email fields (same validation as today)
- Read-only summary of checked dates (cannot be changed here — user goes back to uncheck)
- No reminder section
- Submit button: "Submit my availability"
- Error handling: same as today

**On submit**: POST `/api/availability` (new endpoint) with:
```json
{
  "slotIds": ["uuid1", "uuid2"],
  "name": "Jane Park",
  "email": "jane@example.com"
}
```

The endpoint creates one signup row per slotId in a single transaction. If any `(slot_id, email)` pair already exists, return a friendly error: "It looks like you've already submitted your availability. Email [organizer] if you need to make changes."

### 5. API Route: `POST /api/availability`

New route (do not modify existing `/api/signup`).

```ts
// Validates: slotIds is a non-empty array, all slots belong to the same event,
// event.signup_type === 'availability', name + email present
// Creates: one signup row per slotId, all with reminder_opt_in: false
// Returns: { responseId: string } where responseId = a shared token stored on all rows
//   (add a nullable `response_group_id` uuid column to signups, set same value for
//    all rows from one submission — used for cancel/update later)
```

### 6. Confirmation Page (`app/signup/confirm/page.tsx`)

Detect availability type from the signup record and show different copy:

```
You're all set!

Thanks for sharing your availability, [Name].
[Organizer name] will follow up once a date is chosen.

The dates you marked:
  • Saturday, June 7
  • Saturday, June 14
```

No "Add to calendar" link (no committed date yet). No cancel link in v1 — organizer
handles edge cases manually or via email.

### 7. Confirmation Email

New email template for availability responses. Triggered by the new `/api/availability`
route.

```
Subject: Got your availability — [Event Title]

Hi [Name],

We've noted your availability for [Event Title].

Dates you marked as available:
  • Saturday, June 7
  • Saturday, June 14

[Organizer name] will reach out once a date is confirmed.
```

No cancel link. No reminder scheduling.

### 8. Organizer "View Signups" Page

New layout for availability type — replaces the roster with an **availability grid**.

**Date summary cards** (sorted by most available → least):

```
┌─────────────────────────────────────────────┐
│  Saturday, June 14        5 available        │
│  Jane P, Marcus T, Lily C, Sam W, Priya N   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Saturday, June 7         3 available        │
│  Jane P, Marcus T, Lily C                   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Saturday, June 21        1 available        │
│  Sam W                                       │
└─────────────────────────────────────────────┘

15 responses total from 7 people
```

- Dates sorted by response count descending
- "X responses total from Y people" at the bottom (Y = distinct emails)
- Export button: CSV with columns Date, Name, Email

**No "Add manually" button** in v1 — organizer can forward the link to anyone.

### 9. Dashboard Event Card

**Availability poll pill**: Show a "Poll" badge instead of the "Scheduled" / "Simple list"
type indicator (if the dashboard currently shows type).

**Coverage meter**: Replace with response count: "12 responses · 5 people"

**"View Signups" button**: Keep same label and route — the route handles display by type.

### 10. `SlotList.tsx`

No changes needed — `SlotList` is not rendered for availability type. The new
`AvailabilitySlotList` component handles the public page.

---

## What Does NOT Change

- Auth, session, organizer account flow
- Event create/share link mechanism  
- `events` table: unchanged
- `signups` table (except adding `response_group_id`)
- Existing scheduled and simple list behavior — zero regression risk
- Themes, branding, org slugs
- PostHog tracking (add new events: `availability_poll_created`, `availability_submitted`)

---

## Copy Reference

| Surface | Current copy | Availability copy |
|---|---|---|
| Type selector | "Scheduled" / "Simple list" | + "Availability poll" |
| Public page heading | "Open" | "Which dates work for you?" |
| Submit button (public) | "Sign up" | "Submit my availability" |
| Confirmation heading | "You're signed up!" | "You're all set!" |
| Confirmation subhead | "We'll see you there." | "[Organizer] will follow up once a date is chosen." |
| Organizer view title | "Signups" | "Availability" |
| Dashboard stat | "X spots filled" | "X responses" |

---

## Reminders

Reminders are **entirely skipped** for availability polls:
- No reminder option in the submission modal
- No reminder scheduling in the API
- No reminder cron job changes needed — cron already checks `reminder_opt_in`

---

## Out of Scope (v1)

- **Respondent editing availability**: "I marked the wrong dates" — v1 handles with email to organizer
- **Organizer confirming a date**: Sending a "we're going with June 14!" announcement to all respondents — strong v2 feature
- **Anonymous responses** (no name/email required) — out of scope, organizer needs to know who responded
- **Weighting/preference**: "definitely can" vs "maybe" — out of scope, binary available/not is enough

---

## Cursor Prompt Notes

- Create `AvailabilitySlotList` and `AvailabilityModal` as new components — do not modify `SlotList` or `SignupModal`
- Gate all new rendering on `event.signup_type === 'availability'` — existing types are untouched
- The API route `/api/availability` is new — do not modify `/api/signup`
- Run existing E2E smoke tests after implementation to confirm no regressions
