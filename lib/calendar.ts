import { format } from 'date-fns';
import type { Event, Slot } from '@/types/database';

export function generateAddToCalendarUrl(params: {
  event: Event;
  slot: Slot;
  volunteerName: string;
}) {
  const { event, slot, volunteerName } = params;

  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);

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

export function formatEventDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameDay =
    start.toDateString() === end.toDateString();

  if (sameDay) {
    return format(start, 'EEEE, MMMM d, yyyy');
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${format(new Date(startTime), 'h:mm a')} – ${format(new Date(endTime), 'h:mm a')}`;
}
