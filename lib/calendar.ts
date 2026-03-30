import { format } from 'date-fns';
import type { Event, Slot } from '@/types/database';

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
  const start = new Date(startDate);
  if (!endDate) {
    return format(start, 'EEEE, MMMM d, yyyy');
  }
  const end = new Date(endDate);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return format(start, 'EEEE, MMMM d, yyyy');
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
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

/**
 * Full volunteer-facing line: date + time range for scheduled slots.
 * If the slot spans two UTC calendar days, both dates are shown.
 */
export function formatScheduledSlotWhen(
  startTime: string | null,
  endTime: string | null
): string {
  const timePart = formatTimeRange(startTime, endTime);
  if (!startTime) return timePart;
  const startDate = formatSlotDateUTC(startTime);
  const endDate = endTime ? formatSlotDateUTC(endTime) : null;
  if (endDate && endDate !== startDate) {
    return `${startDate} – ${endDate} · ${timePart}`;
  }
  return `${startDate} · ${timePart}`;
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
