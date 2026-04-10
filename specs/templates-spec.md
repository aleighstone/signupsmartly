# Spec: Event Templates

## Overview

Organizers can save any signup as a template and reuse it when creating future
signups. A template captures the signup's structure (slots, items, labels,
settings) but intentionally omits the title and dates — those are always
supplied fresh for the new event.

This feature was built by Cursor independently, based on general guidance, and
this spec documents what was actually shipped.

---

## User flows

### Saving a template

After creating a new event, a post-creation modal appears with the option
"Save as template." The organizer can name the template and save it, or
dismiss the modal and skip saving.

Templates can also be saved from an existing event at any time (exact entry
point TBD — confirm in UI).

### Using a template

On the new-event creation form, a third dropdown option is available:
**"Use one of my templates."**

Selecting this pre-fills the form with the saved template's structure:
- Slots / items (names, quantities, settings) are copied in
- Comment label and other settings are preserved
- **Title is left blank** — the organizer must supply a new one
- **Dates are cleared** — no dates carry over from the template

The organizer fills in the title and dates, adjusts anything they want, and
creates the event as normal.

---

## Design decisions

- **Title excluded** — templates are reused across different occasions, so
  carrying the title over would just create extra cleanup work.
- **Dates excluded** — slots in scheduled signups are time-specific; copying
  stale dates would be actively misleading. Organizers supply dates fresh each
  time.
- **Post-creation modal** — the "save as template" prompt appears immediately
  after creating an event, when the structure is fresh and the organizer is
  most likely to recognize it as a reusable pattern.
- **Organizer-scoped** — templates belong to the organizer who created them
  and are not shared across accounts.

---

## Data model

Templates are stored in a dedicated table (exact schema TBD — confirm with
Cursor's migration). Expected columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `organizer_id` | uuid | FK → organizers / users table |
| `name` | text | Human-readable label shown in dropdown |
| `structure` | jsonb | Slots/items, quantities, labels, settings |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

The `structure` JSONB blob mirrors the shape used internally to describe a
signup's slots/items so it can be fed directly into the creation form.

---

## Open questions

- Can a template be edited after saving, or only deleted and re-created?
- Is there a template management page (list, rename, delete), or only
  creation/selection inline in the event form?
- Does the post-creation modal appear every time, or only the first time (e.g.,
  suppressed after the organizer has already saved several templates)?
- What is the exact entry point for saving a template from an *existing* event
  (as opposed to the post-creation modal)?
