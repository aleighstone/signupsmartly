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
- **Volunteer-facing themes:** event page uses selected theme (`events.theme`) for heading font + primary accents (buttons/links/icon accents/coverage bar)
- Coverage meter: label "Coverage"; for scheduled "X of Y spots filled", for simple "X of Y items filled"
- Slot list: "Still Needed" (open slots) and "Filled Spots" (scheduled) or "Filled Items" (simple)
- **Scheduled slots:** role name, date + time when available (or date only), spots remaining, optional instructions
- **Simple list slots:** item name, items remaining, optional description; no time display; sorted alphabetically by item name
- **Public signups visibility:** volunteers can view who signed up for multi-capacity slots when event setting allows it (`events.show_signups`); organizer can disable for anonymous signups
- Sign up button opens modal
- Link: "Organized with SignupSmartly"
- Dynamic: no caching so signup counts update immediately
- **Org subdomain:** When visited via `{slug}.signupsmartly.com`, shows org branding (logo, primary color); back link and footer vary by org (see Org Subdomains)

### Signup Modal

- Shows: "Signing up for [spot/item name]"; if the spot has instructions or item has description, display that text below the name
- Fields: name, email, notes field
- **Per-spot notes:** each slot/item can define a custom notes label (`slots.comment_label`) and whether notes are required (`slots.comment_required`)
- **Reminder** (when event has a date): Checkbox "Send me a reminder email" (default on); dropdown: "1 day before" or "Morning of the event"
- Submit creates signup and redirects to confirmation

### Signup Confirmation (`/signup/confirm?id=...`)

- "You're signed up!"
- Uses the event's volunteer-facing theme (heading font + primary button color)
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

### Volunteer Reminders

- **Goal:** Let volunteers receive reminder emails about their signup at a time they choose.
- **Availability:** Reminders only available for events with a date (`start_date`). Simple list events with no date: hide reminder controls; no reminders sent.
- **Signup modal:** Below Comment, show Reminder section when event has date — checkbox "Send me a reminder email" (checked by default); dropdown "1 day before" / "Morning of the event".
- **Preferences page (`/signup/preferences?token=…`):** Linked from confirmation email, reminder email, and confirmation page footer. Uses `cancel_token`; 404 if not found or cancelled. Shows event/slot name and current preference; toggle on/off and change timing; success/error inline.
- **Backend:** `signups.reminder_opt_in`, `signups.reminder_offset` ('1_day' | 'morning_of'), `signups.reminder_sent_at`. Timing: "1 day before" = 24h before slot/event; "morning of" = 8:00 AM org timezone. Single daily cron sends pending reminders; skip/tombstone if >24h overdue or signup cancelled.

---

## Org Subdomains

- **URL pattern:** `{slug}.signupsmartly.com` (e.g. `falconstrack.signupsmartly.com`)
- **Org home (`/` on subdomain):** Rewritten to `/org/[slug]`; shows org name/logo, tagline, list of published events with coverage meters and Sign Up buttons; footer "Organized with SignupSmartly" linking to marketing homepage
- **Event pages on subdomain:** Back link to org home (or custom label); primary color on buttons; footer "Organized with SignupSmartly"
- **Branding:** Organizations have `slug`, `primary_color`, `logo_url`; applied when `x-org-slug` header is set by middleware
- **Falcons customizations (slug `falconstrack`):** Display name "LA Falcons Track Parent Volunteers" (not linked at top); footer "Organized with SignupSmartly" linking to signupsmartly.com; additional footer line "For more info visit www.falconstrack.com or contact us" (contact us = `mailto:lafalcons1990@gmail.com`)

---

## Organizer Auth

### Sign Up (`/signup`)

- **Goal:** Let new organizers create an account and get to the dashboard with minimal friction.
- **Fields:** Name (required), Email (required, valid email), Password (required, min 6 chars).
- **Behavior:**
  - Form submits to Supabase email + password auth.
  - On success:
    - Supabase sends a confirmation email using `emailRedirectTo = /auth/callback?next=/dashboard`.
    - App:
      - Identifies the user in PostHog (`organizer_signed_up` event with user id + email).
      - Calls `/api/auth/sync-user` to upsert the app `users` row with id, email, and name (falling back to local-part or "Organizer").
      - Redirects to `/signup/success`.
  - On error, show an inline error message at the top of the form; keep field values.
- **UI copy:**
  - Title: "Create account"
  - Subtitle: "Create an account to organize volunteer events"
  - Primary button: "Create account"
  - Footer: "Already have an account? Sign in" (links to `/login`).
- **Google OAuth:** "Continue with Google" is available and uses Supabase OAuth flow.

### Sign Up Success (`/signup/success`)

- **Audience:** Newly registered organizers after a successful sign up.
- **Content:**
  - Heading: "You're in!"
  - Body copy: "Check your email to confirm your account and come back to sign in."
  - Primary action: "Go to sign in" → `/login`.
- **Behavior:**
  - Page is safe to refresh; no side effects.
  - Does not auto-redirect; user is in control of when to go sign in.

### Login (`/login`)

- Email + password auth (Supabase) for existing organizers.
- Google OAuth login ("Continue with Google") is available via Supabase OAuth.
- On first successful login for a Supabase user without a corresponding app `users` row, create:
  - `users` row with id, email, and name (from metadata or email local-part).
  - Default organization and `organization_members` owner record if none exist.

---

## Organizer Dashboard

### App Nav (hamburger menu)

- Logo, Create Signup button, hamburger menu
- **Menu (authenticated):** User name (muted/grey), Settings, What's New, Submit Feedback, Sign Out

### Dashboard (`/dashboard`)

- **Title:** "Your Signups"
- **Logged out:** "Sign in to view and manage your events"
  - Primary CTA: "Create your first event" → `/signup`
  - Secondary CTA: "Sign in" → `/login`
- **Logged in, no events:** "Nothing to see here." + "Create your first signup"
- **Logged in, has events:** List of signups with title, date range, coverage meter; "View My Signups" (primary), "Signup Page" (secondary, opens in new tab)

#### NPS Survey (Dashboard)

- **Placement:** Appears as a banner block near the bottom of the dashboard when conditions are met.
- **Eligibility rules:**
  - User is authenticated in Supabase.
  - User has an app `users` row.
  - User has at least one event that has volunteer signups (`hasEventWithVolunteerSignup` true).
  - `users.nps_submitted_at` is `NULL`.
  - If `users.nps_dismissed_at` is non-null, at least 7 full days have passed since that timestamp.
- **Step 1 – Score:**
  - Question: "How likely are you to recommend SignupSmartly to a friend or colleague?"
  - Scale 0–10 rendered as circular buttons.
  - Labels below scale: "Not likely at all" (left) and "Extremely likely" (right).
  - Close button:
    - Clicking "✕" dismisses the banner for the user.
    - Calls `/api/nps/dismiss` (POST) and records `nps_dismissed_at` on the user.
    - Even if the request fails, the banner hides locally for the current session.
  - Analytics: When the banner is first shown, track `nps_banner_shown`. When a score is clicked, track `nps_score_selected` with `score`.
- **Step 2 – Comment (optional):**
  - Question: "What's the main reason for your score?"
  - Shows the previously chosen score.
  - Multiline text area where the user can leave free-form feedback (optional).
  - Actions:
    - "Send feedback" → submits score + comment.
    - "Skip, just submit my score" → submits score without comment.
  - Both actions call `/api/nps/submit` (POST) with:
    - `score` (0–10, required).
    - `comment` (string or `null`; trimmed, `null` when empty or when skipping).
  - On success:
    - Sets `users.nps_submitted_at` to now.
    - Transitions UI to the Thank You state.
  - Analytics:
    - With comment: `nps_comment_submitted` with `score` and `has_comment`.
    - Score only: `nps_score_only_submitted` with `score`.
- **Step 3 – Thank You:**
  - Copy:
    - Heading: "Thanks for the feedback! 🙏"
    - Body: "It really helps us make SignupSmartly better."
  - Behavior:
    - Banner auto-dismisses itself after ~3 seconds.
    - Once dismissed, it respects `nps_submitted_at` and will not show again for that user.

### Create Signup (`/create-event`)

- **Page title:** "Create Signup"
- **Nav button:** "Create Signup"
- **Submit button:** "Create Signup"
- **Signup type selector:** "I want to [dropdown] [help]" — dropdown options: "organize by schedule", "request items in a simple list", "use one of my templates"; help (?) opens modal explaining the two types
- **Use template:** When "use one of my templates" is selected, show template picker; selecting a template pre-fills spots/items, description, location (title and dates left empty)
- **Post-creation modal:** After creating, offer "Save as template?" — 3 steps: (1) prompt with "Yes, Save it" / "No, I'm good.", (2) enter template name, (3) confirmation
- **Customize appearance** (collapsible): choose signup page theme from 42 curated colors + 21 curated Google Fonts
- **Signup settings:** toggle "Show who signed up" (default on; can be turned off for anonymous signups)

**Scheduled (organize by schedule):**

- Event Details: Title*, Description, Location*
- Scheduled spots (at least one): Date*, Start time (optional), End time (optional), Spot name*, Need*, Instructions (optional), Notes label (optional custom text), Notes required toggle
- Add/remove spots
- Spot rows auto-sort chronologically by date/time when saving

**Simple list (request items):**

- Signup Details: Title*, Description, Location (optional), Date (optional)
- Items (at least one): Item name*, Description (optional), Need*, Notes label (optional custom text), Notes required toggle
- Add/remove items

### Signups Page (`/dashboard/event/[id]/signups`)

- Path renamed from `/roster` (redirect in place)
- Back to Dashboard
- Event title, date range, coverage meter (use "spots" for scheduled)
- **Scheduled:** Table: Spot, Name, Email, Time, Notes, Signup Timestamp
- **Simple list:** Table: Item, Name, Email, Notes, Signup Timestamp — no Time column
- **Table behavior:** No truncation; text wraps in all columns
- **Coverage (# still needed):** Make clickable; opens modal listing spots/items that still need filling
- **Notification settings:** Inline dropdown "Notifications for this event:" — Use my default / Instantly / Daily digest / Weekly digest / Never; auto-saves on change
- **Actions (button order):** Copy Signup URL, Edit Event, Export (dropdown)
- **Export dropdown:** Single "Export" button with options: Export CSV, Export List, Print
  - **Export CSV:** Columns adapt by signup type; downloads CSV file; notes values include custom label when set
  - **Export List:** Plain-text format for copying into emails; opens modal with formatted text and Copy button; includes header (event title, date/range, location, description), per-slot: slot name, instructions, numbered list of signups (or blank for empty slots); slot order: scheduled by start_time ascending, simple by created_at; single-day events show date only in header; multi-day events show date+time next to each scheduled spot; notes include custom label when set
  - **Print:** Triggers `window.print()`; existing print styles hide nav and actions
- *(Generate Volunteer Recap removed; may return later)*

### Edit Event (`/dashboard/event/[id]/edit`)

- Edit event details and spots/items
- **Scheduled spots:** Date, Start time, End time, Spot name, Capacity, Instructions (optional), Notes label, Notes required, Show notes publicly toggle
- **Simple items:** Item name, Capacity, Instructions (optional), Notes label, Notes required, Show notes publicly toggle
- **Customize appearance** (collapsible): choose theme color + heading font for volunteer-facing pages
- **Signup settings:** toggle "Show who signed up"
- Linked from Signups page via "Edit Event" button

---

## Organizer Signup Notifications

- **Goal:** Email organizers when volunteers sign up, with frequency controls.
- **Global preference** (`users.notification_preference`): 'instant' | 'daily' | 'weekly' | 'never' (default: 'daily'). Settings page `/dashboard/settings`, section "Signup Notifications"; API `PATCH /api/settings/notifications`.
- **Per-event override** (`events.notification_override`): same enum or null (use global). Signups page; API `PATCH /api/events/[id]/notification-override`.
- **Helper:** `effectiveNotificationPreference(userPreference, eventOverride)` — event override wins when non-null.
- **Digest tracking:** `organizer_notification_digest` table (user_id, event_id, signup_id, digest_sent_at). One row per signup per organizer; instant = send immediately and set digest_sent_at; daily/weekly = leave null for digest job.
- **On volunteer signup:** Insert digest row for org owner; if effective = 'instant', send instant email and mark sent; if 'never', skip. Organizer signing up for own event: insert row but don't send.
- **Emails:** Instant subject `[Event Title] — [Volunteer Name] just signed up`; digest subject daily `SignupSmartly — Your signup summary for [Date]`, weekly `SignupSmartly — Your weekly signup summary`. Footer link to `/dashboard/settings`.
- **Digest cron:** Same daily job as volunteer reminders. Daily pass: unsent rows from last 24h, exclude cancelled signups and events with override 'never'; send one email per organizer. Weekly pass (Mondays only): last 7 days. Tombstone old rows.

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

- **Organizations** — name, timezone, slug (unique, for subdomain), primary_color, logo_url, custom_domain (future)
- **Users** — organizers (auth)
  - NPS: `nps_dismissed_at`, `nps_submitted_at`
  - `notification_preference` — 'instant' | 'daily' | 'weekly' | 'never' (default: 'daily')
- **Events** — title, description, location, start_date (optional), end_date (optional), signup_type ('scheduled' | 'simple'), published
  - `show_signups` — boolean; controls whether volunteers can view who signed up on public event page (default true)
  - `theme` — json (`{ colorKey, fontKey }`) for volunteer-facing color + heading font
  - `notification_override` — 'instant' | 'daily' | 'weekly' | 'never' | null (use global)
- **Slots** — role_name, role_description, capacity, start_time, end_time, instructions
  - `comment_label` — custom volunteer notes label (default "Comment")
  - `comment_required` — boolean; require notes on signup
  - `comment_show_publicly` — boolean; include notes in public "See who signed up" modal
- **Signups** — name, email, comment, cancel_token, cancelled, reminder_opt_in, reminder_offset ('1_day' | 'morning_of'), reminder_sent_at
- **Templates** — name, description, location, signup_type, organization_id
- **Template_slots** — template_id, role_name, role_description, capacity, start_time, end_time, instructions
- **Nps_responses** — individual NPS submissions (user_id, score, comment, created_at)
- **Organizer_notification_digest** — tracks organizer notification delivery
  - `user_id` — organizer; `event_id`; `signup_id`; `created_at`; `digest_sent_at` (null = pending)

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

- **Volunteer confirmation:** Spot/Item, date, time (if any), event, location; Add to Calendar, Cancel link; Manage reminder preferences link
- **Volunteer reminder:** Same layout; "Just a reminder — you're signed up!"; Add to Calendar, Cancel link; Manage reminder preferences link
- **Organizer instant notification:** Subject `[Event Title] — [Volunteer Name] just signed up`; signup details; "View all signups" CTA; Change notification settings link
- **Organizer digest:** Daily/weekly; grouped by event; "View all signups" per event; Change notification settings link

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
| View My Signups | Dashboard → View My Signups on an event | Signups page loads; table shows Spot/Item, Name, Email, Time (if scheduled), Notes, Signup Timestamp |
| Theme selection (create/edit) | Open Customize appearance → choose color + font → save | Public event + confirmation pages render selected theme |
| Public signups visibility toggle | In create/edit, turn off "Show who signed up" → save → open public page | "See who"/"View signups" is hidden from volunteers |
| Per-spot notes settings | Set custom notes label + required toggle on a slot/item → save | Signup modal uses custom label and enforces required when enabled |
| Export CSV | Signups page → Export → Export CSV | CSV downloads with appropriate columns for signup type |
| Export List | Signups page → Export → Export List | Modal shows plain-text list; Copy copies to clipboard |
| Print | Signups page → Export → Print | Page prints; nav and action buttons hidden |
| Edit Event | Signups page → Edit Event | Edit event page loads; can edit spots/items including Instructions |
| Edit Event instructions | Edit Event → add/edit Instructions on a spot or item → Save | Instructions persist; appear in Export List and signup modal |
| Coverage (# still needed) click | Signups page or event page → click coverage / "# still needed" | Modal lists spots or items that still need filling |

### Volunteer: Sign up & cancel

| Scenario | Steps | Expected |
|----------|-------|----------|
| Sign up (scheduled) | Open event link → pick a spot with time → Sign up → enter name, email, notes → Submit | Confirmation page shows Spot, date, time, event, location |
| Sign up (simple list) | Open event link → pick an item → Sign up → enter name, email → Submit | Confirmation page shows Item, event, location; no time row |
| Signup modal instructions | Open signup modal for a spot with instructions | Instructions shown below spot name |
| Required notes | Sign up for a slot where notes are required and submit blank | Inline validation blocks submit until notes are entered |
| Public "See who" modal | Event with show_signups on and multi-capacity filled slot → tap See who | Names display; notes display only when slot allows public notes |
| Confirmation: date/time logic | Sign up for slot with no date or no time | Date shown only when present; time shown only when both start/end exist; no "All day" when no times |
| Cancel via email | Open cancel link from confirmation email | Cancel page; confirm cancel; signup removed from spot/item |

### Org subdomain

| Scenario | Steps | Expected |
|----------|-------|----------|
| Falcons org home | Visit falconstrack.signupsmartly.com | "LA Falcons Track Parent Volunteers" at top (not linked); events listed; footer "Organized with SignupSmartly" + "For more info visit www.falconstrack.com or contact us" |
| Falcons event page | From Falcons org home → Sign Up on event | Top shows "LA Falcons Track Parent Volunteers" (not linked); footer same as org home |

### Dashboard & event page

| Scenario | Steps | Expected |
|----------|-------|----------|
| Coverage meter | View event page or dashboard | "X of Y spots filled" (scheduled) or "X of Y items filled" (simple) |
| Volunteer page theme usage | Open themed event page | Heading font + primary accents follow selected theme; neutral text remains charcoal |
| Add to Calendar | Confirmation page → Add to Calendar | Opens Google Calendar with event/slot details; no crash when date is null |
| Empty / null handling | Event with optional date, slot with optional times | No "All day" when no times; "No date" when no start_date; Add to Calendar handles null date |

### Templates

| Scenario | Steps | Expected |
|----------|-------|----------|
| Create template | Post-creation modal → Yes, Save it → name → confirm | Template created and available in dropdown |
| List templates | Create Signup → "use one of my templates" | Dropdown shows saved templates |
| Pre-fill from template | Select template → fill title/dates → Create Signup | New event uses template spots/items; title and dates are new |
