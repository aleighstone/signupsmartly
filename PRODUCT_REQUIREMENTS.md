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
- Coverage meter: label "Coverage"; for scheduled "X of Y roles filled", for simple "X of Y items filled"
- Slot list: "Still Needed" (open slots) and "Filled Roles" or "Filled Items" (simple)
- **Scheduled slots:** role name, time (or "All day"), spots remaining, optional instructions
- **Simple list slots:** item name, items remaining, optional description; no time display; sorted alphabetically by item name
- Sign up button opens modal
- Link: "Organized with SignupSmartly"
- Dynamic: no caching so signup counts update immediately

### Signup Modal

- Fields: name, email, optional comment
- Submit creates signup and redirects to confirmation

### Signup Confirmation (`/signup/confirm?id=...`)

- "You're signed up!"
- **Scheduled:** Shows role, time, event, location
- **Simple list:** Shows item (not role), event, location; no time row
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
- **Signup type selector:** Inline "I need to [dropdown] [help]" — dropdown options: "organize by schedule", "request items in a simple list"; help (?) opens modal explaining both types; small charcoal circle with white ? for help button
- **Submit button:** "Create Signup"

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
- Event title, date range, coverage meter
- **Scheduled:** Table: Role, Volunteer Name, Email, Time, Comment, Signup Timestamp
- **Simple list:** Table: Item (not Role), Volunteer Name, Email, Comment, Signup Timestamp — no Time column
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

## Data Model

- **Organizations** — name, timezone
- **Users** — organizers (auth)
- **Events** — title, description, location, start_date (optional for simple), end_date (optional), signup_type ('scheduled' | 'simple'), published
- **Slots** — role_name (item name for simple), role_description, capacity, start_time (optional; null for simple), end_time (optional; null for simple), instructions
- **Signups** — name, email, comment, cancel_token, cancelled

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

- Signup confirmation: **scheduled** — Role, Time, event, location; **simple list** — Item (not Role), event, location (no Time row)
- Add to Calendar link, Cancel link
- Time shows "All day" when slot has no start/end time (scheduled only)
