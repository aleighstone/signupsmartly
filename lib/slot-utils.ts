import type { SlotWithSignups } from '@/types/database';

export function getSlotRemainingCapacity(slot: SlotWithSignups): number {
  const filled = slot.signups.length;
  return Math.max(0, slot.capacity - filled);
}
