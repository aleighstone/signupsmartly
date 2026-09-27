/** Shared slot-label helpers used by both server actions and client components. */

export function formatAvailabilityDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatAvailabilityTimeLabel(timeStr: string): string {
  const [hourRaw, minuteRaw] = timeStr.split(':').map(Number);
  if (Number.isNaN(hourRaw) || Number.isNaN(minuteRaw)) return timeStr;
  const suffix = hourRaw >= 12 ? 'PM' : 'AM';
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minuteRaw).padStart(2, '0')} ${suffix}`;
}

export function buildAvailabilitySlotLabel(slot: {
  spot_date: string;
  start_time?: string;
  end_time?: string;
}): string {
  const dateLabel = formatAvailabilityDateLabel(slot.spot_date);
  const start = slot.start_time?.trim();
  const end = slot.end_time?.trim();
  if (start && end)
    return `${dateLabel}, ${formatAvailabilityTimeLabel(start)} - ${formatAvailabilityTimeLabel(end)}`;
  if (start) return `${dateLabel}, ${formatAvailabilityTimeLabel(start)}`;
  return dateLabel;
}
