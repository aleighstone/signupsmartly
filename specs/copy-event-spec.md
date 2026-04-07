# Spec: Copy Event + Share a Copy with Another Organizer

## Schema alignment note

This spec was written with generic field names. The actual codebase uses:

| Spec term | Actual field |
|---|---|
| `status = 'draft'` | `published = false` |
| `owner_id` | `created_by` (user) + `organization_id` (org) |
| `/events/[slug]/edit` redirect | `/dashboard/event/[id]/edit` |

All references below use the spec terms for readability — Cursor has already mapped these to the correct schema.

## Overview

Two related but distinct features:

1. **Copy for yourself** — duplicate any of your own events as a draft in your dashboard
2. **Share a copy** — send a copy of an event to another email address; handle both existing and new SignupSmartly users via a claim-link flow

---

## 1. Copy for Yourself

### Entry point

- On the organizer's event dashboard card (three-dot menu or secondary button): **"Make a copy"**
- Also available on the event detail/edit page

### Behaviour

- Creates a new event record with:
  - `title`: `"Copy of [original title]"`
  - `status`: `draft`
  - `slug`: new unique slug (auto-generated, same logic as event create)
  - `owner_id`: current user's id
  - `created_at`: now
  - All other event fields copied as-is: `description`, `type`, `show_signups`, `theme`
- Creates new slot records for each original slot:
  - All slot config fields copied: `role_name`, `capacity`, `start_date`, `start_time`, `end_time`, `instructions`, `comment_label`, `comment_required`, `comment_show_publicly`
  - **No signups are copied** — each slot starts with zero volunteers
  - `event_id` set to the new event's id; new `id` generated for each slot
- Slot dates are copied as-is (organizer reviews and edits before publishing)
- After copy: redirect to the edit page for the new event so the organizer can review/update before publishing
- Toast: "Copy created — review and publish when ready."

### API

`POST /api/events/[id]/copy`

- Auth: must be owner of the source event
- Returns: `{ eventId, slug }` of the new draft event
- No request body needed

---

## 2. Share a Copy with Another Organizer

### Entry point

- Same three-dot menu / event detail page: **"Share a copy"**
- Opens a small modal: single email input field + "Send" button

### What "share a copy" does

1. Creates a copy of the event exactly as above (Copy for Yourself), **except**:
   - `owner_id`: `null` (unclaimed)
   - `status`: `draft`
2. Creates a `pending_transfers` record (see schema below)
3. Sends a **"claim" email** to the recipient (see email designs below)
4. Shows the sender a confirmation: "A copy has been sent to [email]. It expires in 14 days if unclaimed."

### Pending Transfers table

```sql
create table pending_transfers (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  sender_id      uuid not null references auth.users(id),
  recipient_email text not null,
  token          text not null unique default encode(gen_random_bytes(32), 'hex'),
  claimed_at     timestamptz,
  expires_at     timestamptz not null default (now() + interval '14 days'),
  created_at     timestamptz not null default now()
);

create index on pending_transfers(token);
create index on pending_transfers(recipient_email);
```

RLS: only the sender (by `sender_id`) can read their own outgoing transfers. Service role used for claim resolution.

### Claim flow — recipient HAS an existing account

1. Recipient receives claim email, clicks "Claim your signup"
2. Link: `/claim/[token]`
3. `/claim/[token]` page:
   - Validates token (exists, not expired, not already claimed)
   - If the current session user's email matches `recipient_email`: auto-resolves immediately → sets `event.owner_id` to their user id, marks `claimed_at`, redirects to their dashboard with the new event highlighted
   - If logged in but email doesn't match: show error "This invitation was sent to a different email address."
   - If not logged in: show sign-in prompt with the event preview card visible; after sign-in, resolve as above

### Claim flow — recipient does NOT have an account

1. Recipient receives claim email, clicks "Claim your signup"
2. Link: `/claim/[token]`
3. `/claim/[token]` page detects no user with `recipient_email` exists
4. Shows:
   - Event preview card (title, type, slot count)
   - Headline: "Create your free SignupSmartly account to claim this signup"
   - Simple form: Name + Password only (email is pre-filled from the token and shown but not editable)
   - Submit: "Create account & claim signup"
5. On submit:
   - Create Supabase auth user with the `recipient_email` + password (atomic with claim)
   - Set `event.owner_id` to new user's id
   - Mark `pending_transfers.claimed_at`
   - Redirect to their new dashboard with the claimed event visible
   - Welcome email sent by Supabase auth (standard)

### Edge cases

| Scenario | Handling |
|---|---|
| Token not found | 404 page: "This link is invalid or has expired." |
| Token expired (>14 days) | Same 404 page. Event copy with null owner_id is deleted by a cleanup job. |
| Token already claimed | "This signup has already been claimed." |
| Sender cancels before recipient claims | Delete `pending_transfers` record + the unclaimed event copy (add a "Cancel" option in the sender's dashboard) |
| Recipient email is the sender's own email | Block at submission: "You can't share a copy with yourself — use Make a copy instead." |

### Cleanup job

A Supabase cron job (or Edge Function on schedule) runs daily:
- Deletes `pending_transfers` records where `expires_at < now()` and `claimed_at is null`
- Deletes associated unclaimed event copies (`events` where `owner_id is null` and no pending transfer references them)

---

## Email Designs

Both emails are sent via **Resend** using React Email templates (`.tsx` files in `emails/`). Use the same layout/styling as existing transactional emails in the project.

### Email A — Recipient has an existing account

**Subject:** [Sender Name] shared a signup with you on SignupSmartly

**Body:**

> Hi there,
>
> **[Sender Name]** ([sender@email.com]) made a copy of their signup **"[Event Title]"** and sent it to you.
>
> It's waiting in your SignupSmartly account — claim it to add it to your dashboard.
>
> **[Claim your signup →]** *(large CTA button)*
>
> If you weren't expecting this, you can safely ignore this email.
>
> — The SignupSmartly team

*Fine print (small muted text below the footer line):*
> This claim link expires 14 days from when it was sent. After that, the shared copy will be removed.

---

### Email B — Recipient does NOT have an account

**Subject:** You've been invited to SignupSmartly — your signup is ready

**Body:**

> Hi there,
>
> **[Sender Name]** ([sender@email.com]) set up a signup for you on SignupSmartly — **"[Event Title]"** — and it's ready to go.
>
> Create your free account to claim it and start sharing with volunteers.
>
> **[Claim your signup →]** *(large CTA button)*
>
> SignupSmartly is a free tool for organizing volunteers. No credit card required.
>
> — The SignupSmartly team

*Fine print (small muted text below the footer line):*
> This claim link expires 14 days from when it was sent. After that, the shared copy will be removed. If you weren't expecting this, you can safely ignore this email.

---

## UI Details

### Dashboard — pending outgoing transfers

Under each event with an unclaimed outgoing transfer, show a subtle status line:
> 📤 Shared copy pending · Sent to kristen@email.com · [Cancel]

Clicking Cancel: confirmation dialog "Cancel this share? The copy will be deleted." → on confirm, delete transfer + unclaimed event.

### `/claim/[token]` page — event preview card

Show before any auth/sign-up prompt so the recipient knows what they're claiming:

```
┌─────────────────────────────────────┐
│  📋  Track Meet Volunteer Signup     │
│  Scheduled · 8 volunteer spots       │
│                                     │
│  Shared by Allison Stone             │
└─────────────────────────────────────┘
```

---

## What's New Entry

```ts
{ type: 'new', text: 'Copy Event — duplicate any of your signups as a draft, or share a copy directly with another organizer. New organizers can claim their signup and create an account in one step.' }
```

---

## Files to change

| File | Change |
|---|---|
| `app/api/events/[id]/copy/route.ts` | New POST route — copy event + slots |
| `app/api/events/[id]/share/route.ts` | New POST route — copy + create pending_transfer + send email |
| `app/api/claim/[token]/route.ts` | New POST route — resolve claim (auth check + owner_id assignment) |
| `app/claim/[token]/page.tsx` | New public page — event preview + sign-in or sign-up form |
| `components/EventCard.tsx` | Add "Make a copy" and "Share a copy" to three-dot menu |
| `components/ShareCopyModal.tsx` | New modal — email input |
| `emails/claim-existing-user.tsx` | New Resend/React Email template — existing user |
| `emails/claim-new-user.tsx` | New Resend/React Email template — new user |
| `supabase/migrations/YYYYMMDD_pending_transfers.sql` | New table |

---

## Out of scope (future)

- Co-ownership (two active organizers on the same live event) — separate feature
- Transferring ownership of a live event with existing signups
- Bulk sharing (one copy to multiple recipients at once)
