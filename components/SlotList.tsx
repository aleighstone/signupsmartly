'use client';

import { useState } from 'react';
import { formatTimeRange } from '@/lib/calendar';
import type { SlotWithSignups } from '@/types/database';
import { getSlotRemainingCapacity } from '@/lib/slot-utils';

interface SlotListProps {
  slots: SlotWithSignups[];
  onSignUp: (slot: SlotWithSignups) => void;
}

function SlotCard({
  slot,
  remaining,
  onSignUp,
}: {
  slot: SlotWithSignups;
  remaining: number;
  onSignUp: () => void;
}) {
  const timeRange = formatTimeRange(slot.start_time, slot.end_time);
  const spotsText =
    remaining === 1 ? '1 spot remaining' : `${remaining} spots remaining`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-neutral-900">{slot.role_name}</h3>
        <p className="text-sm text-neutral-500">{timeRange}</p>
        <p className="mt-1 text-sm text-neutral-600">{spotsText}</p>
        {slot.instructions && (
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
            {slot.instructions}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onSignUp}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 min-h-[44px]"
      >
        Sign up
      </button>
    </div>
  );
}

export function SlotList({ slots, onSignUp }: SlotListProps) {
  const [filledExpanded, setFilledExpanded] = useState(false);

  const openSlots = slots.filter((s) => getSlotRemainingCapacity(s) > 0);
  const filledSlots = slots.filter((s) => getSlotRemainingCapacity(s) === 0);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <span aria-hidden>⚡</span>
          Still Needed
        </h2>
        {openSlots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 py-8 text-center text-neutral-500">
            All roles are filled. Thank you!
          </p>
        ) : (
          <ul className="space-y-3">
            {openSlots.map((slot) => (
              <li key={slot.id}>
                <SlotCard
                  slot={slot}
                  remaining={getSlotRemainingCapacity(slot)}
                  onSignUp={() => onSignUp(slot)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {filledSlots.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setFilledExpanded(!filledExpanded)}
            className="mb-4 flex w-full items-center justify-between gap-2 text-left text-lg font-semibold text-neutral-700 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 rounded-lg py-1"
            aria-expanded={filledExpanded}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>✔</span>
              Filled Roles
            </span>
            <span
              className={`shrink-0 text-neutral-400 transition-transform ${
                filledExpanded ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>
          {filledExpanded && (
            <ul className="space-y-3">
              {filledSlots.map((slot) => {
                const timeRange = formatTimeRange(
                  slot.start_time,
                  slot.end_time
                );
                const names = slot.signups
                  .map((s) => s.name)
                  .join(', ');
                return (
                  <li
                    key={slot.id}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3"
                  >
                    <p className="font-medium text-neutral-800">
                      {slot.role_name}
                    </p>
                    <p className="text-sm text-neutral-500">{timeRange}</p>
                    <p className="mt-1 text-sm text-neutral-600">{names}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
