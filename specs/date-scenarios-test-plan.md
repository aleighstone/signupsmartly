# Test Plan: Date & Time Scenarios

Covers all date-related surface area: create, edit, public page display, volunteer signup confirmation, and reminder eligibility. Designed to catch "whack-a-mole" regressions across the full date stack.

---

## Background: How dates work in this app

| Layer | Field | Scheduled event | Simple list |
|---|---|---|---|
| Event | `start_date` / `end_date` | Derived from slot dates on save (earliest → latest) | Optional single date entered by organizer |
| Slot | `start_time` / `end_time` | Full ISO timestamp stored as literal UTC (no TZ shift) | Always null |
| Slot | `spot_date` | Required in create/edit form | N/A |

**Display rules on public page:**
- Scheduled slot with time → shows time range (e.g. "9:00 AM – 10:00 AM")
- Scheduled slot with start time only → shows single time (e.g. "9:00 AM")
- Scheduled slot with **spot date** but no clock times → save stores `start_time` as that date at `00:00:00` UTC; volunteer UI shows **that slot’s calendar date** (no time). This is **not** the same as event-level fallback.
- Event-level date **fallback** on the slot line (`formatScheduledSlotWhen`) applies only when **`start_time` is null** (no date on the slot), using the event’s `start_date` / `end_date` if set.
- Simple slot → no date/time shown on slot card; event-level date shown in header only

**Reminder rules:**
- Simple list with no event `start_date` → reminder is tombstoned (skipped, never retried)
- Volunteer reminder uses `slot.start_time` first, falls back to `event.start_date`

---

## Section 1 — Scheduled events: Create form

| # | Scenario | Steps | Expected result |
|---|---|---|---|
| S1 | Slot date is required | Create scheduled event, leave date blank on a slot, submit | Validation error: "Date required" on that slot |
| S2 | Slot time is optional | Create scheduled event, fill date but leave start/end time blank, submit | Saves successfully |
| S3 | Slot with start time only (no end time) | Fill date + start time, leave end time blank | Saves; public page shows "9:00 AM" (no dash/range) |
| S4 | Slot with full time range | Fill date + start + end time | Saves; public page shows "9:00 AM – 10:00 AM" |
| S5 | Multiple slots, same date, different times | Add 2 slots with same date, different times | Both save; public page orders by start_time ascending |
| S6 | Multiple slots, different dates | Add 2 slots with different dates | Both save; event `start_date` = earliest, `end_date` = latest; public page orders chronologically |
| S7 | Multiple slots, same date and same time | Add 2 slots with identical date+time | Both save; public page falls back to sort_order for display order |
| S8 | Event date header on public page | After creating with slots on different dates | Event header shows date range (e.g. "Apr 5 – May 31, 2026") |
| S9 | Event date header — single date | All slots on same date | Event header shows single full date (e.g. "Saturday, April 18, 2026") |

---

## Section 2 — Scheduled events: Edit form

| # | Scenario | Steps | Expected result |
|---|---|---|---|
| E1 | Change a slot's date | Edit event, change slot date, save | Public page reflects new date; event `start_date`/`end_date` recalculated |
| E2 | Change slot times | Edit event, change start/end time on a slot, save | Public page shows updated time range |
| E3 | Remove end time from a slot | Edit event, clear end time field, save | Public page shows only start time (no range dash) |
| E4 | Remove start time from a slot | Edit event, clear start time (keep spot date), save | `start_time` becomes date-only UTC midnight; public page shows that **slot’s** date with no time (same as S2) |
| E5 | Add a new slot on a later date | Edit event, add slot with date later than current latest | `end_date` updates to new latest; event header date range expands |
| E6 | Delete the only slot with the earliest date | Edit event, remove first slot | `start_date` moves forward to next earliest slot date |

---

## Section 3 — Simple lists: Create form

| # | Scenario | Steps | Expected result |
|---|---|---|---|
| SL1 | Create with no date | Leave event-level date blank, submit | Saves successfully; dashboard shows no date; public page header has no date row |
| SL2 | Create with a date | Fill optional event date, submit | Saves; dashboard shows date; public page header shows "Saturday, April 18, 2026" |
| SL3 | Slot cards: no date shown | Regardless of event date | Slot cards on public page never show a date or time |

---

## Section 4 — Simple lists: Edit form

| # | Scenario | Steps | Expected result |
|---|---|---|---|
| SL-E1 | Add a date to a previously undated event | Edit simple list, enter event date, save | Public page header now shows date; dashboard shows date |
| SL-E2 | Remove date from a dated event | Edit simple list, clear event date, save | Public page header date row disappears; dashboard no longer shows date |
| SL-E3 | Change the event date | Edit simple list, change date, save | Dashboard and public page both reflect updated date |

---

## Section 5 — Public event page display

| # | Scenario | Setup | Expected display |
|---|---|---|---|
| P1 | Scheduled slot, full time range | Slot has date + start + end time | "9:00 AM – 10:00 AM" on slot card |
| P2 | Scheduled slot, start time only | Slot has date + start time, no end | "9:00 AM" on slot card |
| P3 | Scheduled slot, date only, no time | Organizer chose a spot date and left times blank (DB has `start_time` at UTC midnight for that date) | Slot card shows **that slot’s** date (e.g. "Saturday, April 18, 2026"); no time. Not an event-range fallback. |
| P4 | Simple list with event date | Event has start_date | Header shows full date; slot cards show no date |
| P5 | Simple list, no date | Event has no start_date | Header has no date row at all (not blank, not "null") |
| P6 | Multi-day event | Slots span multiple dates | Header shows "Apr 5 – May 31, 2026" style range |
| P7 | "Still Needed" badge | Any slot with capacity remaining | Shows ⚡ Still Needed section heading |
| P8 | Event with all slots filled | Every slot at capacity | Sign up buttons replaced with "Full" indicator; ⚡ section disappears |

---

## Section 6 — Volunteer signup confirmation page

| # | Scenario | Expected on `/signup/confirm?id=...` |
|---|---|---|
| C1 | Signed up for scheduled slot with full time range | Shows slot time "11:00 AM – 11:30 AM" and event date |
| C2 | Signed up for scheduled slot with date, no time | Shows the slot’s date (from `start_time` / midnight date row); no time row when times were omitted |
| C3 | Signed up for simple list with event date | Shows event date |
| C4 | Signed up for simple list with no event date | No date row shown (not blank/broken) |
| C5 | Add to Calendar link | Present for events with a date; not present (or gracefully absent) for dateless simple lists |

---

## Section 7 — Reminder eligibility

| # | Scenario | Expected behavior |
|---|---|---|
| R1 | Scheduled slot with start_time | Reminder queued; fires 24h before slot time (or morning of, per preference) |
| R2 | Scheduled slot with date only, no start_time | Reminder uses event `start_date` for timing calculation |
| R3 | Simple list with event date | Reminder uses event `start_date` |
| R4 | Simple list with no date | Signup is tombstoned (reminder skipped, never retried); no email sent |
| R5 | Reminder opt-out | Volunteer unchecks reminder at signup | No reminder queued (`reminder_opt_in = false`) |

---

## Section 8 — Edge cases & regression targets

| # | Scenario | Why it matters |
|---|---|---|
| X1 | Date exactly at midnight UTC | Verify no off-by-one that shifts display to previous day |
| X2 | Slot date = Dec 31 / Jan 1 boundary | Year rollover in date formatting |
| X3 | Event in non-ET timezone (org has timezone set) | Reminder fires at correct local time; public page still shows literal stored time |
| X4 | Edit a slot to move its date earlier than event `start_date` | Event `start_date` should update to the new earlier date |
| X5 | Organizer views signups table — date column | Shows MM/DD/YYYY for scheduled slots; blank for simple list slots |
| X6 | CSV export — date column | Same as X5 but in exported file |
| X7 | Confirmation page "Add to Calendar" ICS | `.ics` file contains correct DTSTART/DTEND matching displayed times |

---

## How to run

For each scenario: note **Pass / Fail / Skip** and any observed vs. expected mismatch.

Suggested run order for a quick smoke pass: S4 → S1 → SL1 → SL2 → P1 → P5 → C1 → C4 → R4

Full regression pass: all sections in order, ~45–60 min.
