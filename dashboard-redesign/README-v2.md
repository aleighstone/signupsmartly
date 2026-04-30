# Handoff: Dashboard Redesign — Signups List View (v2)

> **To the engineer implementing this:** You are an A+ frontend designer and builder. This spec is high-fidelity and the visual and interaction details are final. Match every measurement, color, icon, label, and behavior exactly as described. Do not substitute icons, rename labels, or approximate spacing. Pixel fidelity matters.

---

## Overview

This is an updated spec for the **"Your Signups" dashboard** — the main list view organizers see after logging in. It supersedes the previous handoff (`README.md` in this folder).

Key changes in this version:
1. **Event title is now a clickable link** — clicking it navigates to "View My Signups"
2. **Action buttons are redesigned** — two icon buttons (Signup Page + Edit) replace the old eye icon
3. **Overflow menu contains ALL actions** including the ones surfaced as icon buttons
4. **"View roster" renamed to "View my signups"** throughout

---

## Changed Specs

### 1. Event Title — Clickable Link

The event title in the Event column is now an `<a>` tag linking to the "View My Signups" view for that signup.

**Desktop table:**
```
<a href="/signups/{id}/responses"> {event.title} </a>
```

**Styles:**
- Font: `Inter`, `14px`, weight `600`, color `#27272A`
- Text decoration: `none` by default
- Hover: `text-decoration: underline`, `text-underline-offset: 2px`
- Wraps up to **2 lines**, truncates with ellipsis beyond that:
  ```css
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  ```
- When the row contains a 2-line title, other columns (Date, Coverage, Actions) align **vertically centered** relative to the title cell

**Mobile card:**
- Title is also an `<a>` tag with same styles (no underline, underline on hover)
- Clicking navigates to "View My Signups"

---

### 2. Action Buttons — Icon Buttons

The actions column contains exactly **two icon buttons** + **one overflow menu button**. This is the complete, final set. Do not add, remove, or reorder them.

```
[ Signup Page icon ] [ Edit icon ] [ ⋮ overflow ]
```

#### Button 1: Signup Page (External Link icon)

- **Icon:** External link / "open in new tab" — an arrow pointing out of a box. Use Lucide `ExternalLink` or equivalent. **Do not use a share icon, a globe, or any other icon.** The specific SVG path is:
  ```svg
  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
  <polyline points="15 3 21 3 21 9"/>
  <line x1="10" y1="14" x2="21" y2="3"/>
  ```
- **Tooltip:** `"Signup Page"` when published, `"Not yet published"` when draft
- **When published:** enabled, navigates to the public signup URL
- **When NOT published (draft):**
  - `disabled` attribute set
  - Border: `1px solid rgba(39,39,42,0.08)`
  - Background: `rgba(39,39,42,0.03)`
  - Icon color: `rgba(39,39,42,0.25)`
  - Cursor: `not-allowed`

#### Button 2: Edit Signup (Pencil icon)

- **Icon:** A standalone pencil — clean diagonal pencil shape, NO surrounding box or square. Use Lucide `Pencil` or equivalent. **Do not use the `Edit2`, `Edit3`, `FilePen`, or any icon that includes a square/rectangle.** The specific SVG path is:
  ```svg
  <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  ```
- **Tooltip:** `"Edit signup"`
- **Always enabled**
- Navigates to the signup editor

#### Icon Button Styles (both buttons)

- Size: `34×34px`
- Border-radius: `8px`
- Border: `1px solid rgba(39,39,42,0.20)`
- Background: `#FFFFFF`
- Icon color: `#27272A`
- Icon size: `14px`
- Cursor: `pointer`
- No hover background change needed (subtle is fine — match existing system)

#### Button 3: Overflow Menu (⋮)

- Size: `36×36px`
- Border-radius: `9px`
- Border: `2px solid rgba(39,39,42,0.20)`
- Background: `#FFFFFF`
- Icon: vertical three-dot (Lucide `MoreVertical`)

---

### 3. Overflow Menu — Complete Action Set

The overflow menu contains **ALL** actions for a signup, including the ones already surfaced as icon buttons. This is intentional — the overflow menu is the canonical place for all actions, and the icon buttons are shortcuts for the two most frequent ones.

**Menu items (in order):**

| Label | Condition | Danger |
|-------|-----------|--------|
| Publish | Only if `published === false` | No |
| Edit signup | Always | No |
| Copy signup | Always | No |
| View my signups | Always | No |
| Archive | Always | No |
| Delete | Always | Yes |

**Critical label accuracy — match exactly:**
- ✅ `"Edit signup"` — not "Edit", not "Edit event", not "Edit Signup"
- ✅ `"Copy signup"` — not "Duplicate", not "Clone"
- ✅ `"View my signups"` — not "View roster", not "View responses", not "View signups"
- ✅ `"Archive"` — not "Archived", not "Move to archive"
- ✅ `"Delete"` — not "Remove", not "Delete signup"
- ✅ `"Publish"` — shown only when `published === false`

**Menu item styles:**
- Padding: `10px 14px`
- Font: `Inter`, `13px`, weight `500`
- Normal color: `#27272A`
- Danger color: `#F87171` (Delete only)
- Hover background: `rgba(39,39,42,0.04)`

**Dropdown container:**
- Appears bottom-right of trigger button
- Background: `#FFFFFF`
- Border-radius: `12px`
- Border: `1px solid rgba(39,39,42,0.10)`
- Box-shadow: `0 4px 12px rgba(0,0,0,0.08)`
- Min-width: `180px`
- Padding: `4px 0`
- `z-index: 50`
- Closes on outside click

---

## Unchanged Specs (still apply from v1)

All other specs from the original `README.md` remain in effect:

- Layout, table structure, column widths
- Sorting behavior (Event + Date columns)
- Active/Archived tab toggle
- Draft badge
- Coverage bar
- NavBar
- Design tokens
- Data model
- Mobile card layout
- Button styles (Primary, Secondary)

---

## Files in This Package

| File | Purpose |
|------|---------|
| `dashboard-redesign.html` | Live interactive prototype — open in browser. All specs above are implemented here. This is the source of truth for visual fidelity. |
| `README.md` (v1) | Original spec — still applies except where superseded above |
| `README-v2.md` | This file |
