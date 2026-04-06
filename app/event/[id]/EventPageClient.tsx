'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlotList } from '@/components/SlotList';
import { SignupModal } from '@/components/SignupModal';
import { formatScheduledSlotWhen } from '@/lib/calendar';
import type { EventWithSlots, SlotWithSignups } from '@/types/database';
import type { SignupFormData } from '@/components/SignupForm';

interface EventPageClientProps {
  event: EventWithSlots;
  primaryColor?: string;
}

export function EventPageClient({ event, primaryColor }: EventPageClientProps) {
  const router = useRouter();
  const [modalSlot, setModalSlot] = useState<SlotWithSignups | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = (slot: SlotWithSignups) => {
    setModalSlot(slot);
    setError(null);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setModalSlot(null);
      setError(null);
    }
  };

  const handleSubmit = async (data: SignupFormData) => {
    if (!modalSlot) return;
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
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong, please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SlotList
        slots={event.slots}
        onSignUp={handleSignUp}
        signupType={event.signup_type}
        eventDateFallback={
          event.signup_type === 'scheduled'
            ? { startDate: event.start_date, endDate: event.end_date }
            : null
        }
        primaryColor={primaryColor}
      />
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
                { startDate: event.start_date, endDate: event.end_date }
              )
            : null
        }
        slotDetails={modalSlot?.instructions ?? modalSlot?.role_description ?? null}
        commentLabel={modalSlot?.comment_label}
        commentRequired={Boolean(modalSlot?.comment_required)}
        showReminders={event.signup_type === 'scheduled' || !!event.start_date}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        primaryColor={primaryColor}
      />
    </>
  );
}
