# Handoff: Dashboard Redesign — Signups List View

## Overview

This spec covers the redesigned **"Your Signups" dashboard** — the main list view organizers see after logging in. The redesign replaces a card-based layout with a table-style list on desktop and a card layout on mobile. Key additions include sortable columns, a Date column (replacing Type), disabled states for unpublished signups, and an Active/Archived toggle.

## About the Design Files

`dashboard-redesign.html` is an **HTML prototype** — a design reference showing intended layout, behavior, and visual styling. Do **not** ship it directly. Recreate this UI inside the existing SignupSmartly codebase using its established component patterns, routing, and data layer.

## Current Implementation Decisions (Apr 30, 2026)

These decisions were confirmed during implementation and should be treated as the current source of truth:

- Draft rows keep **Signup Page** visible but disabled.
- **Archive / Unarchive** is the lifecycle action used in this redesign (no hard delete action).
- Sort state persists in local UI state + `localStorage` (not URL params).
- Date sorting uses raw `start_date`; null dates sort last.
- Scope is **dashboard only** in this pass.
- Mobile cards remove the signup type badge.
- Desktop header `+ Create Signup` stays hidden when Archived tab is active.

## Fidelity

**High-fidelity.** Colors, typography, spacing, border radii, shadows, hover states, and interactions are all final. Implement pixel-closely using the existing design system tokens where they match; refer to the token values below where they don't yet exist in the system.

---

## Screen: Dashboard — Your Signups

### Layout

```
┌─────────────────────────────────────────────────────┐
│ NavBar                                              │
├─────────────────────────────────────────────────────┤
│ Page content (max-width: 1024px, centered, 28px pad)│
│                                                     │
│  "Your Signups" [Active | Archived]   [+ Create]   │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ EVENT ↕  │  DATE ↕  │  COVERAGE  │  ACTIONS  │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Row…                                          │  │
│  │ Row…                                          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Desktop (≥ 768px):** Table layout inside a single rounded card.
**Mobile (< 768px):** Individual cards stacked vertically, full width.

---

## Component Specs

### NavBar

- Background: `#FFFFFF`
- Border-bottom: `1px solid rgba(39,39,42,0.10)`
- Box-shadow: `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)`
- Inner max-width: `1024px`, centered, padding `12px 24px`
- Contains: Logo (left) + "Create Signup" primary button + hamburger menu icon (right)
- Hamburger button: `40×40px`, border-radius `10px`, border `1px solid rgba(39,39,42,0.20)`

### Logo

- App icon: `26×26px`, border-radius `5px`
- Wordmark: font `Quicksand`, weight `700`, size `18px`, color `#27272A`
- Gap between icon and wordmark: `8px`

---

### Page Header Row

Flex row, space-between, align-center, margin-bottom `20px`.

**Left side:** flex row, gap `16px`, align-center
- `<h1>` "Your Signups" — font `Inter`, size `22px`, weight `600`, color `#27272A`
- Active/Archived toggle (see below) — only rendered if `archivedCount > 0`

**Right side:**
- "+ Create Signup" primary button — hidden on mobile, hidden when Archived tab is active

---

### Active / Archived Tab Toggle

Only rendered when the user has at least one archived signup.

- Container: `display: inline-flex`, background `rgba(39,39,42,0.07)`, border-radius `10px`, padding `3px`, gap `2px`
- Each tab button:
  - Padding: `6px 14px`
  - Border-radius: `8px`
  - Font: `Inter`, size `13px`, weight `600`
  - Transition: `background 0.15s, color 0.15s`
  - **Active tab:** background `#FFFFFF`, color `#27272A`, box-shadow `0 1px 3px rgba(0,0,0,0.10)`
  - **Inactive tab:** background `transparent`, color `#71717A`
- Tab labels: "Active", "Archived"
- Default tab: **Active**
- Switching tabs re-filters the list. Sort state persists.
- "+ Create Signup" button is hidden when Archived tab is active.

---

### Table Container (Desktop)

- Background: `#FFFFFF`
- Border-radius: `12px`
- Border: `1px solid rgba(39,39,42,0.10)`
- Box-shadow: `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)`
- `overflow: hidden`

#### Table Header Row

- Background: `rgba(39,39,42,0.02)`
- Border-bottom: `1px solid rgba(39,39,42,0.10)`
- Padding: `10px 20px`
- Display: flex, align-center, gap `20px`
- Column layout (left to right):

| Column    | Flex / Width | Sortable |
|-----------|-------------|----------|
| Event     | `flex: 0 0 280px` | ✅ |
| Date      | `flex: 0 0 140px` | ✅ |
| Coverage  | `flex: 1`   | ❌ |
| Actions   | `width: 122px` | ❌ |

- Header label style: font `Inter`, size `11px`, weight `600`, color `#71717A`, `letter-spacing: 0.05em`, `text-transform: uppercase`
- Sortable headers are `<button>` elements containing the label + sort icon

#### Sort Icon

Three states for sortable columns:

- **Unsorted:** double-arrow (up + down), opacity `0.35`
- **Ascending (asc):** up-arrow only, full opacity
- **Descending (desc):** down-arrow only, full opacity

Clicking a column header cycles: unsorted → asc → desc → unsorted.
Only one column sorted at a time. When a new column is clicked, it starts at asc.

**Sort behavior:**
- **Event:** alphabetical by title (case-insensitive)
- **Date:** sort by raw `start_date`; null dates sort last

---

### Table Row (Desktop)

- Display: flex, align-center, gap `20px`, padding `14px 20px`
- Border-bottom: `1px solid rgba(39,39,42,0.10)`
- Background default: `#FFFFFF`
- Background hover: `rgba(39,39,42,0.015)` — transition immediate

**Event cell** (`flex: 0 0 280px`):
- Flex row, align-center, gap `6px`
- Title: font `Inter`, size `14px`, weight `600`, color `#27272A`, `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`
- If `published === false`: show "Draft" badge inline after title

**Date cell** (`flex: 0 0 140px`):
- Font: `Inter`, size `13px`
- If date exists: color `#27272A`
- If date is null: display `—`, color `#71717A`

**Coverage cell** (`flex: 1`):
- Flex row, align-center, gap `10px`
- Progress bar: flex `1`, background `rgba(39,39,42,0.10)`, height `6px`, border-radius `9999px`, overflow hidden
  - Fill: background `#6CBF6C`, height `100%`, width = `(filled/total * 100)%`, border-radius `9999px`
- Label: `{filled}/{total} · {pct}%`, font size `12px`, color `#71717A`, `white-space: nowrap`, width `80px`, text-align right

**Actions cell** (`width: 122px`):
- Flex row, align-center, gap `6px`
- Contains 3 controls: View icon button + Signup Page icon button + Overflow menu button

---

### Icon Buttons (in Actions cell)

**View My Signups button** (eye icon):
- Size: `34×34px`
- Border-radius: `8px`
- Border: `1px solid rgba(39,39,42,0.20)`
- Background: `#6CBF6C` (sage green)
- Icon color: `#FFFFFF`
- Icon: eye / visibility (24px Lucide `Eye`)
- Always enabled

**Signup Page button** (external link icon):
- Size: `34×34px`
- Border-radius: `8px`
- **When published:**
  - Border: `1px solid rgba(39,39,42,0.20)`
  - Background: `#FFFFFF`
  - Icon color: `#27272A`
  - Cursor: `pointer`
  - Tooltip: "Signup Page"
- **When NOT published (draft):**
  - Border: `1px solid rgba(39,39,42,0.08)`
  - Background: `rgba(39,39,42,0.03)`
  - Icon color: `rgba(39,39,42,0.25)`
  - Cursor: `not-allowed`
  - `disabled` attribute set
  - Tooltip: "Not yet published"
- Icon: external link (24px Lucide `ExternalLink`)

> **Rationale:** Draft signups don't have a live page yet. We show the button in a disabled state rather than replacing it with a "Publish" action (which lives in the overflow menu) to avoid confusion and keep the actions column visually consistent across all rows.

---

### Overflow Menu (⋮ button)

- Trigger button: `36×36px`, border-radius `9px`, border `2px solid rgba(39,39,42,0.20)`, background `#FFFFFF`
- Icon: vertical three-dot (Lucide `MoreVertical`)
- Dropdown: appears bottom-right of trigger, `z-index: 50`
  - Background: `#FFFFFF`
  - Border-radius: `12px`
  - Border: `1px solid rgba(39,39,42,0.10)`
  - Box-shadow: `0 4px 12px rgba(0,0,0,0.08)`
  - Min-width: `180px`
  - Padding: `4px 0`
  - Closes on outside click

**Menu items:**

| Label | Condition | Danger |
|-------|-----------|--------|
| Publish | Only if `published === false` | No |
| Edit signup | Always | No |
| Copy signup | Always | No |
| Archive | Active tab rows | Yes |
| Unarchive | Archived tab rows | No |

- Item padding: `10px 14px`
- Font: `Inter`, size `13px`, weight `500`
- Normal color: `#27272A`
- Danger color: `#F87171`
- Hover background: `rgba(39,39,42,0.04)`

---

### Draft Badge

- Background: `#f3f4f6`
- Color: `#6b7280`
- Border-radius: `9999px`
- Padding: `2px 8px`
- Font size: `11px`, weight `600`
- Label: "Draft"

---

## Mobile Card Layout (< 768px)

Each signup renders as a standalone card instead of a table row.

**Card container:**
- Background: `#FFFFFF`
- Border-radius: `12px`
- Border: `1px solid rgba(39,39,42,0.10)`
- Box-shadow: `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)`
- Padding: `16px`

**Card header row** (flex, space-between, gap `12px`, margin-bottom `10px`):
- Left: title + Draft/Archived badge + date
- Right: overflow menu (⋮)

**Coverage meter** (below header):
- Label row: "Coverage" left / "{filled}/{total} · {pct}%" right, font size `12px`
- Bar: same spec as desktop

**Button row** (margin-top `14px`, gap `8px`):
- "View My Signups" — full-width primary button
- "Signup Page" — full-width secondary button (or disabled per same logic as desktop)

**Tab toggle** on mobile: renders above the card list, same component as desktop.

---

## Buttons

### Primary Button
- Background: `#6CBF6C`, hover `#52A352`
- Color: `#FFFFFF`
- Border: `2px solid transparent`
- Border-radius: `10px`
- Padding: standard `9px 18px`, small `8px 14px`
- Font: `Inter`, size standard `14px`, small `13px`, weight `600`
- Min-height: `40px`
- Transition: `background 0.15s`

### Secondary Button
- Background: `transparent`, hover `rgba(39,39,42,0.05)`
- Color: `#27272A`
- Border: `2px solid #27272A`
- Border-radius: `10px`
- Padding: standard `9px 18px`, small `8px 14px`
- Font: `Inter`, size standard `14px`, small `13px`, weight `500`
- Min-height: `40px`
- Transition: `background 0.15s`

---

## Design Tokens

```
Background (page):  #FAF9F6  — warm off-white
Surface (cards):    #FFFFFF
Charcoal:           #27272A  — primary text
Muted:              #71717A  — secondary text
Sage (primary):     #6CBF6C
Sage hover:         #52A352
Coral (danger):     #F87171
Border light:       rgba(39,39,42,0.10)
Border medium:      rgba(39,39,42,0.20)
Shadow sm:          0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)
Shadow md:          0 4px 12px rgba(0,0,0,0.08)
```

**Typography:**
- Logo wordmark: `Quicksand` 700
- All other UI: `Inter` 400/500/600

---

## Data Model

Each signup object used in this view:

```ts
type Signup = {
  id: string;
  title: string;
  date: string | null;     // null = no date set (simple list signups)
  type: 'scheduled' | 'simple';
  published: boolean;
  filled: number;          // slots filled
  total: number;           // total slots
  archived: boolean;
};
```

**Filtering:**
- Active tab: `archived === false`
- Archived tab: `archived === true`
- Toggle only appears if `signups.filter(s => s.archived).length > 0`

---

## Files in This Package

| File | Purpose |
|------|---------|
| `dashboard-redesign.html` | Full interactive HTML prototype — open in browser to explore. Scroll right on the canvas to see Options A, B, C side by side. **Option C is the approved direction.** |
| `README.md` | This spec |
