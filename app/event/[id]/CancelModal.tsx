'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CancelModalProps {
  cancelToken: string;
  slotName: string;
  eventId: string;
  alreadyCancelled: boolean;
}

export function CancelModal({
  cancelToken,
  slotName,
  eventId,
  alreadyCancelled,
}: CancelModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const dismiss = () => {
    router.replace(`/event/${eventId}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/signup/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelToken }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      setDone(true);
      router.refresh();
      // Small delay so router.refresh() can complete before we navigate
      setTimeout(() => router.replace(`/event/${eventId}`), 300);
    } catch {
      alert('Failed to cancel signup. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/40"
        onClick={dismiss}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-soft-md">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:bg-charcoal/5 hover:text-charcoal"
          aria-label="Close"
        >
          <span className="text-lg leading-none">✕</span>
        </button>

        {alreadyCancelled || done ? (
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-charcoal font-heading">
              Signup cancelled
            </p>
            <p className="text-sm text-muted font-body">
              Your signup has been cancelled. You can sign up for another spot below.
            </p>
            <button
              onClick={dismiss}
              className="w-full rounded-xl bg-sage px-4 py-3 text-sm font-medium text-white hover:bg-sage-hover transition-colors font-body"
            >
              View event
            </button>
          </div>
        ) : (
          <>
            <h2
              id="cancel-modal-title"
              className="text-lg font-semibold text-charcoal font-heading mb-1"
            >
              Cancel signup?
            </h2>
            <p className="text-sm text-muted font-body mb-6">
              You&apos;re cancelling your spot as{' '}
              <strong className="text-charcoal">{slotName}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-coral px-4 py-3 text-sm font-medium text-white hover:bg-coral/90 disabled:opacity-60 transition-colors font-body"
              >
                {isSubmitting ? 'Cancelling…' : 'Yes, cancel'}
              </button>
              <button
                onClick={dismiss}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border-2 border-charcoal bg-transparent px-4 py-3 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-60 transition-colors font-body"
              >
                Keep my spot
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
