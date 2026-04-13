import type { Event, Slot } from '@/types/database';

// ---------------------------------------------------------------------------
// Calendar date helpers — NO timezone conversion for YYYY-MM-DD display
// ---------------------------------------------------------------------------
// Rule: organizer-entered dates display exactly as stored. We never pass a
// YYYY-MM-DD string to `new Date()` because that creates a UTC midnight
// timestamp that shifts to the prior day in US timezones. Instead we parse
// the string as plain numbers and build the display string directly.

const MONTHS_LONG = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
const WEEKDAYS = [
  'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday',
];

/**
 * Parse a date string into numeric parts. Handles both:
 *   "YYYY-MM-DD"                   (plain date)
 *   "YYYY-MM-DDTHH:MM:SS+00:00"   (timestamptz as returned by Supabase)
 * In both cases the UTC calendar date encoded in the first 10 characters
 * is the organizer-intended date — no timezone conversion needed.
 */
function parseYMD(ymd: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim());
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Weekday name for a calendar date. Uses new Date(y, m-1, d) — local midnight,
 *  only for day-of-week arithmetic, never for display. */
function weekdayName(y: number, m: number, d: number): string {
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export function generateAddToCalendarUrl(params: {
  event: Event;
  slot: Slot;
  volunteerName: string;
}) {
  const { event, slot, volunteerName } = params;

  // Use slot times if present, else event date range
  const eventStart = event.start_date ?? new Date().toISOString();
  const start = slot.start_time
    ? new Date(slot.start_time)
    : new Date(eventStart);
  const end = slot.end_time
    ? new Date(slot.end_time)
    : event.end_date
      ? new Date(event.end_date)
      : new Date(new Date(eventStart).setHours(23, 59, 59, 999));

  const formatForGoogle = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const title = encodeURIComponent(
    `${slot.role_name} - ${event.title} (${volunteerName})`
  );
  const details = encodeURIComponent(
    `${slot.role_name}\n\nEvent: ${event.title}\nLocation: ${event.location || 'TBD'}\n\n${event.description || ''}`
  );
  const location = encodeURIComponent(event.location || '');
  const startStr = formatForGoogle(start);
  const endStr = formatForGoogle(end);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

export function formatEventDateRange(
  startDate: string | null,
  endDate: string | null
): string {
  // For events (especially simple lists) without a date, show nothing
  if (!startDate) return '';

  const start = parseYMD(startDate);
  if (!start) return '';

  const singleDate = `${weekdayName(start.y, start.m, start.d)}, ${MONTHS_LONG[start.m - 1]} ${start.d}, ${start.y}`;

  if (!endDate) return singleDate;

  const end = parseYMD(endDate);
  if (!end) return singleDate;

  // Same calendar day — show once
  if (start.y === end.y && start.m === end.m && start.d === end.d) return singleDate;

  return `${MONTHS_SHORT[start.m - 1]} ${start.d} – ${MONTHS_SHORT[end.m - 1]} ${end.d}, ${end.y}`;
}

/**
 * Format a time range. Slot times are stored as literal values (no timezone conversion):
 * organizer enters 7:30, we store and display 7:30. Always use 'UTC' so display matches
 * storage exactly. When endTime is null, shows only start time (no range).
 */
export function formatTimeRangeInTimezone(
  startTime: string | null,
  endTime: string | null,
  timezone: string
): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  };
  if (!startTime) return 'All day';
  const startStr = new Intl.DateTimeFormat('en-US', opts).format(new Date(startTime));
  if (!endTime) return startStr;
  const endStr = new Intl.DateTimeFormat('en-US', opts).format(new Date(endTime));
  return `${startStr} – ${endStr}`;
}

/**
 * Format slot time range. Uses UTC so display matches storage — no timezone conversion.
 * Organizers enter times; volunteers see the same times.
 */
export function formatTimeRange(
  startTime: string | null,
  endTime: string | null
): string {
  return formatTimeRangeInTimezone(startTime, endTime, 'UTC');
}

/** Calendar date from slot timestamps, UTC — matches how we show times (no local TZ shift). */
export function formatSlotDateUTC(isoString: string | null): string {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(isoString));
}

/** When a scheduled slot has no stored start_time, fall back to event-level dates (matches Event header). */
export type ScheduledSlotEventDateFallback = {
  startDate: string | null;
  endDate: string | null;
};

function ymdKeyUtcFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function ymdKeyFromCalendarFields(y: number, m: number, day: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

type SlotDayConstraint =
  | { kind: 'day'; key: string }
  | { kind: 'none' }
  | { kind: 'blocked' };

function slotDayConstraint(
  startTime: string | null,
  endTime: string | null,
  eventFallback: ScheduledSlotEventDateFallback | null
): SlotDayConstraint {
  if (startTime) {
    const k1 = ymdKeyUtcFromIso(startTime);
    if (!k1) return { kind: 'blocked' };
    if (!endTime) return { kind: 'day', key: k1 };
    const k2 = ymdKeyUtcFromIso(endTime);
    if (!k2) return { kind: 'blocked' };
    if (k1 !== k2) return { kind: 'blocked' };
    return { kind: 'day', key: k1 };
  }
  if (!eventFallback?.startDate) return { kind: 'none' };
  const start = parseYMD(eventFallback.startDate);
  if (!start) return { kind: 'blocked' };
  const key = ymdKeyFromCalendarFields(start.y, start.m, start.d);
  if (!eventFallback.endDate) return { kind: 'day', key };
  const end = parseYMD(eventFallback.endDate);
  if (!end) return { kind: 'day', key };
  if (start.y === end.y && start.m === end.m && start.d === end.d) {
    return { kind: 'day', key };
  }
  return { kind: 'blocked' };
}

/**
 * True when every slot is on the same calendar day (UTC for timed slots;
 * event fallback for undated slots). Public page uses this to show the date only in the header.
 */
export function scheduledSlotsShareSingleCalendarDay(
  slots: { start_time: string | null; end_time: string | null }[],
  eventFallback: ScheduledSlotEventDateFallback | null
): boolean {
  if (slots.length === 0) return false;
  let agreedKey: string | null = null;
  let seenConcreteDay = false;
  for (const slot of slots) {
    const r = slotDayConstraint(slot.start_time, slot.end_time, eventFallback);
    if (r.kind === 'blocked') return false;
    if (r.kind === 'none') continue;
    seenConcreteDay = true;
    if (agreedKey === null) agreedKey = r.key;
    else if (agreedKey !== r.key) return false;
  }
  return seenConcreteDay && agreedKey !== null;
}

export type FormatScheduledSlotWhenOptions = {
  /** When all slots share one day, omit the date (event header shows it). */
  omitRedundantDate?: boolean;
};

function isUtcMidnight(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

/** Time suffix for volunteer UI: no "All day"; date-only slots (UTC midnight, no end) omit time. */
function volunteerSlotTimePart(
  startTime: string | null,
  endTime: string | null
): string {
  if (!startTime && !endTime) return '';
  if (startTime && !endTime && isUtcMidnight(startTime)) return '';
  const t = formatTimeRange(startTime, endTime);
  if (t === 'All day') return '';
  return t;
}

function joinDateAndVolunteerTime(dateLine: string, timePart: string): string {
  return timePart ? `${dateLine} · ${timePart}` : dateLine;
}

/**
 * Full volunteer-facing line: date + time range for scheduled slots.
 * If the slot spans two UTC calendar days, both dates are shown.
 * If `startTime` is missing, uses `eventFallback` dates when provided so volunteers
 * still see the event window (without a misleading "All day" when no times exist).
 */
export function formatScheduledSlotWhen(
  startTime: string | null,
  endTime: string | null,
  eventFallback?: ScheduledSlotEventDateFallback | null,
  options?: FormatScheduledSlotWhenOptions
): string {
  const omitRedundantDate = options?.omitRedundantDate ?? false;
  const timePart = volunteerSlotTimePart(startTime, endTime);
  /** Omit repeating the calendar date in the header only when we have a real time to show. */
  const omitDateBecauseHeader = omitRedundantDate && timePart.length > 0;

  if (!startTime) {
    if (eventFallback?.startDate) {
      const dateLine = formatEventDateRange(
        eventFallback.startDate,
        eventFallback.endDate
      );
      if (dateLine) {
        if (omitDateBecauseHeader) return timePart;
        return joinDateAndVolunteerTime(dateLine, timePart);
      }
    }
    return timePart;
  }
  const startDate = formatSlotDateUTC(startTime);
  const endDate = endTime ? formatSlotDateUTC(endTime) : null;
  if (endDate && endDate !== startDate) {
    return joinDateAndVolunteerTime(`${startDate} – ${endDate}`, timePart);
  }
  if (omitDateBecauseHeader) return timePart;
  return joinDateAndVolunteerTime(startDate, timePart);
}

/**
 * Format signup timestamp for display. No timezone conversion — shows UTC as stored.
 */
export function formatSignupTimestamp(isoString: string): string {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Convert stored slot timestamps into `<input type="date">` / `<input type="time">`
 * values using UTC (same literal semantics as formatTimeRange). Avoids brittle
 * string slicing on ISO variants (single-digit hours, missing `T`, etc.).
 */
export function slotTimestampsToFormFields(
  startTime: string | null,
  endTime: string | null,
  fallbackDateYmd: string | null | undefined
): { spot_date: string; start_time: string; end_time: string } {
  const toYmdHm = (iso: string | null) => {
    if (!iso?.trim()) return { ymd: '', hm: '' };
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { ymd: '', hm: '' };
    const ymd = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
    const hm = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
    return { ymd, hm };
  };

  const s = toYmdHm(startTime);
  const e = toYmdHm(endTime);
  const fb =
    fallbackDateYmd && fallbackDateYmd.length >= 10
      ? fallbackDateYmd.slice(0, 10)
      : '';

  return {
    spot_date: s.ymd || fb,
    start_time: s.hm,
    end_time: e.hm,
  };
}
