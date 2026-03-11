'use client';

import { useEffect } from 'react';
import { SignupForm, type SignupFormData } from './SignupForm';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotRoleName: string;
  onSubmit: (data: SignupFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function SignupModal({
  isOpen,
  onClose,
  slotRoleName,
  onSubmit,
  isSubmitting = false,
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
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="signup-modal-title" className="text-lg font-semibold text-neutral-900 mb-4">
          Sign up to volunteer
        </h2>
        <SignupForm
          slotRoleName={slotRoleName}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
