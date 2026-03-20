# Spec: Signups Page — Copy Link, Export CSV, Print

## Overview

Update `SignupsActions.tsx` to add two new actions alongside the existing Export CSV button:
1. **Copy Signup URL** — opens a small modal with the public signup link so the organizer can copy it
2. **Print** — triggers a print-friendly view of the full signup table

Button order (top to bottom in the existing flex-col layout):
1. Copy Signup URL
2. Export CSV *(existing — no changes)*
3. Print

---

## Files to modify

- `app/dashboard/event/[id]/signups/SignupsActions.tsx` — add two new buttons + Copy Link modal
- `app/dashboard/event/[id]/signups/page.tsx` — pass `eventId` prop to `SignupsActions`

---

## 1. Pass `eventId` to `SignupsActions`

In `page.tsx`, update the `SignupsActions` call on line 155:

```tsx
// BEFORE
<SignupsActions event={eventData} rows={csvRows} isSimple={isSimple} />

// AFTER
<SignupsActions event={eventData} rows={csvRows} isSimple={isSimple} eventId={id} />
```

---

## 2. Update `SignupsActions.tsx`

### New props

Add `eventId: string` to the `SignupsActionsProps` interface.

### Copy Signup URL modal

The public signup URL is: `` `${window.location.origin}/event/${eventId}` ``

Add a `useState<boolean>` called `showCopyModal` to control visibility.

When the **Copy Signup URL** button is clicked, set `showCopyModal(true)`.

The modal should:
- Render as a fixed full-screen overlay (`fixed inset-0 z-50 flex items-center justify-center`)
- Backdrop: `bg-black/40` with a click handler to close the modal
- Inner card: `bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4` — stop click propagation so clicks inside don't close it
- Title: `"Copy Signup Link"` in `font-heading font-semibold text-charcoal text-lg`
- Subtitle: `"Share this link with your volunteers."` in `text-muted text-sm font-body mt-1`
- URL display box: `mt-4 flex items-center gap-2`
  - A read-only text input showing the URL: `flex-1 rounded-xl border border-charcoal/20 px-3 py-2 text-sm font-body text-charcoal bg-surface select-all` with `readOnly` and `onFocus={(e) => e.target.select()}`
  - A **Copy** button next to it: `rounded-xl bg-sage text-white px-4 py-2 text-sm font-medium font-body hover:bg-sage/90 transition-colors`
  - On copy click: use `navigator.clipboard.writeText(url)` and change button label to `"Copied!"` for 2 seconds, then reset to `"Copy"`. Use a `useState<boolean>` called `copied` for this. Track with PostHog: `posthog.capture('signup_link_copied', { event_id: eventId })`
- Close button: an `✕` text button in the top-right of the modal card (`absolute top-4 right-4 text-muted hover:text-charcoal text-xl leading-none`)
- The modal card should use `relative` positioning to anchor the close button

### Print button

The **Print** button simply calls `window.print()` on click.

Track with PostHog: `posthog.capture('signups_printed', { event_id: eventId, total_signups: rows.length })`

### Button styles

All three buttons should use the same style as the existing Export CSV button:
```
rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body
```

---

## 3. Print styles

Add a `<style>` block inside the `SignupsActions` component (or in `globals.css`) with print media query:

```css
@media print {
  /* Hide everything except the main content */
  header,
  nav,
  [data-no-print],
  .nps-btn {
    display: none !important;
  }

  /* Remove background colors and shadows for ink savings */
  * {
    box-shadow: none !important;
    background-color: transparent !important;
  }

  /* Make sure the table prints cleanly */
  body {
    font-size: 12pt;
  }

  /* Avoid page breaks inside table rows */
  tr {
    page-break-inside: avoid;
  }
}
```

Add `data-no-print` attribute to:
- The `SignupsActions` buttons container div
- The `EventNotificationOverride` section in `page.tsx` (wrap it: `<div data-no-print>...</div>`)
- The Back link in `page.tsx` (wrap it: `<div data-no-print>...</div>`)

The event title, date, coverage bar, and full signup table should all remain visible when printing.

---

## PostHog events summary

| Event | Properties |
|---|---|
| `signup_link_copied` | `event_id` |
| `signups_printed` | `event_id`, `total_signups` |

---

## Notes

- No new API routes needed — everything is client-side
- The Copy modal does not need to persist state between renders
- `window.location.origin` is safe to use here since `SignupsActions` is a client component (`'use client'`)
- Do not change the existing CSV export logic
