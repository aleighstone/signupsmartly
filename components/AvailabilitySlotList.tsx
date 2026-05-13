'use client';

import { useMemo, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import type { SlotWithSignups } from '@/types/database';
import { formatTimeRange } from '@/lib/calendar';
import { sortSlotsForVolunteerDisplay } from '@/lib/slot-utils';
import { MarkdownBody } from '@/components/MarkdownBody';

interface AvailabilitySlotListProps {
  slots: SlotWithSignups[];
  selectedSlotIds: string[];
  onSelectionChange: (slotIds: string[]) => void;
  onSubmit: () => void;
  showSignups: boolean;
  onOpenSignups: (slot: SlotWithSignups) => void;
  volunteerPageThemed?: boolean;
}

function slotTimeLine(slot: SlotWithSignups): string | null {
  if (!slot.start_time) return null;

  // Date-only availability options are stored at midnight so they can sort and
  // round-trip through the shared slots table. Do not display that sentinel as a time.
  const start = new Date(slot.start_time);
  const isDateOnlyMidnight =
    !slot.end_time &&
    !Number.isNaN(start.getTime()) &&
    start.getUTCHours() === 0 &&
    start.getUTCMinutes() === 0 &&
    start.getUTCSeconds() === 0;

  if (isDateOnlyMidnight) return null;
  return formatTimeRange(slot.start_time, slot.end_time);
}

export function AvailabilitySlotList({
  slots,
  selectedSlotIds,
  onSelectionChange,
  onSubmit,
  showSignups,
  onOpenSignups,
  volunteerPageThemed,
}: AvailabilitySlotListProps) {
  const [touched, setTouched] = useState(false);
  const selected = useMemo(() => new Set(selectedSlotIds), [selectedSlotIds]);
  const orderedSlots = useMemo(
    () => sortSlotsForVolunteerDisplay(slots, 'availability'),
    [slots]
  );
  const primaryStyle = volunteerPageThemed
    ? { color: 'var(--theme-primary)' }
    : undefined;
  const buttonStyle = volunteerPageThemed
    ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-btn-text)' }
    : undefined;

  const toggleSlot = (slotId: string) => {
    setTouched(true);
    const next = new Set(selected);
    if (next.has(slotId)) next.delete(slotId);
    else next.add(slotId);
    onSelectionChange(Array.from(next));
  };

  return (
    <section className="space-y-5">
      <h2
        className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-charcoal/50 font-body"
        style={volunteerPageThemed ? { fontFamily: 'var(--theme-font)' } : undefined}
      >
        <CheckSquare
          size={16}
          strokeWidth={2.5}
          className={volunteerPageThemed ? '' : 'text-sage'}
          style={primaryStyle}
          aria-hidden
        />
        Which dates work for you?
      </h2>
      <div className="space-y-4">
        {orderedSlots.map((slot) => {
          const checked = selected.has(slot.id);
          const count = slot.signups.length;
          const peopleText = count === 1 ? '1 person available' : `${count} people available`;
          const details = slot.role_description || slot.instructions || '';
          const timeLine = slotTimeLine(slot);
          return (
            <label
              key={slot.id}
              className={`block cursor-pointer rounded-xl border bg-surface p-5 shadow-soft transition-colors ${
                checked ? 'border-sage/60 ring-2 ring-sage/20' : 'border-charcoal/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSlot(slot.id)}
                  className="mt-1 h-4 w-4 rounded border-charcoal/30 text-sage focus:ring-2 focus:ring-sage/30"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-charcoal font-body">{slot.role_name}</div>
                  {timeLine ? (
                    <p className="mt-1 text-sm text-muted font-body">{timeLine}</p>
                  ) : null}
                  {details ? (
                    <div className="mt-1 text-sm text-muted font-body prose prose-sm max-w-none prose-p:text-muted prose-li:text-muted prose-headings:text-charcoal prose-strong:text-charcoal [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                      <MarkdownBody markdown={details} />
                    </div>
                  ) : null}
                  {showSignups ? (
                    <p className="mt-2 text-sm font-semibold text-sage font-body" style={primaryStyle}>
                      {peopleText}
                      {count > 0 ? (
                        <>
                          {' · '}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              onOpenSignups(slot);
                            }}
                            className={`font-medium underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-sage/30 rounded ${
                              volunteerPageThemed ? '' : 'text-sage hover:text-sage-hover'
                            }`}
                            style={primaryStyle}
                          >
                            See who →
                          </button>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={selectedSlotIds.length === 0}
          className={`rounded-xl px-5 py-3 text-sm font-semibold font-body transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            volunteerPageThemed ? 'focus:ring-charcoal/40' : 'btn-primary'
          }`}
          style={buttonStyle}
        >
          Select dates and submit →
        </button>
      </div>
      {touched && selectedSlotIds.length === 0 ? (
        <p className="text-sm text-muted font-body">Choose at least one date to continue.</p>
      ) : null}
    </section>
  );
}
