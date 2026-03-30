import type { SlotWithSignups } from '@/types/database';

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
