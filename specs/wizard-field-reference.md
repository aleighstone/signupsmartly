# Wizard Field Reference
> Source of truth for what fields exist, which are required, and in what order — for all three signup types. Use this to design the step-by-step creation wizard.

---

## How the current form works (baseline)

The organizer picks a signup type from a dropdown, then sees one long scrolling form. All fields are visible at once. There is no step-by-step flow, no inline help, and no progressive disclosure. Fields like "comment label" and "comment required" are buried inside each slot card, which is why non-technical users miss them or don't understand what they're for.

---

## Type 1 — Simple List

**What it's for:** Items people claim, with no specific date/time per slot. Order is controlled by the organizer. Example: potluck items, donation requests, chaperone slots.

### Event-level fields (the "signup" as a whole)

| Field | Required? | Notes |
|---|---|---|
| Title | ✅ Required | e.g. "Potluck items" |
| Description | Optional | Markdown supported. Shown to volunteers above the slot list. |
| Location | Optional | Plain text. |
| Date | Optional | A single date shown to volunteers (not per-slot). Used to trigger reminder emails if provided. Stored as `start_date`/`end_date`. |
| Show signup names publicly | Optional (default: on) | Checkbox. Off = anonymous signups. |
| Theme (color + font) | Optional | Currently at the bottom of the form. |

### Slot-level fields (each "item")

| Field | Required? | Notes |
|---|---|---|
| Item name (`role_name`) | ✅ Required | e.g. "Entree", "Dessert", "Paper plates" |
| How many needed (`capacity`) | ✅ Required | Min 1. |
| Description (`role_description`) | Optional | Shown to volunteers when they click to sign up. Markdown supported. Max 800 chars. |
| Require a comment when signing up (`comment_required`) | Optional (default: off) | Checkbox. |
| Comment field label (`comment_label`) | Optional | Defaults to "Comment". Max 60 chars. Only meaningful if a comment field is shown. |

### Wizard step order (proposed)

1. **Type selection** — "I want to…" (this is the entry point for all three types)
2. **Event details** — Title (required), Description (optional), Location (optional), Date (optional)
3. **Items** — One or more slots: Item name + How many needed (required), Description (optional)
4. **Settings** — Show signup names publicly, Appearance (theme)
5. **Review + Publish / Save as Draft**

### What's currently awkward

- "Date" on a simple list is easily confused with a scheduled event date. The label should clarify it's an optional display date, not when each slot happens.
- The comment settings are buried inside each slot card. Most organizers never find them.
- "Show signup names" is in the event details section, not a settings/privacy section. It's easy to miss.

---

## Type 2 — Scheduled Signup

**What it's for:** Slots tied to specific dates (and optionally times). Example: snack duty by game date, teacher conferences by day+time, track meet volunteers by shift.

### Event-level fields

| Field | Required? | Notes |
|---|---|---|
| Title | ✅ Required | e.g. "Falcons track meet #2" |
| Description | Optional | Markdown supported. |
| Location | ✅ Required (currently) | Currently required by the Zod schema — the only type where location is required. Worth revisiting: arguably should be optional like the other types. |
| Show signup names publicly | Optional (default: on) | Checkbox. |
| Theme (color + font) | Optional | |

> **Note on start/end dates:** For scheduled signups, `start_date` and `end_date` are automatically derived from the earliest and latest slot dates. The organizer does not enter them directly.

### Slot-level fields (each "spot")

| Field | Required? | Notes |
|---|---|---|
| Spot name (`role_name`) | ✅ Required | e.g. "Announcer", "Starter", "Timer" |
| How many needed (`capacity`) | ✅ Required | Min 1. |
| Date (`spot_date`) | ✅ Required | A date picker per slot. Stored as `start_time` with `T00:00:00Z` if no time given. |
| Start time | Optional | Combined with date to build `start_time` timestamptz. |
| End time | Optional | Combined with date to build `end_time` timestamptz. |
| Instructions | Optional | Shown to volunteers when they click to sign up. Markdown supported. Max 800 chars. |
| Require a comment when signing up (`comment_required`) | Optional (default: off) | |
| Comment field label (`comment_label`) | Optional | Defaults to "Comment". Max 60 chars. |

> **Note on `role_name` in scheduled signups:** The form has a separate "Spot name" field (e.g. "Announcer"), but the value stored to `role_name` in the DB is actually the *auto-generated date/time label* (e.g. "Saturday, October 12, 2024, 7:30 AM - 9:00 AM"). The organizer's spot name input currently maps to `role_description`/`instructions`, not `role_name`. This is a known UX quirk — the wizard should make this clearer or reconsider the data model.

### Wizard step order (proposed)

1. **Type selection**
2. **Event details** — Title (required), Description (optional), Location (required — or reconsider making optional), Show signup names
3. **Spots** — One or more: Date (required), Spot name (required), How many needed (required), Start/end time (optional), Instructions (optional)
4. **Settings** — Comment options, Appearance (theme)
5. **Review + Publish / Save as Draft**

### What's currently awkward

- Location is the only required field that differs from the other types — this inconsistency is invisible to the user.
- The comment settings are inside each spot card and hard to find.
- When adding many spots on the same date (e.g. 6 roles at the same game), the user has to re-enter the date for every card. The "add spot" button pre-fills the previous slot's date, which helps, but isn't obvious.
- The auto-generated `role_name` from date+time means the "Spot name" field the user types doesn't end up as what volunteers see as the slot label — it's shown as details below the date label. This is confusing.

---

## Type 3 — Availability Poll

**What it's for:** Proposing candidate dates and letting the group mark which ones they can make. The organizer sees a tally and picks the best date later. No one is "signed up" for a role — they're just indicating availability. Example: game night scheduling, mahjong groups, recurring hangouts.

### Event-level fields

| Field | Required? | Notes |
|---|---|---|
| Title | ✅ Required | e.g. "Game night availability" |
| Description | Optional | Markdown supported. |
| Location | Optional | |
| Show who is available for each date | Optional (default: on) | Checkbox. Off = responses are private (organizer can still see). |
| Theme (color + font) | Optional | |

### Slot-level fields (each "proposed date")

| Field | Required? | Notes |
|---|---|---|
| Date (`spot_date`) | ✅ Required | One date picker per option. Duplicate date+time combos are not allowed (validated client-side). |
| Start time | Optional | |
| End time | Optional | |
| Notes (`instructions`) | Optional | Markdown. Max 800 chars. Rarely used. |

> **What gets stored:** `role_name` is auto-generated as the formatted date/time label (same pattern as scheduled). `capacity` is hardcoded to 9999 (unlimited). No comment fields.

### Wizard step order (proposed)

1. **Type selection**
2. **Poll details** — Title (required), Description (optional), Location (optional), Show who is available
3. **Proposed dates** — One or more: Date (required), Start/end time (optional), Notes (optional)
4. **Appearance** — Theme
5. **Review + Create poll**

> Note: Availability polls don't have a "Save as Draft" flow after creation — after submit they redirect directly to the signups view in the dashboard. The template-save modal is also skipped for polls.

### What's currently awkward

- "Notes" per date option is almost never used and adds visual noise to the form. Consider hiding it behind an "Add notes" expander.
- The duplicate-date validation error only shows after submit. A real-time check would be clearer.
- There's no "what happens next" explanation — users don't know they'll be able to pick a final date after responses come in.

---

## Fields that are the same across all three types

| Field | All types |
|---|---|
| Title | Required |
| Description | Optional |
| Location | Optional (except Scheduled where it's currently required) |
| Show signups publicly | Optional, default on |
| Theme (color + font) | Optional |

---

## Fields that only exist on specific types

| Field | Simple | Scheduled | Availability |
|---|---|---|---|
| Event-level date | ✅ (optional) | ❌ (derived from slots) | ❌ (derived from slots) |
| Slot: date picker | ❌ | ✅ required | ✅ required |
| Slot: start/end time | ❌ | ✅ optional | ✅ optional |
| Slot: item/spot name | ✅ required | ✅ required | ❌ (auto-generated) |
| Slot: description / instructions | ✅ optional | ✅ optional | ✅ optional (notes) |
| Slot: capacity | ✅ required | ✅ required | ❌ (hardcoded 9999) |
| Slot: comment field options | ✅ optional | ✅ optional | ❌ |

---

## Key wizard design decisions to resolve

1. **Where does type selection live?** A single upfront choice before any other fields, or can the organizer switch types mid-way? (Currently they can switch, and shared fields like title/description/location carry over — this is nice to preserve.)

2. **How many steps?** All three types could fit in 3-4 steps: (1) type + name, (2) slots, (3) settings + appearance, (4) review. Avoid making it feel like a 6-step process for something simple.

3. **Progressive disclosure for slot options.** Comment label and comment required are power-user options. Consider collapsing them under an "Advanced" expander per slot so the happy path stays clean.

4. **Inline help.** The existing "?" modal explaining the three types is good, but the wizard should also surface contextual tips (e.g. "We'll auto-generate the slot label from the date and time you enter" for scheduled).

5. **The `role_name` problem in scheduled signups.** Currently the organizer enters a "Spot name" that ends up displayed as *secondary* text, while the primary slot label is auto-built from date+time. The wizard should either (a) rename the field to "Role / what this person will do" and explain it clearly, or (b) reconsider having both a date label and a role label as first-class fields.

6. **Scheduled location being required.** Probably unintentional — worth making it optional for consistency.
