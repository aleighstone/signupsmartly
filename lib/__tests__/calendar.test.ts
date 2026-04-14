/**
 * Unit tests for lib/calendar.ts
 *
 * These cover the date display logic that drives the public event page,
 * signup confirmation page, and organizer dashboard. Failures here map
 * directly to user-visible bugs — run before every production deploy.
 *
 * Scenarios correspond to specs/date-scenarios-test-plan.md.
 */

import {
  formatEventDateRange,
  formatTimeRange,
  formatSlotDateUTC,
  formatSlotDateMMDDYYYYUTC,
  formatOrganizerSlotDateAndTime,
  formatScheduledSlotWhen,
  scheduledSlotsShareSingleCalendarDay,
  slotTimestampsToFormFields,
} from '../calendar';

// ---------------------------------------------------------------------------
// Shared fixtures — real ISO timestamps matching slot storage conventions.
// Times are stored as literal UTC so 9:00 AM in the form = 9:00 AM UTC.
// ---------------------------------------------------------------------------
const MAY15_9AM   = '2026-05-15T09:00:00.000Z'; // Friday May 15, 2026, 9:00 AM
const MAY15_1030  = '2026-05-15T10:30:00.000Z'; // Friday May 15, 2026, 10:30 AM
const MAY15_MID   = '2026-05-15T00:00:00.000Z'; // Friday May 15, 2026 — date-only slot (UTC midnight)
const APR5_MID    = '2026-04-05T00:00:00.000Z'; // Sunday Apr 5, 2026

// Plain YYYY-MM-DD strings as stored at the event level for simple lists
const DATE_MAY15  = '2026-05-15';
const DATE_APR5   = '2026-04-05';
const DATE_MAY31  = '2026-05-31';
const DATE_JUN1   = '2026-06-01';

// ---------------------------------------------------------------------------
// formatEventDateRange
// Used in EventHeader to show the event-level date (or nothing).
// P5: must return '' for null so the JSX guard {dateRange && ...} works.
// ---------------------------------------------------------------------------
describe('formatEventDateRange', () => {
  test('returns empty string for null start date (P5 — no date row)', () => {
    expect(formatEventDateRange(null, null)).toBe('');
  });

  test('returns empty string for null start date even when end date provided', () => {
    expect(formatEventDateRange(null, DATE_MAY31)).toBe('');
  });

  test('single date — full weekday format (SL2, P4)', () => {
    expect(formatEventDateRange(DATE_MAY15, null)).toBe('Friday, May 15, 2026');
  });

  test('same-day start and end — shows once, not a range', () => {
    expect(formatEventDateRange(DATE_MAY15, DATE_MAY15)).toBe('Friday, May 15, 2026');
  });

  test('multi-day range — short month format (P6, S8)', () => {
    expect(formatEventDateRange(DATE_APR5, DATE_MAY31)).toBe('Apr 5 – May 31, 2026');
  });

  test('accepts full ISO timestamp strings, not just YYYY-MM-DD', () => {
    // Supabase returns timestamptz strings; function must handle both formats
    expect(formatEventDateRange('2026-05-15T00:00:00+00:00', null)).toBe('Friday, May 15, 2026');
  });

  test('June 1 displays as Monday (spot-check weekday correctness)', () => {
    expect(formatEventDateRange(DATE_JUN1, null)).toBe('Monday, June 1, 2026');
  });

  test('year boundary — Dec 31 / Jan 1', () => {
    expect(formatEventDateRange('2026-12-31', '2027-01-01')).toBe('Dec 31 – Jan 1, 2027');
  });
});

// ---------------------------------------------------------------------------
// formatTimeRange
// Used on slot cards on the public event page.
// P1: full range. P2: start only. Null start = 'All day' (not shown to volunteer).
// ---------------------------------------------------------------------------
describe('formatTimeRange', () => {
  test('full time range (P1 — S4)', () => {
    expect(formatTimeRange(MAY15_9AM, MAY15_1030)).toBe('9:00 AM – 10:30 AM');
  });

  test('start time only, no end (P2 — S3)', () => {
    expect(formatTimeRange(MAY15_9AM, null)).toBe('9:00 AM');
  });

  test('null start returns All day', () => {
    // volunteerSlotTimePart suppresses this from volunteer display,
    // but the underlying function should still return 'All day'
    expect(formatTimeRange(null, null)).toBe('All day');
  });

  test('midnight UTC returns 12:00 AM', () => {
    expect(formatTimeRange(MAY15_MID, null)).toBe('12:00 AM');
  });

  test('PM time formats correctly', () => {
    expect(formatTimeRange('2026-05-15T13:30:00.000Z', '2026-05-15T14:45:00.000Z'))
      .toBe('1:30 PM – 2:45 PM');
  });

  test('noon formats as 12:00 PM', () => {
    expect(formatTimeRange('2026-05-15T12:00:00.000Z', null)).toBe('12:00 PM');
  });
});

// ---------------------------------------------------------------------------
// formatSlotDateUTC
// Used in formatScheduledSlotWhen to display the slot's own calendar date.
// P3: date-only slot shows its date, not an event-level fallback.
// ---------------------------------------------------------------------------
describe('formatSlotDateUTC', () => {
  test('returns empty string for null', () => {
    expect(formatSlotDateUTC(null)).toBe('');
  });

  test('formats a UTC midnight slot date correctly (P3)', () => {
    expect(formatSlotDateUTC(MAY15_MID)).toBe('Friday, May 15, 2026');
  });

  test('formats a timed slot to the correct calendar date', () => {
    expect(formatSlotDateUTC(MAY15_9AM)).toBe('Friday, May 15, 2026');
  });

  test('does not shift date across midnight for non-UTC timezones in storage', () => {
    // Times are stored as literal UTC — 9 AM UTC should show May 15, not May 14
    expect(formatSlotDateUTC('2026-05-15T09:00:00.000Z')).toBe('Friday, May 15, 2026');
  });
});

// ---------------------------------------------------------------------------
// formatSlotDateMMDDYYYYUTC
// Used in the organizer signups table and CSV export (X5, X6).
// ---------------------------------------------------------------------------
describe('formatSlotDateMMDDYYYYUTC', () => {
  test('returns empty string for null', () => {
    expect(formatSlotDateMMDDYYYYUTC(null)).toBe('');
  });

  test('formats to MM/DD/YYYY', () => {
    expect(formatSlotDateMMDDYYYYUTC(MAY15_9AM)).toBe('05/15/2026');
  });

  test('pads single-digit month and day', () => {
    expect(formatSlotDateMMDDYYYYUTC(APR5_MID)).toBe('04/05/2026');
  });

  test('returns empty string for invalid ISO string', () => {
    expect(formatSlotDateMMDDYYYYUTC('not-a-date')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// formatOrganizerSlotDateAndTime
// Organizer view: MM/DD/YYYY + time range when both times present (X5, X6).
// ---------------------------------------------------------------------------
describe('formatOrganizerSlotDateAndTime', () => {
  test('returns empty string when startTime is null (simple list slot)', () => {
    expect(formatOrganizerSlotDateAndTime(null, null)).toBe('');
  });

  test('date only when no endTime', () => {
    expect(formatOrganizerSlotDateAndTime(MAY15_MID, null)).toBe('05/15/2026');
  });

  test('date + time range when both present (X5)', () => {
    expect(formatOrganizerSlotDateAndTime(MAY15_9AM, MAY15_1030))
      .toBe('05/15/2026 9:00 AM – 10:30 AM');
  });

  test('date only when start_time is midnight (date-only slot, no lone start time shown)', () => {
    // Per comment in code: no lone start time, no "All day" — just the date
    expect(formatOrganizerSlotDateAndTime(MAY15_MID, null)).toBe('05/15/2026');
  });
});

// ---------------------------------------------------------------------------
// formatScheduledSlotWhen
// The main public-page slot line. Most complex function — drives P1/P2/P3.
// ---------------------------------------------------------------------------
describe('formatScheduledSlotWhen', () => {
  // P1 — full time range slot
  test('date + full time range shows time only when omitRedundantDate and single day', () => {
    const result = formatScheduledSlotWhen(MAY15_9AM, MAY15_1030, null, { omitRedundantDate: true });
    expect(result).toBe('9:00 AM – 10:30 AM');
  });

  test('date + full time range shows date · time when not omitting date', () => {
    const result = formatScheduledSlotWhen(MAY15_9AM, MAY15_1030);
    expect(result).toBe('Friday, May 15, 2026 · 9:00 AM – 10:30 AM');
  });

  // P2 — start time only
  test('date + start time only shows start time when omitRedundantDate', () => {
    const result = formatScheduledSlotWhen(MAY15_9AM, null, null, { omitRedundantDate: true });
    expect(result).toBe('9:00 AM');
  });

  // P3 — date-only slot (UTC midnight, no end time)
  test('date-only slot (UTC midnight, no end) shows just the calendar date', () => {
    // No time part should appear — just the date
    const result = formatScheduledSlotWhen(MAY15_MID, null, null, { omitRedundantDate: true });
    expect(result).toBe('Friday, May 15, 2026');
  });

  test('date-only slot without omitRedundantDate also shows just date', () => {
    const result = formatScheduledSlotWhen(MAY15_MID, null);
    expect(result).toBe('Friday, May 15, 2026');
  });

  // Event fallback — start_time is null (truly undated slot)
  test('null startTime with event fallback shows event date range', () => {
    const result = formatScheduledSlotWhen(null, null, {
      startDate: DATE_MAY15,
      endDate: null,
    });
    expect(result).toBe('Friday, May 15, 2026');
  });

  test('null startTime with no fallback returns empty string', () => {
    expect(formatScheduledSlotWhen(null, null, null)).toBe('');
    expect(formatScheduledSlotWhen(null, null)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// scheduledSlotsShareSingleCalendarDay
// Used by public page to decide whether to show dates in the header vs slot cards.
// ---------------------------------------------------------------------------
describe('scheduledSlotsShareSingleCalendarDay', () => {
  test('empty slots array returns false', () => {
    expect(scheduledSlotsShareSingleCalendarDay([], null)).toBe(false);
  });

  test('all slots on same day returns true (S9 — single date in header)', () => {
    const slots = [
      { start_time: MAY15_9AM, end_time: MAY15_1030 },
      { start_time: MAY15_MID, end_time: null },
    ];
    expect(scheduledSlotsShareSingleCalendarDay(slots, null)).toBe(true);
  });

  test('slots on different days returns false (S8 — date range in header)', () => {
    const slots = [
      { start_time: APR5_MID, end_time: null },
      { start_time: MAY15_MID, end_time: null },
    ];
    expect(scheduledSlotsShareSingleCalendarDay(slots, null)).toBe(false);
  });

  test('single slot returns true', () => {
    expect(scheduledSlotsShareSingleCalendarDay(
      [{ start_time: MAY15_9AM, end_time: null }],
      null
    )).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// slotTimestampsToFormFields
// Converts stored ISO timestamps back into form field values for the edit form.
// Used whenever an organizer opens an existing event to edit it (E1-E6).
// ---------------------------------------------------------------------------
describe('slotTimestampsToFormFields', () => {
  test('full slot with date + start + end time', () => {
    expect(slotTimestampsToFormFields(MAY15_9AM, MAY15_1030, null)).toEqual({
      spot_date: '2026-05-15',
      start_time: '09:00',
      end_time: '10:30',
    });
  });

  test('date-only slot (UTC midnight, no end) — blank time fields for edit UI', () => {
    expect(slotTimestampsToFormFields(MAY15_MID, null, null)).toEqual({
      spot_date: '2026-05-15',
      start_time: '',
      end_time: '',
    });
  });

  test('UTC midnight start with end time still shows 00:00 start', () => {
    expect(slotTimestampsToFormFields(MAY15_MID, MAY15_1030, null)).toEqual({
      spot_date: '2026-05-15',
      start_time: '00:00',
      end_time: '10:30',
    });
  });

  test('null slot uses fallback date', () => {
    expect(slotTimestampsToFormFields(null, null, DATE_MAY15)).toEqual({
      spot_date: '2026-05-15',
      start_time: '',
      end_time: '',
    });
  });

  test('null slot with no fallback returns all empty strings', () => {
    expect(slotTimestampsToFormFields(null, null, null)).toEqual({
      spot_date: '',
      start_time: '',
      end_time: '',
    });
  });

  test('pads single-digit hours and minutes', () => {
    const result = slotTimestampsToFormFields('2026-05-15T07:05:00.000Z', null, null);
    expect(result.start_time).toBe('07:05');
  });
});
