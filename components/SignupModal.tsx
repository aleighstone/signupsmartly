'use client';

import { useEffect } from 'react';
import { SignupForm, type SignupFormData } from './SignupForm';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotRoleName: string;
  slotDetails?: string | null;
  showReminders: boolean;
  onSubmit: (data: SignupFormData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function SignupModal({
  isOpen,
  onClose,
  slotRoleName,
  slotDetails,
  showReminders,
  onSubmit,
  isSubmitting = false,
  error = null,
}: SignupModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md">
        <SignupForm
          modalTitleId="signup-modal-title"
          slotRoleName={slotRoleName}
          slotDetails={slotDetails}
          showReminders={showReminders}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  );
}
