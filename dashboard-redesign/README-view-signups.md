# Handoff: Organizer "View My Signups" Page

> **To the engineer implementing this:** You are an A+ frontend designer and builder. This spec is high-fidelity. Match every measurement, color, icon, label, and behavior exactly as described. Do not approximate spacing, substitute icons, or rename labels.

---

## Overview

This spec covers the **organizer-facing "View My Signups" page** — the page an organizer sees when they click an event title from the dashboard (or "View my signups" from the overflow menu). It shows all signups for a specific event, with coverage stats and management actions.

The reference prototype is in `view-signups.html` — open it in a browser for visual reference.

---

## Design Tokens

All tokens match the dashboard. Use existing CSS variables/tokens where available.

```
Background (page):  #FAF9F6
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
Font:               Inter (UI), Quicksand (logo only)
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ NavBar (sticky)                                             │
├─────────────────────────────────────────────────────────────┤
│ ← Back to Dashboard                                        │
│                                                             │
│ [Event Title]          [Copy Signup URL] [Edit Event] [Export ▾] │
│ [Event Date]                                               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Coverage ████████████████████████████ 100%  │  3 filled │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SPOT │ DATE & TIME │ NAME │ EMAIL │ COMMENT │ TIMESTAMP │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ row…                                               [🗑] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Notifications for this event: [Daily digest ▾]             │
└─────────────────────────────────────────────────────────────┘
```

**Page max-width:** `1100px`, centered, padding `28px 24px 48px`

---

## NavBar

Identical to the dashboard NavBar. Sticky, `z-index: 10`.

- Background: `#FFFFFF`
- Border-bottom: `1px solid rgba(39,39,42,0.10)`
- Box-shadow: `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)`
- Left: Logo (icon + "SignupSmartly" wordmark)
- Right: Hamburger menu icon button (`40×40px`, border-radius `10px`)

---

## Back Link

- Text: `← Back to Dashboard`
- Font: `Inter`, `13px`, weight `500`, color `#71717A`
- Hover: color `#27272A`
- Left-arrow SVG icon (`14×14px`)
- Margin-bottom: `20px`
- Links to `/dashboard`

---

## Page Header

### Top row (flex, space-between, align-center, gap `24px`, margin-bottom `20px`)

**Left side:**
- Event title: `Inter`, `24px`, weight `700`, color `#27272A`, line-height `1.2`, margin-bottom `4px`
- Event date: `Inter`, `14px`, color `#71717A`

**Right side — action buttons (flex row, gap `8px`, align-center):**

Three buttons in a horizontal row. All same height (`40px min-height`).

#### 1. Copy Signup URL — Primary button
- Style: primary (sage green `#6CBF6C`, hover `#52A352`)
- Icon: Copy/clipboard SVG (14×14px), left of label
- Label: **`Copy Signup URL`** — exact wording
- On click: copies the public signup URL to clipboard, shows a toast: **"Signup URL copied!"**
- Toast: fixed bottom-center, background `#27272A`, color `#fff`, border-radius `10px`, padding `10px 18px`, font `13px` weight `500`, fades in/out

#### 2. Edit Event — Secondary button
- Style: secondary (transparent bg, `2px solid #27272A`, hover `rgba(39,39,42,0.05)`)
- Icon: Pencil SVG — standalone diagonal pencil, NO box/square. Path:
  ```svg
  <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  ```
- Label: **`Edit Event`** — exact wording
- Links to the event editor

#### 3. Export — Secondary button with dropdown
- Style: **same as Edit Event** — secondary (transparent bg, `2px solid #27272A`)
- Label: **`Export`** with a chevron-down icon (12×12px) to the right
- On click: toggles a dropdown menu below the button
- Closes on outside click

**Export dropdown:**
- Background: `#FFFFFF`
- Border-radius: `12px`
- Border: `1px solid rgba(39,39,42,0.10)`
- Box-shadow: `0 4px 12px rgba(0,0,0,0.08)`
- Min-width: `180px`
- Padding: `4px 0`
- Positioned: bottom-right of button, `top: calc(100% + 6px)`, `right: 0`
- `z-index: 50`

**Export menu items — exact labels:**

| Label | Action |
|-------|--------|
| `Export CSV` | Download signups as CSV |
| `Export List` | Download formatted list |
| `Print` | Open print dialog |

Item styles: padding `10px 14px`, font `Inter` `13px` weight `500`, color `#27272A`, hover background `rgba(39,39,42,0.04)`.

---

### Coverage Card

Full-width card below the top row.

- Background: `#FFFFFF`
- Border-radius: `12px`
- Border: `1px solid rgba(39,39,42,0.10)`
- Box-shadow: `0 4px 6px -1px rgba(0,0,0,0.05)`
- Padding: `16px 20px`
- Layout: flex row, gap `20px`, align-center

**Left side (flex: 1):**
- Label: `"Coverage"` — `Inter`, `13px`, weight `600`, color `#27272A`, margin-bottom `6px`
- Progress bar: background `rgba(39,39,42,0.10)`, height `8px`, border-radius `9999px`, overflow hidden
  - Fill: `#6CBF6C`, width = `(filled/total * 100)%`, border-radius `9999px`
- Subtext: `"{filled} of {total} spots filled"` — `12px`, color `#71717A`, margin-top `5px`

**Right side (flex-shrink: 0, text-align: right):**
- Large number: `(filled/total * 100)%` — `28px`, weight `700`, color `#27272A`, line-height `1`
- Sub-label: `"filled"` — `11px`, color `#71717A`, margin-top `2px`

---

## Signups Table

Same visual style as the dashboard table.

- Container: background `#FFFFFF`, border-radius `12px`, border `1px solid rgba(39,39,42,0.10)`, overflow hidden, box-shadow sm
- Margin-bottom: `24px`

### Table Header Row

- Background: `rgba(39,39,42,0.02)`
- Border-bottom: `1px solid rgba(39,39,42,0.10)`
- Padding: `10px 20px`
- Font: `Inter`, `11px`, weight `600`, color `#71717A`, `letter-spacing: 0.05em`, `text-transform: uppercase`

### Column Layout

| Column | Width | Notes |
|--------|-------|-------|
| SPOT | `flex: 0 0 110px` | Slot/role name |
| DATE & TIME | `flex: 0 0 120px` | Multi-line date + time range |
| NAME | `flex: 0 0 160px` | Volunteer name |
| EMAIL | `flex: 1; min-width: 0; overflow: hidden` | Truncates if long |
| COMMENT | `flex: 0 0 160px` | Volunteer's comment |
| SIGNUP TIMESTAMP | `flex: 0 0 120px` | When they signed up |
| (delete) | `width: 40px` | Trash icon button |

### Table Row Styles

- Display: flex, align-items: flex-start, gap `16px`, padding `14px 20px`
- Border-bottom: `1px solid rgba(39,39,42,0.10)` (last row: none)
- Background default: `#FFFFFF`
- Background hover: `rgba(39,39,42,0.015)`
- Transition: `background 0.1s`

**Cell text:**
- Font: `Inter`, `13px`, color `#27272A`, line-height `1.45`
- Null/empty values: display `—` in color `#71717A`
- DATE & TIME and SIGNUP TIMESTAMP: `white-space: pre-line` (multi-line)
- EMAIL: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`

### "by organizer" Badge

Shown on rows added by the organizer (not self-signup).

- Background: `rgba(39,39,42,0.07)`
- Color: `#71717A`
- Border-radius: `6px`
- Padding: `2px 7px`
- Font: `11px`, weight `500`
- Label: **`by organizer`** — exact wording
- Displayed below the timestamp in the SIGNUP TIMESTAMP cell

### Delete Button (per row)

- Size: `32×32px`
- Border-radius: `8px`
- Border: `1px solid rgba(39,39,42,0.15)`
- Background: `transparent`
- Icon color: `#71717A`
- Icon: trash/delete (Lucide `Trash2`, `14×14px`)
- Hover: color `#F87171`, border `1px solid rgba(248,113,113,0.3)`, background `rgba(248,113,113,0.05)`
- On click: removes the signup row (with confirmation if needed)

---

## Notifications Bar

Below the table.

- Layout: flex row, gap `10px`, align-center
- Label: **`"Notifications for this event:"`** — `Inter`, `14px`, weight `500`, color `#27272A`
- Dropdown select:
  - Border-radius: `10px`
  - Border: `1px solid rgba(39,39,42,0.20)`
  - Padding: `8px 28px 8px 12px` (right padding for custom chevron)
  - Font: `Inter`, `13px`, color `#27272A`
  - Background: `#FFFFFF`
  - Min-height: `36px`
  - Custom chevron via background-image SVG
  - Focus: border `#6CBF6C`, box-shadow `0 0 0 3px rgba(108,191,108,0.2)`
  - Options: **`Daily digest`**, **`Instant`**, **`None`**

---

## Responsive (Mobile < 768px)

- Page padding: `20px 16px 40px`
- Page header top: stacks vertically (title/date above, buttons below)
- Action buttons: flex row, wrap
- Table: horizontal scroll (`overflow-x: auto`), min-width `700px` on head + rows

---

## Files in This Package

| File | Purpose |
|------|---------|
| `view-signups.html` | Live interactive prototype — open in browser as visual reference |
| `README-view-signups.md` | This spec |
