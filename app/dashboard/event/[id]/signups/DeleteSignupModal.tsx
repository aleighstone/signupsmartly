'use client';

import { useState, useEffect } from 'react';

interface DeleteSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: { signupId: string; name: string; role: string } | null;
  onRemoved: () => void;
}

export function DeleteSignupModal({
  isOpen,
  onClose,
  target,
  onRemoved,
}: DeleteSignupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) setError('');
  }, [isOpen]);

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleConfirm = async () => {
    if (!target) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/signup/organizer', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId: target.signupId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to remove signup');
      onClose();
      onRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-signup-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md">
        <p
          id="delete-signup-title"
          className="text-lg font-semibold text-charcoal font-heading leading-snug"
        >
          Remove {target.name} from {target.role}?
        </p>

        {error && <p className="mt-4 text-sm text-coral font-body">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:opacity-60 transition-colors font-body"
          >
            {isSubmitting ? 'Removing…' : 'Remove'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
