'use client';

import { usePostHog } from '@posthog/react';
import { formatScheduledSlotWhen } from '@/lib/calendar';
import type { SlotWithSignups } from '@/types/database';
import {
  getSlotRemainingCapacity,
  sortSlotsForVolunteerDisplay,
} from '@/lib/slot-utils';

interface SlotListProps {
  slots: SlotWithSignups[];
  onSignUp: (slot: SlotWithSignups) => void;
  signupType?: 'scheduled' | 'simple';
  primaryColor?: string;
}

function SlotCard({
  slot,
  remaining,
  onSignUp,
  onSignUpClick,
  isSimple,
  primaryColor,
}: {
  slot: SlotWithSignups;
  remaining: number;
  onSignUp: () => void;
  onSignUpClick?: () => void;
  isSimple: boolean;
  primaryColor?: string;
}) {
  const whenScheduled = formatScheduledSlotWhen(slot.start_time, slot.end_time);
  const unitLabel = isSimple ? 'item' : 'spot';
  const spotsText =
    remaining === 1
      ? `1 ${unitLabel} remaining`
      : `${remaining} ${unitLabel}s remaining`;

  const buttonStyle = primaryColor ? { backgroundColor: primaryColor } : undefined;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {isSimple ? (
          <h3 className="font-medium text-charcoal font-body">{slot.role_name}</h3>
        ) : (
          <>
            <h3 className="text-base font-semibold text-charcoal font-heading">
              {whenScheduled}
            </h3>
            <h4 className="mt-1 text-sm font-medium text-charcoal font-body">
              {slot.role_name}
            </h4>
          </>
        )}
        <p className="mt-1 text-sm text-muted font-body">{spotsText}</p>
        {(slot.role_description || slot.instructions) && (
          <p className="mt-1 text-sm text-muted line-clamp-2 font-body">
            {slot.role_description || slot.instructions}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          onSignUpClick?.();
          onSignUp();
        }}
        className="btn-primary shrink-0"
        style={buttonStyle}
      >
        Sign up
      </button>
    </div>
  );
}

export function SlotList({
  slots,
  onSignUp,
  signupType = 'scheduled',
  primaryColor,
}: SlotListProps) {
  const posthog = usePostHog();
  const isSimple = signupType === 'simple';
  const orderedSlots = sortSlotsForVolunteerDisplay(slots, signupType);
  const openSlots = orderedSlots.filter((s) => getSlotRemainingCapacity(s) > 0);
  const filledSlots = orderedSlots.filter((s) => getSlotRemainingCapacity(s) === 0);
  const filledLabel = isSimple ? 'Filled Items' : 'Filled Roles';
  const allFilledText = isSimple
    ? 'All items are filled. Thank you!'
    : 'All roles are filled. Thank you!';

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-charcoal font-heading">
          <span aria-hidden>⚡</span>
          Still Needed
        </h2>
        {openSlots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-charcoal/20 py-8 text-center text-muted font-body">
            {allFilledText}
          </p>
        ) : (
          <ul className="space-y-3">
            {openSlots.map((slot) => (
              <li key={slot.id}>
                <SlotCard
                  slot={slot}
                  remaining={getSlotRemainingCapacity(slot)}
                  onSignUp={() => onSignUp(slot)}
                  onSignUpClick={() => {
                    if (posthog) {
                      posthog.capture('signup_modal_opened', {
                        signup_type: signupType,
                        slot_name: slot.role_name,
                      });
                    }
                  }}
                  isSimple={isSimple}
                  primaryColor={primaryColor}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {filledSlots.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-charcoal font-heading">
            <span aria-hidden>✔</span>
            {filledLabel}
          </h2>
          <ul className="space-y-3">
            {filledSlots.map((slot) => {
              const whenScheduled = formatScheduledSlotWhen(
                slot.start_time,
                slot.end_time
              );
              const names = slot.signups
                .map((s) => s.name)
                .join(', ');
              return (
                <li
                  key={slot.id}
                  className="rounded-xl border border-charcoal/10 bg-surface/60 px-4 py-3 shadow-soft"
                >
                  {isSimple ? (
                    <p className="font-medium text-charcoal font-body">
                      {slot.role_name}
                    </p>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-charcoal font-heading">
                        {whenScheduled}
                      </h3>
                      <h4 className="mt-1 text-sm font-medium text-charcoal font-body">
                        {slot.role_name}
                      </h4>
                    </>
                  )}
                  <p className="mt-1 text-sm text-muted font-body">{names}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
