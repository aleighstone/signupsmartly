# Test Plan: Edit Event Feature

**Feature refs:** `specs/edit-event-spec.md`, `specs/edit-event-emails-spec.md`
**Scope:** Edit page UI, PATCH API, slot deletion cascade, and three notification email flows

---

## Prerequisites

### Test accounts

| Role | Account |
|------|---------|
| Organizer | `allisonleighstone@gmail.com` |
| Volunteer (receives emails) | A real inbox you can check — use `allison.troup@gmail.com` or a Mailinator/test address |

### Set up: Create a dedicated QA test event

Use the organizer account to create a **scheduled** event named `Edit QA — Scheduled` with:

- Start date: any future date, e.g. 2026-04-15
- End date: same day
- Location: `123 Test Ave`
- **Slot A** — role "Setup Crew", capacity 2, time 9:00–11:00 AM — sign up 2 volunteers (use the volunteer email for at least one so you'll receive emails)
- **Slot B** — role "Cleanup Crew", capacity 2, time 11:00 AM–1:00 PM — sign up 1 volunteer
- **Slot C** — role "Registration", capacity 3, time 8:00–9:00 AM — leave **empty**

Also create a **simple** event named `Edit QA — Simple` with:
- **Item A** — role "Bring Food", capacity 2 — sign up 1 volunteer
- **Item B** — role "Bring Chairs", capacity 1 — leave empty

Record both event IDs from the URL after saving.

---

## 1. Edit Page Access & Layout

| # | Action | Expected |
|---|--------|----------|
| 1.1 | On the dashboard, locate `Edit QA — Scheduled` card. Confirm an **Edit** button is present alongside "View My Signups" and "Signup Page". | ✅ Button renders |
| 1.2 | Click the **Edit** button. | Navigates to `/dashboard/event/{id}/edit` |
| 1.3 | Confirm the page shows a **← Back to signups** link at the top. | ✅ Link present |
| 1.4 | Open the signups page for the same event. Confirm **Edit event →** text link appears below the formatted date. | ✅ Link present |
| 1.5 | Click **Edit event →**. | Navigates to the same edit page |
| 1.6 | Log out, then try navigating directly to `/dashboard/event/{id}/edit`. | Redirects to `/login?next=/dashboard/event/{id}/edit` |

---

## 2. Edit Details (Scheduled Event)

| # | Action | Expected |
|---|--------|----------|
| 2.1 | On the edit page, confirm **Signup type** is shown as a read-only badge ("Scheduled"), with the note "Signup type cannot be changed after creation." | ✅ No input, read-only display |
| 2.2 | Clear the Title field and attempt to save. | Save button disabled or inline error — title is required |
| 2.3 | Update Title to `Edit QA — Scheduled (edited)`, update Description, change Location to `456 New Ave`. Do NOT change the date yet. Click Save. | Redirects to signups page; new title and location visible in page header |
| 2.4 | Return to edit page. Confirm all saved values are pre-populated in the form. | ✅ Form shows current values |

---

## 3. Edit Details (Simple Event)

| # | Action | Expected |
|---|--------|----------|
| 3.1 | Open the edit page for `Edit QA — Simple`. Confirm signup type badge shows "Simple list". | ✅ |
| 3.2 | Confirm **End date** field is hidden (only Start date shown). | ✅ End date absent |
| 3.3 | Confirm slot section heading is **Items** (not Spots or Slots). | ✅ |
| 3.4 | Confirm each row label is **Item name** (not Spot name or Slot name). | ✅ |
| 3.5 | Confirm **Add Item** button (not Add Spot). | ✅ |

---

## 4. Slot / Item Management — Adding & Editing

| # | Action | Expected |
|---|--------|----------|
| 4.1 | On the scheduled event edit page, click **Add Spot**. | New blank row appended; role name input is empty, capacity defaults to 1 |
| 4.2 | Fill in role name "Parking", capacity 5, time 7:00–8:00 AM. Click Save. | Redirects to signups page; new "Parking" row visible in the signups table |
| 4.3 | Return to edit page. Edit the capacity of "Cleanup Crew" (currently has 1 signup) to 3. Click Save. | Saves successfully — no error (capacity increase is always allowed) |

---

## 5. Capacity Validation (Client-side)

| # | Action | Expected |
|---|--------|----------|
| 5.1 | On the edit page for the scheduled event, find **Setup Crew** (capacity 2, has 2 signups). Change capacity to 1 and blur/tab out of the field. | Inline error: "This spot has 2 volunteer(s) signed up. Capacity cannot be below 2." |
| 5.2 | With the capacity error showing, confirm the **Save** button is disabled. | ✅ Button disabled |
| 5.3 | Restore capacity to 2 (or higher). Confirm error disappears and Save re-enables. | ✅ Error cleared, Save enabled |
| 5.4 | On the simple event, find **Bring Food** (has 1 signup). Change capacity to 0 (or type 0). | Inline error: "This item has 1 volunteer(s) signed up. Capacity cannot be below 1." (uses "item" not "spot") |

---

## 6. Slot Deletion — Empty Slot (No Confirmation)

| # | Action | Expected |
|---|--------|----------|
| 6.1 | On the scheduled event edit page, find **Registration** (0 signups). Click its delete / Remove button. | Row disappears immediately from the form — no modal shown |
| 6.2 | Click Save. | Saves; signups page no longer shows the "Registration" row |
| 6.3 | Return to edit page and confirm "Registration" is gone. | ✅ |

---

## 7. Slot Deletion — Filled Slot (Confirmation Modal + Email)

### 7A — UI / Modal

| # | Action | Expected |
|---|--------|----------|
| 7.1 | On the scheduled event edit page, find **Setup Crew** (2 signups). Click its delete button. | Confirmation modal opens (no immediate removal) |
| 7.2 | Modal title: "Remove this Spot?" | ✅ |
| 7.3 | Modal body lists the names of both volunteers signed up for Setup Crew. | ✅ Bullet list of names |
| 7.4 | Modal has an optional "Reason for removal" textarea. | ✅ Present, placeholder text matches spec |
| 7.5 | Click **Cancel** in the modal. | Modal closes; Setup Crew row still present in form |
| 7.6 | Re-open deletion modal for Setup Crew. Enter reason "Venue no longer available." Click **Remove Spot and notify volunteers**. | Modal closes; Setup Crew row removed from form |
| 7.7 | Click Save. | Redirects to signups page; Setup Crew row gone |

### 7B — Email verification (cancellation)

After step 7.7, check the volunteer inbox (the email used when signing up for Setup Crew):

| # | Check | Expected |
|---|-------|----------|
| 7.8 | Subject line | `SignupSmartly: Your signup for Edit QA — Scheduled (edited) has been cancelled` |
| 7.9 | H1 | "Your signup has been cancelled" |
| 7.10 | Details box: Event row | Event title present |
| 7.11 | Details box: Spot row (not "Slot") | "Setup Crew" |
| 7.12 | Details box: Time row | 9:00–11:00 AM |
| 7.13 | Reason block | "Note from organizer: Venue no longer available." (styled dark left-border block) |
| 7.14 | No CTA buttons | ✅ No cancel link, no manage preferences link |
| 7.15 | Footer | "Questions? Contact the event organizer directly." |

To verify email was sent if the inbox isn't immediately accessible: check the **Resend dashboard** (resend.com → Emails) filtered to the volunteer email address and the last 5 minutes.

---

## 8. Date Change Notification Email

### 8A — Trigger

| # | Action | Expected |
|---|--------|----------|
| 8.1 | Open edit page for the scheduled event. Change Start date to `2026-05-01` (was `2026-04-15`). Keep all other fields the same. Click Save. | Redirects to signups page |

### 8B — Email verification

For each volunteer still signed up (after Setup Crew deletions), check their inbox:

| # | Check | Expected |
|---|-------|----------|
| 8.2 | Subject | `SignupSmartly: Date update for Edit QA — Scheduled (edited)` |
| 8.3 | H1 | "The date for this event has been updated" |
| 8.4 | Details box: "Updated date" row | `May 1, 2026` — label in bold green |
| 8.5 | Details box: "Previous date" row | `April 15, 2026` — date value has strikethrough |
| 8.6 | Details box: Spot/Item and Time rows | Correct per the volunteer's slot |
| 8.7 | CTA buttons | "Re-add to Calendar" (green button) AND "Cancel my signup" (outline button) — side by side |
| 8.8 | Cancel link | `…/signup/cancel?token={cancel_token}` — navigates to cancel page |
| 8.9 | Footer | Manage reminder preferences link present |
| 8.10 | Cancelled volunteers (Setup Crew) | Do **not** receive a date change email — they were already cancelled |

---

## 9. Location Change Notification Email

### 9A — Trigger

| # | Action | Expected |
|---|--------|----------|
| 9.1 | Open edit page. Change Location from `456 New Ave` to `789 Final Ave`. Keep date the same as set in test 8. Click Save. | Redirects to signups page |

### 9B — Email verification

For each remaining volunteer, check their inbox:

| # | Check | Expected |
|---|-------|----------|
| 9.2 | Subject | `SignupSmartly: Location update for Edit QA — Scheduled (edited)` |
| 9.3 | H1 | "The location for this event has been updated" |
| 9.4 | Details box: "New location" row | `789 Final Ave` — label in bold green |
| 9.5 | Details box: "Previous location" row | `456 New Ave` — value with strikethrough |
| 9.6 | Details box: Date row | `May 1, 2026` (updated date) |
| 9.7 | CTA button | Single "Cancel my signup" outline button — **no** Re-add to Calendar |
| 9.8 | Footer | Manage reminder preferences link present |

---

## 10. Simultaneous Date + Location Change

| # | Action | Expected |
|---|--------|----------|
| 10.1 | Open edit page. Change both Start date (e.g. `2026-06-01`) AND Location (`999 Both Changed Ave`) in the same save. | Both a date change email AND a location change email are sent to each remaining volunteer — two separate emails |

---

## 11. No-Op Saves (No Emails Triggered)

| # | Action | Expected |
|---|--------|----------|
| 11.1 | Open edit page. Change only the Title (no date, location, or slot changes). Save. | No notification emails sent to any volunteers |
| 11.2 | Add a new slot, save. | No notification emails sent to existing volunteers |
| 11.3 | Increase capacity of an existing slot, save. | No notification emails sent |

---

## 12. PATCH API — Security Checks

Use curl or a REST client (e.g. Postman, Bruno) with `Content-Type: application/json`.

| # | Request | Expected |
|---|---------|----------|
| 12.1 | `PATCH /api/events/{id}` — no auth cookie/header | `401 Unauthorized` |
| 12.2 | `PATCH /api/events/{id}` — authenticated as a different user who doesn't own the event | `403 Forbidden` |
| 12.3 | `PATCH /api/events/{id}` — authenticated as organizer, body `{}` (missing required `title`) | `400 Bad Request` |
| 12.4 | `PATCH /api/events/{id}` — authenticated, valid body but a slot's capacity is below its signup count | `409 Conflict` (server-side capacity double-check) |
| 12.5 | `PATCH /api/events/{id}` — authenticated, well-formed body | `200 { id: "..." }` |

---

## 13. PostHog — `event_edited` Tracking

| # | Action | Expected |
|---|--------|----------|
| 13.1 | Open the browser's Network tab (filter: `posthog`). Save a valid edit that changes the date and deletes a slot. | Network request to PostHog with event name `event_edited` |
| 13.2 | Inspect the PostHog event payload. | Properties: `event_id`, `date_changed: true`, `location_changed: false`, `slots_deleted: 1`, `slots_added: 0` |

---

## 14. Simple Event — Item Deletion + Email Terminology

| # | Action | Expected |
|---|--------|----------|
| 14.1 | On the `Edit QA — Simple` edit page, delete **Bring Food** (has 1 signup). | Confirmation modal: "Remove this Item?" (not Spot) |
| 14.2 | Modal button: **Remove Item and notify volunteers** | ✅ Uses "Item" |
| 14.3 | Confirm deletion. Save. | Cancellation email sent to volunteer |
| 14.4 | Email body: details box label | "Item:" (not "Spot:") on the role row |

---

## Post-test Cleanup

- Delete the `Edit QA — Scheduled` and `Edit QA — Simple` test events from Supabase (or via the app if a delete feature exists).
- Remove any leftover test signups from the `signups` table if the events can't be fully deleted.

---

## Pass Criteria

The feature passes QA when:

- All UI cases (sections 1–7A, 8A, 9A, 11, 14) behave as described
- All three email types arrive in the correct inbox with correct content (sections 7B, 8B, 9B)
- No emails are sent for no-op saves (section 11)
- API security checks return the correct HTTP status codes (section 12)
- PostHog fires `event_edited` with accurate properties (section 13)
- Simple vs. scheduled terminology (Item/Spot) is consistent in modal, form labels, and emails (sections 3, 5.4, 14)
