import type { SlotWithSignups } from '@/types/database';

/**
 * Before create/edit API payload: chronological order by spot date, start time,
 * then role name. Mutates a copy only. Slots with no start_time sort after
 * timed slots on the same date (`ZZ` sentinel).
 */
export function sortScheduledSlotsForSave<
  T extends { spot_date?: string; start_time?: string; role_name: string },
>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const dateA = a.spot_date ?? '';
    const dateB = b.spot_date ?? '';
    if (dateA !== dateB) return dateA < dateB ? -1 : 1;

    const timeA = a.start_time ?? 'ZZ';
    const timeB = b.start_time ?? 'ZZ';
    if (timeA !== timeB) return timeA < timeB ? -1 : 1;

    return a.role_name.localeCompare(b.role_name);
  });
}

export function getSlotRemainingCapacity(slot: SlotWithSignups): number {
  const filled = slot.signups.length;
  return Math.max(0, slot.capacity - filled);
}

function startTimeSortMs(slot: SlotWithSignups): number {
  if (!slot.start_time) return Number.POSITIVE_INFINITY;
  const t = new Date(slot.start_time).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function endTimeSortMs(slot: SlotWithSignups): number {
  if (!slot.end_time) return Number.POSITIVE_INFINITY;
  const t = new Date(slot.end_time).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * Public volunteer page: scheduled slots by start time, then end time, then role name;
 * simple list slots alphabetically by role name.
 */
export function sortSlotsForVolunteerDisplay(
  slots: SlotWithSignups[],
  signupType: 'scheduled' | 'simple'
): SlotWithSignups[] {
  const copy = [...slots];
  if (signupType === 'simple') {
    copy.sort((a, b) =>
      a.role_name.localeCompare(b.role_name, undefined, { sensitivity: 'base' })
    );
    return copy;
  }
  copy.sort((a, b) => {
    const byStart = startTimeSortMs(a) - startTimeSortMs(b);
    if (byStart !== 0) return byStart;
    const byEnd = endTimeSortMs(a) - endTimeSortMs(b);
    if (byEnd !== 0) return byEnd;
    return a.role_name.localeCompare(b.role_name, undefined, { sensitivity: 'base' });
  });
  return copy;
}
