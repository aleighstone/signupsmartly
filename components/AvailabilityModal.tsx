'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { SlotWithSignups } from '@/types/database';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlots: SlotWithSignups[];
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  volunteerPageThemed?: boolean;
}

export function AvailabilityModal({
  isOpen,
  onClose,
  selectedSlots,
  onSubmit,
  isSubmitting = false,
  error = null,
  volunteerPageThemed,
}: AvailabilityModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      setLocalError(null);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isSubmitting, onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (!name.trim()) {
      setLocalError('Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Enter a valid email address.');
      return;
    }
    await onSubmit({ name: name.trim(), email: email.trim() });
  };

  if (!isOpen) return null;

  const buttonStyle = volunteerPageThemed
    ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-btn-text)' }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="availability-modal-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md"
      >
        <h2 id="availability-modal-title" className="text-lg font-semibold text-charcoal font-heading">
          Tell us who you are
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="availability-name" className="block text-sm font-medium text-charcoal mb-1 font-body">
              Name <span className="text-coral">*</span>
            </label>
            <input
              id="availability-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="availability-email" className="block text-sm font-medium text-charcoal mb-1 font-body">
              Email <span className="text-coral">*</span>
            </label>
            <input
              id="availability-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              autoComplete="email"
            />
          </div>
          <div className="rounded-xl border border-charcoal/10 bg-sand/40 p-4">
            <h3 className="text-sm font-semibold text-charcoal font-body">Your selected dates:</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-charcoal font-body">
              {selectedSlots.map((slot) => (
                <li key={slot.id}>{slot.role_name}</li>
              ))}
            </ul>
          </div>
          {(localError || error) && (
            <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-charcoal font-body" role="alert">
              {localError || error}
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold font-body transition-opacity hover:opacity-90 disabled:opacity-60 ${
              volunteerPageThemed ? '' : 'bg-sage text-white hover:bg-sage-hover'
            }`}
            style={buttonStyle}
          >
            {isSubmitting ? 'Submitting...' : 'Submit my availability'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-charcoal/20 bg-surface px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-60 transition-colors font-body"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
