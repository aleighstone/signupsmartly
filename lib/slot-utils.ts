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

/** Lower sort_order sorts first; nulls sort after explicit values. */
function sortOrderRank(slot: SlotWithSignups): number {
  return slot.sort_order ?? Number.MAX_SAFE_INTEGER;
}

function createdAtMs(slot: SlotWithSignups): number {
  const t = new Date(slot.created_at).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Public volunteer page ordering (applied before SlotList).
 * Simple: sort_order, then created_at.
 * Scheduled: start_time, then sort_order within same start, then role_name, then created_at for legacy rows.
 */
export function sortSlotsForVolunteerDisplay(
  slots: SlotWithSignups[],
  signupType: 'scheduled' | 'simple' | 'availability'
): SlotWithSignups[] {
  const copy = [...slots];
  if (signupType === 'simple') {
    copy.sort((a, b) => {
      const byOrder = sortOrderRank(a) - sortOrderRank(b);
      if (byOrder !== 0) return byOrder;
      return createdAtMs(a) - createdAtMs(b);
    });
    return copy;
  }
  copy.sort((a, b) => {
    const byStart = startTimeSortMs(a) - startTimeSortMs(b);
    if (byStart !== 0) return byStart;
    const byOrder = sortOrderRank(a) - sortOrderRank(b);
    if (byOrder !== 0) return byOrder;
    const nameCmp = a.role_name.localeCompare(b.role_name, undefined, {
      sensitivity: 'base',
    });
    if (nameCmp !== 0) return nameCmp;
    return createdAtMs(a) - createdAtMs(b);
  });
  return copy;
}
