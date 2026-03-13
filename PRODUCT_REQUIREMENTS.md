# SignupSmartly — Product Requirements (Current)

A cleaner, ad-free way to coordinate volunteer and sign-up lists for community events, classrooms, and sports. Create events, define roles, share a link. No ads, no clutter.

---

## User Types

1. **Organizers** — Create signups (scheduled or simple list), manage signups, see coverage
2. **Volunteers** — View open slots, sign up (no account required), cancel via email link

---

## Public Pages

### Homepage

- Hero: "Create smart signups, without the noise"
- Value prop for community events, classrooms, sports
- CTAs: "Create your first sign up", "Sign in"
- Sections: "For organizers", "For volunteers"
- Header: Logo, Sign in, Get started
- Footer: Tagline, Digitaleigh Co. link
- Favicon: `smartly-icon.png`
- Metadata: title, OG, Twitter

### Event Page (`/event/[id]`)

- Event header (title, description, location, dates — "No date" when start_date is null for simple lists)
- Coverage meter: label "Coverage"; for scheduled "X of Y spots filled", for simple "X of Y items filled"
- Slot list: "Still Needed" (open slots) and "Filled Spots" (scheduled) or "Filled Items" (simple)
- **Scheduled slots:** role name, time (or "All day"), spots remaining, optional instructions
- **Simple list slots:** item name, items remaining, optional description; no time display; sorted alphabetically by item name
- Sign up button opens modal
- Link: "Organized with SignupSmartly"
- Dynamic: no caching so signup counts update immediately

### Signup Modal

- Shows: "Signing up for [spot/item name]"; if the spot has instructions or item has description, display that text below the name
- Fields: name, email, optional comment
- Submit creates signup and redirects to confirmation

### Signup Confirmation (`/signup/confirm?id=...`)

- "You're signed up!"
- **Do not show empty data** — only render sections when data exists
- **Date:** Shown when event/slot has a date
- **Time:** Shown only when slot has both start_time and end_time; do not show "All day" when there is no time
- **Scheduled:** Label "Spot", shows spot name, date (if any), time (if any), event, location
- **Simple list:** Label "Item", shows item name, date (if any), event, location; no time row
- "Add to Calendar" (Google Calendar)
- "Cancel signup"
- "← Back to Event Page"

### Signup Cancel (`/signup/cancel?token=...`)

- Volunteer cancels via secure link from confirmation email

---

## Organizer Auth

### Sign Up / Login

- Email + password auth (Supabase)
- Sign up: creates user and organization
- Login: existing organizers

---

## Organizer Dashboard

### Dashboard (`/dashboard`)

- **Title:** "Your Signups"
- **Logged out:** "Sign in to view and manage your events" + "Create your first event", "Sign in"
- **Logged in, no events:** "Nothing to see here." + "Create your first signup"
- **Logged in, has events:** List of signups with title, date range, coverage meter; "View My Signups" (primary), "Signup Page" (secondary, opens in new tab)

### Create Signup (`/create-event`)

- **Page title:** "Create Signup"
- **Nav button:** "Create Signup"
- **Submit button:** "Create Signup"
- **Signup type selector:** "I want to [dropdown] [help]" — dropdown options: "organize by schedule", "request items in a simple list", "use one of my templates"; help (?) opens modal explaining the two types
- **Use template:** When "use one of my templates" is selected, show template picker; selecting a template pre-fills spots/items, description, location (title and dates left empty)
- **Post-creation modal:** After creating, offer "Save as template?" — 3 steps: (1) prompt with "Yes, Save it" / "No, I'm good.", (2) enter template name, (3) confirmation

**Scheduled (organize by schedule):**

- Event Details: Title*, Description, Location*
- Scheduled spots (at least one): Date*, Start time (optional), End time (optional), Spot name*, Need*, Instructions (optional)
- Add/remove spots

**Simple list (request items):**

- Signup Details: Title*, Description, Location (optional), Date (optional)
- Items (at least one): Item name*, Description (optional), Need*
- Add/remove items

### Signups Page (`/dashboard/event/[id]/signups`)

- Path renamed from `/roster` (redirect in place)
- Back to Dashboard
- Event title, date range, coverage meter (use "spots" for scheduled)
- **Scheduled:** Table: Spot, Name, Email, Time, Comment, Signup Timestamp
- **Simple list:** Table: Item, Name, Email, Comment, Signup Timestamp — no Time column
- **Table behavior:** No truncation; text wraps in all columns
- **Coverage (# still needed):** Make clickable; opens modal listing spots/items that still need filling
- Export CSV (columns adapt by signup type)
- *(Generate Volunteer Recap removed; may return later)*

---

## Volunteer Flow

1. Open event link
2. View open slots
3. Click Sign up → modal
4. Enter name, email, optional comment
5. Submit → confirmation page
6. Email with Add to Calendar + Cancel link
7. Can cancel anytime via email link

---

## Templates

- Organizers can save an event setup as a template for reuse
- **Create from template:** "I want to" → "use one of my templates" → pick template → form pre-fills spots/items, description, location; title and dates left empty
- **Save as template:** Post-creation modal offers "Save as template?" — 3-step flow: (1) "Yes, Save it" / "No, I'm good.", (2) enter template name, (3) confirmation
- API: `GET/POST /api/templates`, `GET /api/templates/[id]`
- Templates are scoped to the organizer's organization

## Data Model

- **Organizations** — name, timezone
- **Users** — organizers (auth)
- **Events** — title, description, location, start_date (optional for simple), end_date (optional), signup_type ('scheduled' | 'simple'), published
- **Slots** — role_name (item name for simple), role_description, capacity, start_time (optional; null for simple), end_time (optional; null for simple), instructions
- **Signups** — name, email, comment, cancel_token, cancelled
- **Templates** — name, description, location, signup_type, organization_id
- **Template_slots** — template_id, role_name, role_description, capacity, start_time, end_time, instructions

---

## Design System

- **Theme:** Focused Organic (Warm Sand, Softened Sage, Charcoal)
- **Fonts:** Quicksand (headings), Inter (body)
- **Buttons:** `btn-primary`, `btn-secondary`, `btn-primary-lg`, `btn-secondary-lg` — equal sizing (transparent border on primary to match secondary)
- **Colors:** sand, charcoal, muted, sage, sage-hover, coral, surface

---

## Tech Stack

- Next.js 14 (App Router), TypeScript
- Supabase (Postgres, Auth)
- Resend (confirmation emails)
- Vercel (deployment)
- Tailwind CSS

---

## Email

- Signup confirmation: **scheduled** — Spot, Time, event, location; **simple list** — Item, event, location (no Time row)
- Add to Calendar link, Cancel link
- Time shows "All day" when slot has no start/end time (scheduled only)

---

## QA Testing Scenarios

Use these flows to QA the app end-to-end.

### Organizer: Create & manage signups

| Scenario | Steps | Expected |
|----------|-------|----------|
| Create scheduled signup | Create Signup → "organize by schedule" → fill event details, add spots with dates/times → Create Signup | Event created; redirect to dashboard; event appears |
| Create simple signup | Create Signup → "request items in a simple list" → fill details, add items → Create Signup | Event created; appears on dashboard |
| Save as template (post-creation) | After creating an event, in modal: "Yes, Save it" → enter template name → confirm | Template saved; appears in template picker on next create |
| Use template | Create Signup → "use one of my templates" → select template | Form pre-fills spots/items, description, location; title and dates empty |
| View My Signups | Dashboard → View My Signups on an event | Signups page loads; table shows Spot/Item, Name, Email, Time (if scheduled), Comment, Signup Timestamp |
| Export CSV | Signups page → Export CSV | CSV downloads with appropriate columns for signup type |
| Coverage (# still needed) click | Signups page or event page → click coverage / "# still needed" | Modal lists spots or items that still need filling |

### Volunteer: Sign up & cancel

| Scenario | Steps | Expected |
|----------|-------|----------|
| Sign up (scheduled) | Open event link → pick a spot with time → Sign up → enter name, email, comment → Submit | Confirmation page shows Spot, date, time, event, location |
| Sign up (simple list) | Open event link → pick an item → Sign up → enter name, email → Submit | Confirmation page shows Item, event, location; no time row |
| Signup modal instructions | Open signup modal for a spot with instructions | Instructions shown below spot name |
| Confirmation: date/time logic | Sign up for slot with no date or no time | Date shown only when present; time shown only when both start/end exist; no "All day" when no times |
| Cancel via email | Open cancel link from confirmation email | Cancel page; confirm cancel; signup removed from spot/item |

### Dashboard & event page

| Scenario | Steps | Expected |
|----------|-------|----------|
| Coverage meter | View event page or dashboard | "X of Y spots filled" (scheduled) or "X of Y items filled" (simple) |
| Add to Calendar | Confirmation page → Add to Calendar | Opens Google Calendar with event/slot details; no crash when date is null |
| Empty / null handling | Event with optional date, slot with optional times | No "All day" when no times; "No date" when no start_date; Add to Calendar handles null date |

### Templates

| Scenario | Steps | Expected |
|----------|-------|----------|
| Create template | Post-creation modal → Yes, Save it → name → confirm | Template created and available in dropdown |
| List templates | Create Signup → "use one of my templates" | Dropdown shows saved templates |
| Pre-fill from template | Select template → fill title/dates → Create Signup | New event uses template spots/items; title and dates are new |
