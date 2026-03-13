# SignupSmartly — Product Requirements (Current)

A cleaner, ad-free way to coordinate volunteer and sign-up lists for community events, classrooms, and sports. Create events, define roles, share a link. No ads, no clutter.

---

## User Types

1. **Organizers** — Create events, manage rosters, see coverage
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

- Event header (title, description, location, dates)
- Coverage meter (filled vs total roles, percentage, "still needed" count)
- Slot list: "Still Needed" (open slots) and "Filled Roles"
- Per slot: role name, time (or "All day" if no times), spots remaining, optional instructions
- Sign up button opens modal
- Link: "Organized with SignupSmartly"
- Dynamic: no caching so signup counts update immediately

### Signup Modal

- Fields: name, email, optional comment
- Submit creates signup and redirects to confirmation

### Signup Confirmation (`/signup/confirm?id=...`)

- "You're signed up!"
- Shows: role, time, event, location
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

- **Logged out:** "Create your first event" + "Sign in"
- **Logged in, no events:** "Create your first event"
- **Logged in, has events:** List of events with title, date range, coverage meter, "View Event", "View Roster"

### Create Event (`/create-event`)

**Event Details (required*):**

- Title*
- Description
- Location*
- Start date*
- End date (optional; "Add end date" link to reveal)

**Volunteer Roles (at least one):**

- Role name*
- Capacity*
- Start time (optional)
- End time (optional)
- Instructions (optional)

- Add/remove slots
- Asterisks indicate required fields
- Submit publishes event

### Event Roster (`/dashboard/event/[id]/roster`)

- Back to Dashboard
- Event title, date range, coverage meter
- Table: Role, Volunteer Name, Email, Time, Comment, Signup Timestamp
- Export CSV
- Generate Volunteer Recap (copy or download text)

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
- **Events** — title, description, location, start_date, end_date (optional), published
- **Slots** — role_name, capacity, start_time (optional), end_time (optional), instructions
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

- Signup confirmation: role, time, event, location, Add to Calendar link, Cancel link
- Time shows "All day" when slot has no start/end time
