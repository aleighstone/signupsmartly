# Bug Fix: All-Day Slot Date Displays Wrong (Apr 30 Instead of May 1)

## Status

`lib/calendar.ts` has already been updated with the correct fix (see below).
Cursor just needs to deploy / confirm the build picks it up.

---

## What Was Wrong

`formatEventDateRange` was using `date-fns` `format()` to render YYYY-MM-DD calendar
dates. Every path went through `new Date(...)`, which creates a UTC midnight timestamp.
`format()` then renders in the **local timezone**, so in PDT (UTC-7) a date stored as
`"2026-05-01"` displayed as "April 30". This happened regardless of whether UTC midnight
or local midnight was used — `date-fns` `format()` always uses local time.

The underlying rule that applies everywhere in this codebase:

> **Organizer-entered dates and times display exactly as stored. Never translate timezones.**
> Never pass a YYYY-MM-DD string to `new Date()` for display purposes.

---

## What Was Changed (`lib/calendar.ts`)

`date-fns` has been removed entirely from the file.

`formatEventDateRange` now parses the YYYY-MM-DD string directly as numbers and builds
the display string without ever creating a `Date` object for display:

```ts
// Parse "2026-05-01" → { y: 2026, m: 5, d: 1 }
// Build "Friday, May 1, 2026" from those numbers directly.
// The only Date object used is new Date(y, m-1, d).getDay() for weekday arithmetic —
// local midnight, no display, no timezone conversion.
```

The `sameDay` check is now a plain integer comparison (`y === y && m === m && d === d`)
instead of `.toDateString()`, which also used local time and could mismatch.

The slot timestamp functions (`formatSlotDateUTC`, `formatTimeRange`,
`formatTimeRangeInTimezone`, `slotTimestampsToFormFields`) are **unchanged** — they
correctly use `Intl.DateTimeFormat` with `timeZone: 'UTC'` for full ISO timestamps.

---

## Action Required

1. **Deploy** the current `lib/calendar.ts` to production.
2. **Verify** by visiting `/event/a4b2bbc8-48cc-4452-b415-9a05c5242bb6` — the filled slot
   should show **"Friday, May 1, 2026 · All day"**, not "Apr 30 – May 1, 2026 · All day".

---

## Rule to Follow Going Forward

Do not touch the YYYY-MM-DD display logic in `formatEventDateRange`. If you ever need to
modify date formatting elsewhere in this codebase, follow the same pattern:

- **YYYY-MM-DD strings** → parse with regex into `{ y, m, d }` numbers → build display
  string directly. Never pass to `new Date()`.
- **Full ISO timestamps** (slot start/end times) → `Intl.DateTimeFormat` with
  `timeZone: 'UTC'`. Already handled by `formatSlotDateUTC` and `formatTimeRange`.
