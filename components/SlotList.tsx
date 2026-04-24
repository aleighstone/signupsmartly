'use client';

import { usePostHog } from '@posthog/react';
import { Zap, Check } from 'lucide-react';
import { useMemo, useRef } from 'react';
import type { ScheduledSlotEventDateFallback } from '@/lib/calendar';
import {
  formatScheduledSlotParts,
  formatScheduledSlotWhen,
  prefixWeekday,
  scheduledSlotsShareSingleCalendarDay,
} from '@/lib/calendar';
import type { SlotWithSignups } from '@/types/database';
import {
  getSlotRemainingCapacity,
  sortSlotsForVolunteerDisplay,
} from '@/lib/slot-utils';
import { MarkdownBody } from '@/components/MarkdownBody';
import { DEFAULT_COMMENT_LABEL, normalizeCommentLabel } from '@/lib/slot-comment';

function ScheduledSlotVolunteerHeading({
  slot,
  isSingleDay,
  omitRedundantSlotDate,
  eventDateFallback,
}: {
  slot: SlotWithSignups;
  isSingleDay: boolean;
  omitRedundantSlotDate: boolean;
  eventDateFallback?: ScheduledSlotEventDateFallback | null;
}) {
  const { dateLine, timeLine } = formatScheduledSlotParts(
    slot.start_time,
    slot.end_time,
    eventDateFallback
  );
  const whenFallback = formatScheduledSlotWhen(
    slot.start_time,
    slot.end_time,
    eventDateFallback,
    { omitRedundantDate: omitRedundantSlotDate }
  );

  const timeLessSingleDay = isSingleDay && !timeLine;

  if (timeLessSingleDay) {
    return (
      <>
        <h3 className="text-base font-semibold text-charcoal font-body leading-tight">
          {whenFallback}
        </h3>
        <h4 className="mt-0.5 text-sm font-medium text-charcoal font-body">
          {slot.role_name}
        </h4>
      </>
    );
  }

  if (isSingleDay && timeLine) {
    return (
      <>
        {slot.start_time ? (
          <p className="text-sm text-muted font-body">
            {prefixWeekday(slot.start_time)}
          </p>
        ) : null}
        <h3 className="text-base font-semibold text-charcoal font-body leading-tight">
          {timeLine}
        </h3>
        <h4 className="mt-0.5 text-sm font-medium text-charcoal font-body">
          {slot.role_name}
        </h4>
      </>
    );
  }

  return (
    <>
      <h3 className="text-base font-semibold text-charcoal font-body leading-tight">
        {dateLine}
      </h3>
      {timeLine ? (
        <p className="text-sm text-muted font-body mt-0.5">{timeLine}</p>
      ) : null}
      <h4 className="mt-0.5 text-sm font-medium text-charcoal font-body">
        {slot.role_name}
      </h4>
    </>
  );
}

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
  isSingleDay,
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
  isSingleDay: boolean;
  primaryColor?: string;
  volunteerPageThemed?: boolean;
}) {
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

  const openCountStyle = volunteerPageThemed
    ? { color: 'var(--theme-primary)' }
    : primaryColor
      ? { color: primaryColor }
      : undefined;
  const openCountClass = volunteerPageThemed || primaryColor ? '' : 'text-sage';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {isSimple ? (
          <h3 className="font-medium text-charcoal font-body">{slot.role_name}</h3>
        ) : (
          <ScheduledSlotVolunteerHeading
            slot={slot}
            isSingleDay={isSingleDay}
            omitRedundantSlotDate={omitRedundantSlotDate ?? false}
            eventDateFallback={eventDateFallback}
          />
        )}
        <p
          className={`mt-1 text-sm font-semibold font-body ${openCountClass}`}
          style={openCountStyle}
        >
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
          <div className="mt-1 text-sm text-muted font-body prose prose-sm max-w-none prose-p:text-muted prose-li:text-muted prose-headings:text-charcoal prose-strong:text-charcoal">
            <MarkdownBody markdown={slot.role_description || slot.instructions || ''} />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          onSignUpClick?.();
          onSignUp();
        }}
        className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold font-body transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
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
  const isSingleDay =
    !isSimple &&
    scheduledSlotsShareSingleCalendarDay(slots, eventDateFallback ?? null);
  const omitRedundantSlotDate = isSingleDay;
  const orderedSlots = sortSlotsForVolunteerDisplay(slots, signupType);
  const openSlots = orderedSlots.filter((s) => getSlotRemainingCapacity(s) > 0);
  const filledSlots = orderedSlots.filter((s) => getSlotRemainingCapacity(s) === 0);
  const filledLabel = isSimple ? 'Filled Items' : 'Filled Roles';
  const allFilledText = isSimple
    ? 'All items are filled. Thank you!'
    : 'All roles are filled. Thank you!';
  const todayAnchorRef = useRef<HTMLLIElement>(null);
  const anchorSlotId = useMemo(() => {
    if (isSingleDay || isSimple) return null;
    const now = new Date().toISOString();
    const firstFutureOpen = openSlots.find((s) => s.start_time && s.start_time >= now);
    if (firstFutureOpen) return firstFutureOpen.id;
    const firstFutureFilled = filledSlots.find((s) => s.start_time && s.start_time >= now);
    return firstFutureFilled?.id ?? null;
  }, [isSingleDay, isSimple, openSlots, filledSlots]);

  const handleOpenSignups = (slot: SlotWithSignups) => {
    if (posthog) {
      posthog.capture('public_signups_modal_opened', {
        signup_type: signupType,
        slot_name: slot.role_name,
      });
    }
    onOpenSignups(slot);
  };

  const handleGoToFutureSpots = () => {
    todayAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sectionIconClass = volunteerPageThemed ? '' : 'text-sage';
  const sectionIconStyle = volunteerPageThemed
    ? { color: 'var(--theme-primary)' }
    : undefined;

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-charcoal/50 font-body"
            style={volunteerPageThemed ? { fontFamily: 'var(--theme-font)' } : undefined}
          >
            <Zap
              size={14}
              strokeWidth={2.5}
              className={sectionIconClass}
              style={sectionIconStyle}
              aria-hidden
            />
            Still Needed
          </h2>
          {anchorSlotId ? (
            <button
              type="button"
              onClick={handleGoToFutureSpots}
              className={`shrink-0 rounded text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-sage/30 font-body ${
                volunteerPageThemed ? '' : 'text-sage hover:text-sage-hover'
              }`}
              style={volunteerPageThemed ? { color: 'var(--theme-primary)' } : undefined}
            >
              Go to future spots
            </button>
          ) : null}
        </div>
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
                <li
                  key={slot.id}
                  ref={slot.id === anchorSlotId ? todayAnchorRef : null}
                  data-today-anchor={slot.id === anchorSlotId ? 'true' : undefined}
                  className={slot.id === anchorSlotId ? 'scroll-mt-24' : undefined}
                >
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
                    isSingleDay={isSingleDay}
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
            className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-charcoal/50 font-body"
            style={volunteerPageThemed ? { fontFamily: 'var(--theme-font)' } : undefined}
          >
            <Check size={14} strokeWidth={2.5} className="text-charcoal/40" aria-hidden />
            {filledLabel}
          </h2>
          <ul className="space-y-3">
            {filledSlots.map((slot) => {
              const names = slot.signups.map((s) => s.name).join(', ');
              const multiCapLink =
                showSignups && slot.capacity > 1;
              const countLabel = isSimple ? 'signed up' : 'volunteers';
              const singleCapComment =
                showSignups &&
                slot.capacity === 1 &&
                slot.signups[0]?.comment?.trim();
              const commentLabel = normalizeCommentLabel(
                slot.comment_label ?? DEFAULT_COMMENT_LABEL
              );

              return (
                <li
                  key={slot.id}
                  ref={slot.id === anchorSlotId ? todayAnchorRef : null}
                  data-today-anchor={slot.id === anchorSlotId ? 'true' : undefined}
                  className={`rounded-xl border border-charcoal/10 bg-surface/60 px-4 py-3 shadow-soft opacity-60 ${
                    slot.id === anchorSlotId ? 'scroll-mt-24' : ''
                  }`}
                >
                  {isSimple ? (
                    <p className="font-medium text-charcoal font-body">
                      {slot.role_name}
                    </p>
                  ) : (
                    <ScheduledSlotVolunteerHeading
                      slot={slot}
                      isSingleDay={isSingleDay}
                      omitRedundantSlotDate={omitRedundantSlotDate}
                      eventDateFallback={eventDateFallback}
                    />
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
                    <div className="mt-1 space-y-0.5">
                      <p className="text-sm text-muted font-body">{names}</p>
                      {singleCapComment ? (
                        <p className="text-xs text-muted font-body">
                          {commentLabel}: {slot.signups[0]!.comment!.trim()}
                        </p>
                      ) : null}
                    </div>
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
