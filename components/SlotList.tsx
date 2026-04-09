'use client';

import { usePostHog } from '@posthog/react';
import type { ScheduledSlotEventDateFallback } from '@/lib/calendar';
import {
  formatScheduledSlotWhen,
  scheduledSlotsShareSingleCalendarDay,
} from '@/lib/calendar';
import type { SlotWithSignups } from '@/types/database';
import {
  getSlotRemainingCapacity,
  sortSlotsForVolunteerDisplay,
} from '@/lib/slot-utils';

interface SlotListProps {
  slots: SlotWithSignups[];
  onSignUp: (slot: SlotWithSignups) => void;
  /** When true, show "See who" / "View signups" for multi-capacity slots. */
  showSignups: boolean;
  onOpenSignups: (slot: SlotWithSignups) => void;
  signupType?: 'scheduled' | 'simple';
  /** Scheduled slots with null start_time use these event dates in the primary line. */
  eventDateFallback?: ScheduledSlotEventDateFallback | null;
  primaryColor?: string;
  /** Public event page: buttons, links, and section headings use signup theme CSS variables */
  volunteerPageThemed?: boolean;
}

function SlotCard({
  slot,
  remaining,
  filled,
  capacity,
  onSignUp,
  onSignUpClick,
  onOpenSignups,
  showSignups,
  isSimple,
  eventDateFallback,
  omitRedundantSlotDate,
  primaryColor,
  volunteerPageThemed,
}: {
  slot: SlotWithSignups;
  remaining: number;
  filled: number;
  capacity: number;
  onSignUp: () => void;
  onSignUpClick?: () => void;
  onOpenSignups: (slot: SlotWithSignups) => void;
  showSignups: boolean;
  isSimple: boolean;
  eventDateFallback?: ScheduledSlotEventDateFallback | null;
  omitRedundantSlotDate?: boolean;
  primaryColor?: string;
  volunteerPageThemed?: boolean;
}) {
  const whenScheduled = formatScheduledSlotWhen(
    slot.start_time,
    slot.end_time,
    isSimple ? null : eventDateFallback,
    { omitRedundantDate: omitRedundantSlotDate }
  );
  const unitLabel = isSimple ? 'item' : 'spot';
  const spotsText =
    remaining === 1
      ? `1 ${unitLabel} remaining`
      : `${remaining} ${unitLabel}s remaining`;

  const showSeeWho =
    showSignups && filled > 0 && capacity > 1;

  const buttonStyle = volunteerPageThemed
    ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-btn-text)' }
    : primaryColor
      ? { backgroundColor: primaryColor }
      : undefined;

  const linkColorStyle = volunteerPageThemed ? { color: 'var(--theme-primary)' } : undefined;

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
        <p className="mt-1 text-sm text-charcoal font-body">
          {spotsText}
          {showSeeWho ? (
            <>
              {' · '}
              <span>
                {filled} of {capacity} filled
              </span>
              {' · '}
              <button
                type="button"
                onClick={() => onOpenSignups(slot)}
                className={`font-medium underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-sage/30 rounded ${
                  volunteerPageThemed ? '' : 'text-sage hover:text-sage-hover'
                }`}
                style={linkColorStyle}
              >
                See who →
              </button>
            </>
          ) : null}
        </p>
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
        className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold font-body transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
          volunteerPageThemed ? 'focus:ring-charcoal/40' : 'btn-primary'
        }`}
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
  showSignups,
  onOpenSignups,
  signupType = 'scheduled',
  eventDateFallback = null,
  primaryColor,
  volunteerPageThemed,
}: SlotListProps) {
  const posthog = usePostHog();
  const isSimple = signupType === 'simple';
  const omitRedundantSlotDate =
    !isSimple &&
    scheduledSlotsShareSingleCalendarDay(slots, eventDateFallback ?? null);
  const orderedSlots = sortSlotsForVolunteerDisplay(slots, signupType);
  const openSlots = orderedSlots.filter((s) => getSlotRemainingCapacity(s) > 0);
  const filledSlots = orderedSlots.filter((s) => getSlotRemainingCapacity(s) === 0);
  const filledLabel = isSimple ? 'Filled Items' : 'Filled Roles';
  const allFilledText = isSimple
    ? 'All items are filled. Thank you!'
    : 'All roles are filled. Thank you!';

  const handleOpenSignups = (slot: SlotWithSignups) => {
    if (posthog) {
      posthog.capture('public_signups_modal_opened', {
        signup_type: signupType,
        slot_name: slot.role_name,
      });
    }
    onOpenSignups(slot);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2
          className={`mb-4 flex items-center gap-2 text-lg font-semibold text-charcoal ${volunteerPageThemed ? '' : 'font-heading'}`}
          style={volunteerPageThemed ? { fontFamily: 'var(--theme-font)' } : undefined}
        >
          <span aria-hidden style={volunteerPageThemed ? { color: 'var(--theme-primary)' } : undefined}>
            ⚡
          </span>
          Still Needed
        </h2>
        {openSlots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-charcoal/20 py-8 text-center text-muted font-body">
            {allFilledText}
          </p>
        ) : (
          <ul className="space-y-3">
            {openSlots.map((slot) => {
              const remaining = getSlotRemainingCapacity(slot);
              const filled = slot.signups.length;
              const capacity = slot.capacity;
              return (
                <li key={slot.id}>
                  <SlotCard
                    slot={slot}
                    remaining={remaining}
                    filled={filled}
                    capacity={capacity}
                    onSignUp={() => onSignUp(slot)}
                    onOpenSignups={handleOpenSignups}
                    showSignups={showSignups}
                    onSignUpClick={() => {
                      if (posthog) {
                        posthog.capture('signup_modal_opened', {
                          signup_type: signupType,
                          slot_name: slot.role_name,
                        });
                      }
                    }}
                    isSimple={isSimple}
                    eventDateFallback={eventDateFallback}
                    omitRedundantSlotDate={omitRedundantSlotDate}
                    primaryColor={primaryColor}
                    volunteerPageThemed={volunteerPageThemed}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {filledSlots.length > 0 && (
        <section>
          <h2
            className={`mb-4 flex items-center gap-2 text-lg font-semibold text-charcoal ${volunteerPageThemed ? '' : 'font-heading'}`}
            style={volunteerPageThemed ? { fontFamily: 'var(--theme-font)' } : undefined}
          >
            <span aria-hidden style={volunteerPageThemed ? { color: 'var(--theme-primary)' } : undefined}>
              ✔
            </span>
            {filledLabel}
          </h2>
          <ul className="space-y-3">
            {filledSlots.map((slot) => {
              const whenScheduled = formatScheduledSlotWhen(
                slot.start_time,
                slot.end_time,
                isSimple ? null : eventDateFallback,
                { omitRedundantDate: omitRedundantSlotDate }
              );
              const names = slot.signups.map((s) => s.name).join(', ');
              const multiCapLink =
                showSignups && slot.capacity > 1;
              const countLabel = isSimple ? 'signed up' : 'volunteers';

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
                  {multiCapLink ? (
                    <button
                      type="button"
                      onClick={() => handleOpenSignups(slot)}
                      className={`mt-1 text-left text-sm font-medium underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-sage/30 rounded font-body ${
                        volunteerPageThemed ? '' : 'text-sage hover:text-sage-hover'
                      }`}
                      style={volunteerPageThemed ? { color: 'var(--theme-primary)' } : undefined}
                    >
                      {slot.signups.length} {countLabel} · View signups →
                    </button>
                  ) : (
                    <p className="mt-1 text-sm text-muted font-body">{names}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
