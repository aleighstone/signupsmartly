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
  if (!startDate) return 'No date';
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
 * Format a time range in a specific timezone for consistent display across server and client.
 * Slot times are stored as UTC; we format in the organization's timezone so volunteers
 * see the same times the organizer intended.
 */
export function formatTimeRangeInTimezone(
  startTime: string | null,
  endTime: string | null,
  timezone: string
): string {
  if (!startTime || !endTime) {
    return 'All day';
  }
  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  };
  const startStr = new Intl.DateTimeFormat('en-US', opts).format(new Date(startTime));
  const endStr = new Intl.DateTimeFormat('en-US', opts).format(new Date(endTime));
  return `${startStr} – ${endStr}`;
}

/**
 * Format time range. Pass timezone for consistent display across server/client.
 * Uses organization timezone so volunteers see the times the organizer intended.
 */
export function formatTimeRange(
  startTime: string | null,
  endTime: string | null,
  timezone: string = 'America/New_York'
): string {
  return formatTimeRangeInTimezone(startTime, endTime, timezone);
}
