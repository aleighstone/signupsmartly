# Signup Page Visual Hierarchy — Spec

## Goal

Improve scannability of slot cards on the public signup page by promoting the most relevant piece of information:

- **Multi-date events** → **date is the hero** (what day is this?)
- **Single-date events** → **time is the hero** (what time do I need to show up?)

---

## Definitions

### Single-date event
`scheduledSlotsShareSingleCalendarDay(slots, eventFallback)` returns `true`.
This already exists in `lib/calendar.ts` and is already used (as `omitRedundantSlotDate`) to suppress redundant dates in slot cards when the event header already shows the date.

**Do not reimplement this logic.** Reuse the existing boolean.

### Multi-date event
`scheduledSlotsShareSingleCalendarDay(...)` returns `false` — slots span more than one calendar day.

### Simple (undated) signups
`signupType === 'simple'` with no dates. These are **not** affected by this spec — no date/time hierarchy change needed.

---

## Visual Change — SlotCard (`components/SlotList.tsx`)

### Current rendering (scheduled slots)
```tsx
<h3 className="text-base font-semibold text-charcoal font-heading">
  {whenScheduled}  {/* e.g. "May 16, 2026 · 9:00 AM – 10:30 AM" */}
</h3>
<h4 className="mt-1 text-sm font-medium text-charcoal font-body">
  {slot.role_name}
</h4>
```

Everything is crammed into one line with equal visual weight. The date and time are inseparable.

---

### New rendering — Multi-date event

The **date** is the primary visual anchor. Time is secondary.

```tsx
// isSingleDay = false
<div>
  <h3 className="text-lg font-semibold text-charcoal font-heading leading-tight">
    {dateLine}        {/* e.g. "May 16, 2026" */}
  </h3>
  {timeLine && (
    <p className="text-sm text-muted font-body mt-0.5">
      {timeLine}      {/* e.g. "9:00 AM – 10:30 AM" */}
    </p>
  )}
  <p className="mt-1 text-sm font-medium text-charcoal font-body">
    {slot.role_name}
  </p>
</div>
```

---

### New rendering — Single-date event

The **time** is the primary visual anchor. The date is secondary (smaller, above).

```tsx
// isSingleDay = true
<div>
  {dateLine && (
    <p className="text-sm text-muted font-body">
      {dateLine}      {/* e.g. "Sat, May 16, 2026" — short day name prefix */}
    </p>
  )}
  <h3 className="text-lg font-semibold text-charcoal font-heading leading-tight">
    {timeLine}        {/* e.g. "9:00 AM – 10:30 AM" */}
  </h3>
  <p className="mt-1 text-sm font-medium text-charcoal font-body">
    {slot.role_name}
  </p>
</div>
```

If a slot has **no time** (time-less slot on a single-date event), fall back to the current rendering — date as h3, no hierarchy switch.

---

## Implementation

### 1. Pass `isSingleDay` into SlotCard

`SlotList` already computes `omitRedundantSlotDate` using `scheduledSlotsShareSingleCalendarDay`. Rename or add a companion boolean `isSingleDay` and pass it to `SlotCard`.

```ts
const isSingleDay =
  !isSimple &&
  scheduledSlotsShareSingleCalendarDay(slots, eventDateFallback ?? null);
```

### 2. Split date and time in SlotCard

Currently `formatScheduledSlotWhen` returns a single combined string like `"May 16, 2026 · 9:00 AM – 10:30 AM"`. We need the date and time **separately** to render them with different visual weights.

Add a new export to `lib/calendar.ts`:

```ts
/**
 * Returns the date portion and time portion of a scheduled slot separately,
 * for use in visual hierarchy rendering.
 */
export function formatScheduledSlotParts(
  startTime: string | null,
  endTime: string | null,
  eventFallback?: ScheduledSlotEventDateFallback | null
): { dateLine: string; timeLine: string } {
  const timeLine = volunteerSlotTimePart(startTime, endTime);

  if (!startTime) {
    const dateLine = eventFallback?.startDate
      ? formatEventDateRange(eventFallback.startDate, eventFallback.endDate) ?? ''
      : '';
    return { dateLine, timeLine };
  }

  const startDate = formatSlotDateUTC(startTime);
  const endDate = endTime ? formatSlotDateUTC(endTime) : null;
  const dateLine =
    endDate && endDate !== startDate
      ? `${startDate} – ${endDate}`
      : startDate;

  return { dateLine, timeLine };
}
```

### 3. For single-date events, add short day-of-week prefix to dateLine

When `isSingleDay` is true and a dateLine exists, prefix it with the short weekday name so the secondary date line reads naturally:

```ts
// e.g. "May 16, 2026" → "Sat, May 16, 2026"
```

Use `Intl.DateTimeFormat` with `timeZone: 'UTC'` to extract the weekday — consistent with the existing date display rules. Add a small helper in `lib/calendar.ts`:

```ts
export function prefixWeekday(dateIso: string): string {
  const d = new Date(dateIso);
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(d);
  return `${weekday}, ${formatSlotDateUTC(dateIso)}`;
}
```

Call this only when `isSingleDay === true` and the slot has a concrete `start_time`.

### 4. Update the filled slots section

Apply the same hierarchy logic to the filled slots rendering in `SlotList` (the bottom section). Same `isSingleDay` boolean, same split rendering.

---

## What does NOT change

- `formatScheduledSlotWhen` — keep it intact, it's used elsewhere (organizer views, etc.)
- Simple list slots — no change
- `omitRedundantSlotDate` behaviour — still suppresses the date in single-day events when needed (the new split rendering handles this naturally: if `isSingleDay` and we're in the time-hero layout, the date line is already visually de-emphasised)
- Any email templates
- The `EventHeader` component

---

## Design System Constraints

Use only these classes — no new values:

| Element | Class |
|---|---|
| Hero heading (date or time) | `text-lg font-semibold text-charcoal font-heading leading-tight` |
| Secondary line (date or time) | `text-sm text-muted font-body mt-0.5` |
| Role name | `text-sm font-medium text-charcoal font-body mt-1` (unchanged) |
| Spots remaining | `text-sm text-charcoal font-body mt-1` (unchanged) |

Colors: `text-charcoal` for primary, `text-muted` for secondary. No new colors.

---

## Files to Change

| File | Change |
|---|---|
| `lib/calendar.ts` | Add `formatScheduledSlotParts()` and `prefixWeekday()` helpers |
| `components/SlotList.tsx` | Pass `isSingleDay` to `SlotCard`; split rendering by `isSingleDay` in both open and filled sections |

---

## Playwright Tests

Add to `e2e/volunteer.smoke.ts`:

```ts
test.describe('Slot card visual hierarchy', () => {
  test('single-date event: time is the h3 heading in slot cards', async ({ page }) => {
    const eventId = process.env.E2E_TEST_EVENT_ID;
    if (!eventId) {
      test.skip(true, 'E2E_TEST_EVENT_ID not set');
      return;
    }
    await page.goto(`/event/${eventId}`);
    // The h3 in the first open slot card should contain a time pattern (e.g. "9:00 AM")
    const firstCard = page.locator('ul').first().locator('li').first();
    const h3 = firstCard.locator('h3');
    await expect(h3).toBeVisible();
    await expect(h3).toHaveText(/\d+:\d+\s*(AM|PM)/i);
  });

  test('multi-date event: date is the h3 heading in slot cards', async ({ page }) => {
    const multiDateEventId = process.env.E2E_TEST_MULTI_DATE_EVENT_ID;
    if (!multiDateEventId) {
      test.skip(true, 'E2E_TEST_MULTI_DATE_EVENT_ID not set — skipping multi-date hierarchy test');
      return;
    }
    await page.goto(`/event/${multiDateEventId}`);
    const firstCard = page.locator('ul').first().locator('li').first();
    const h3 = firstCard.locator('h3');
    await expect(h3).toBeVisible();
    // h3 should contain a month name (date), not a time
    await expect(h3).toHaveText(/January|February|March|April|May|June|July|August|September|October|November|December/i);
  });
});
```

Add `E2E_TEST_MULTI_DATE_EVENT_ID` to `.env.local` — set it to the UUID of any event whose slots span multiple calendar days (e.g. the Mustangs Baseball snack duty event).

---

## QA Scenarios

1. Multi-date event: slot card shows date as large heading, time below in muted smaller text
2. Single-date event: slot card shows time as large heading, date above in muted smaller text with short day name (e.g. "Sat, May 16, 2026")
3. Single-date event with no time on a slot: falls back to date as heading (no blank h3)
4. Simple list event: no change — role name is still the heading
5. Filled slots section matches the same hierarchy as open slots
6. Themed events (custom colors/fonts) still apply theme styles correctly on both layouts
