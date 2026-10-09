'use client';

import { useEffect } from 'react';
import { SignupForm, type SignupFormData } from './SignupForm';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Stable id so the form resets when switching slots */
  slotId?: string;
  slotRoleName: string;
  slotWhen?: string | null;
  slotDetails?: string | null;
  commentLabel?: string;
  commentRequired?: boolean;
  showSignupsPublic?: boolean;
  commentShowPublicly?: boolean;
  showReminders: boolean;
  onSubmit: (data: SignupFormData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  primaryColor?: string;
  volunteerPageThemed?: boolean;
}

export function SignupModal({
  isOpen,
  onClose,
  slotId,
  slotRoleName,
  slotWhen,
  slotDetails,
  commentLabel,
  commentRequired,
  showSignupsPublic,
  commentShowPublicly,
  showReminders,
  onSubmit,
  isSubmitting = false,
  error = null,
  primaryColor,
  volunteerPageThemed,
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
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
      onClick={onClose}
    >
      {/* Visual backdrop — fixed behind scroll layer */}
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        aria-hidden="true"
      />
      {/* Scrollable layer — lets tall content scroll on small phones */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* stopPropagation prevents card clicks from closing the modal */}
          <div
            className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md"
            onClick={(e) => e.stopPropagation()}
          >
            <SignupForm
              key={slotId ?? slotRoleName}
              modalTitleId="signup-modal-title"
              slotRoleName={slotRoleName}
              slotWhen={slotWhen}
              slotDetails={slotDetails}
              commentLabel={commentLabel}
              commentRequired={commentRequired}
              showSignupsPublic={showSignupsPublic}
              commentShowPublicly={commentShowPublicly}
              showReminders={showReminders}
              onSubmit={onSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
              error={error}
              primaryColor={primaryColor}
              volunteerPageThemed={volunteerPageThemed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
