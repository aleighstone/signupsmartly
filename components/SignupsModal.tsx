'use client';

import { useEffect } from 'react';
import { normalizeCommentLabel } from '@/lib/slot-comment';

export type PublicSignup = {
  id?: string;
  name: string;
  comment?: string | null;
};

export type SignupsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  slotName: string;
  slotTime?: string | null;
  signups: PublicSignup[];
  showComments: boolean;
  commentLabel: string;
};

export function SignupsModal({
  isOpen,
  onClose,
  slotName,
  slotTime,
  signups,
  showComments,
  commentLabel,
}: SignupsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const label = normalizeCommentLabel(commentLabel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signups-modal-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-soft-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="signups-modal-title"
              className="text-base font-semibold text-charcoal font-heading"
            >
              {slotName}
            </h2>
            {slotTime ? (
              <p className="mt-0.5 text-sm text-muted font-body">{slotTime}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-muted hover:bg-charcoal/5 hover:text-charcoal font-body"
            aria-label="Close"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        <ul className="max-h-72 space-y-3 overflow-y-auto">
          {signups.map((s, i) => (
            <li key={s.id ?? `${s.name}-${i}`} className="flex flex-col">
              <span className="flex items-center gap-1.5 text-sm font-medium text-charcoal font-body">
                <span className="text-xs text-sage" aria-hidden>
                  ✓
                </span>
                {s.name}
              </span>
              {showComments && s.comment?.trim() ? (
                <span className="ml-4 mt-0.5 text-xs text-muted font-body">
                  {label}: {s.comment.trim()}
                </span>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t border-charcoal/10 pt-4 text-center text-xs text-muted font-body">
          Organized with SignupSmartly
        </p>
      </div>
    </div>
  );
}
