'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlotList } from '@/components/SlotList';
import { SignupModal } from '@/components/SignupModal';
import { AvailabilitySlotList } from '@/components/AvailabilitySlotList';
import { AvailabilityModal } from '@/components/AvailabilityModal';
import { SignupsModal } from '@/components/SignupsModal';
import {
  formatScheduledSlotWhen,
  scheduledSlotsShareSingleCalendarDay,
} from '@/lib/calendar';
import type { EventWithSlots, SlotWithSignups } from '@/types/database';
import type { SignupFormData } from '@/components/SignupForm';
import { DEFAULT_COMMENT_LABEL } from '@/lib/slot-comment';

interface EventPageClientProps {
  event: EventWithSlots;
}

export function EventPageClient({ event }: EventPageClientProps) {
  const router = useRouter();
  const [modalSlot, setModalSlot] = useState<SlotWithSignups | null>(null);
  const [selectedAvailabilitySlotIds, setSelectedAvailabilitySlotIds] = useState<string[]>([]);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [signupsModalSlot, setSignupsModalSlot] = useState<SlotWithSignups | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Prevents double-submit (double-click, Enter+click) before React re-renders. */
  const submitInFlightRef = useRef(false);

  const showSignups = event.show_signups ?? true;
  const isAvailability = event.signup_type === 'availability';
  const selectedAvailabilitySlots = event.slots.filter((slot) =>
    selectedAvailabilitySlotIds.includes(slot.id)
  );

  const eventDateFallback =
    event.signup_type === 'scheduled'
      ? { startDate: event.start_date, endDate: event.end_date }
      : null;
  const omitRedundantSlotDate =
    event.signup_type === 'scheduled' &&
    scheduledSlotsShareSingleCalendarDay(event.slots, eventDateFallback);

  const handleSignUp = (slot: SlotWithSignups) => {
    submitInFlightRef.current = false;
    setModalSlot(slot);
    setError(null);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      submitInFlightRef.current = false;
      setModalSlot(null);
      setAvailabilityModalOpen(false);
      setError(null);
    }
  };

  const handleSubmit = async (data: SignupFormData) => {
    if (!modalSlot) return;
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: modalSlot.id,
          name: data.name,
          email: data.email,
          comment: data.comment,
          reminder_opt_in: data.reminder_opt_in,
          reminder_offset: data.reminder_offset,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Signup failed');
      router.push(`/signup/confirm?id=${json.signupId}`);
      // Keep isSubmitting true and ref locked until navigation unmounts — do not re-enable
      // the button while still on this page (avoids duplicate signups).
    } catch (e) {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
      setError(
        e instanceof Error ? e.message : 'Something went wrong, please try again.'
      );
    }
  };
  const handleAvailabilitySubmit = async (data: { name: string; email: string }) => {
    if (selectedAvailabilitySlotIds.length === 0) return;
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotIds: selectedAvailabilitySlotIds,
          name: data.name,
          email: data.email,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Availability submission failed');
      router.push(`/signup/confirm?id=${json.responseId}`);
    } catch (e) {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
      setError(
        e instanceof Error ? e.message : 'Something went wrong, please try again.'
      );
    }
  };


  const signupsModalWhen =
    signupsModalSlot && event.signup_type === 'scheduled'
      ? formatScheduledSlotWhen(
          signupsModalSlot.start_time,
          signupsModalSlot.end_time,
          eventDateFallback,
          { omitRedundantDate: omitRedundantSlotDate }
        )
      : null;

  return (
    <>
      {isAvailability ? (
        <AvailabilitySlotList
          slots={event.slots}
          selectedSlotIds={selectedAvailabilitySlotIds}
          onSelectionChange={setSelectedAvailabilitySlotIds}
          onSubmit={() => {
            submitInFlightRef.current = false;
            setError(null);
            setAvailabilityModalOpen(true);
          }}
          showSignups={showSignups}
          onOpenSignups={setSignupsModalSlot}
          volunteerPageThemed
        />
      ) : (
        <SlotList
          slots={event.slots}
          onSignUp={handleSignUp}
          showSignups={showSignups}
          onOpenSignups={setSignupsModalSlot}
          signupType={event.signup_type === 'simple' ? 'simple' : 'scheduled'}
          eventDateFallback={eventDateFallback}
          volunteerPageThemed
        />
      )}
      <SignupsModal
        isOpen={!!signupsModalSlot}
        onClose={() => setSignupsModalSlot(null)}
        slotName={signupsModalSlot?.role_name ?? ''}
        slotTime={signupsModalWhen}
        signups={
          signupsModalSlot?.signups.map((s) => ({
            id: s.id,
            name: s.name,
            comment: s.comment,
          })) ?? []
        }
        showComments={showSignups}
        commentLabel={signupsModalSlot?.comment_label ?? DEFAULT_COMMENT_LABEL}
      />
      <AvailabilityModal
        isOpen={availabilityModalOpen}
        onClose={handleCloseModal}
        selectedSlots={selectedAvailabilitySlots}
        onSubmit={handleAvailabilitySubmit}
        isSubmitting={isSubmitting}
        error={error}
        volunteerPageThemed
      />
      {!isAvailability && (
        <SignupModal
        isOpen={!!modalSlot}
        onClose={handleCloseModal}
        slotId={modalSlot?.id}
        slotRoleName={modalSlot?.role_name ?? ''}
        slotWhen={
          modalSlot && event.signup_type === 'scheduled'
            ? formatScheduledSlotWhen(
                modalSlot.start_time,
                modalSlot.end_time,
                eventDateFallback,
                { omitRedundantDate: omitRedundantSlotDate }
              )
            : null
        }
        slotDetails={modalSlot?.instructions ?? modalSlot?.role_description ?? null}
        commentLabel={modalSlot?.comment_label}
        commentRequired={Boolean(modalSlot?.comment_required)}
        showSignupsPublic={showSignups}
        commentShowPublicly={showSignups}
        showReminders={event.signup_type === 'scheduled' || !!event.start_date}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        volunteerPageThemed
        />
      )}
    </>
  );
}
