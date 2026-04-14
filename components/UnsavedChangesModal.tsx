'use client';

import { useEffect } from 'react';

export type UnsavedChangesModalProps = {
  isOpen: boolean;
  variant: 'published' | 'draft' | 'create';
  isSaving: boolean;
  /** When variant is create, which save action is running (for correct button labels). */
  createPending?: 'publish' | 'draft' | null;
  onPrimary: () => void;
  onSaveAsDraft?: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export function UnsavedChangesModal({
  isOpen,
  variant,
  isSaving,
  createPending = null,
  onPrimary,
  onSaveAsDraft,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const title = 'You have unsaved changes';
  const body =
    variant === 'create'
      ? 'Your signup hasn\u2019t been saved yet.'
      : variant === 'draft'
        ? 'Your draft hasn\u2019t been saved yet.'
        : 'Your edits haven\u2019t been saved yet.';

  const primaryLabel =
    variant === 'draft' ? 'Save' : 'Publish';

  const primaryPendingLabel =
    variant === 'draft'
      ? 'Saving…'
      : variant === 'published'
        ? 'Publishing…'
        : createPending === 'publish'
          ? 'Publishing…'
          : primaryLabel;

  const draftSecondaryPendingLabel =
    variant === 'create' && createPending === 'draft' ? 'Saving…' : 'Save as Draft';

  const discardClass =
    'rounded-xl border border-coral/35 bg-surface px-4 py-2.5 text-sm font-medium text-coral hover:bg-coral/10 disabled:opacity-60 transition-colors font-body';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md">
        <h2 id="unsaved-changes-title" className="text-lg font-semibold text-charcoal font-heading">
          {title}
        </h2>
        <p className="mt-2 text-sm text-charcoal font-body">{body}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={isSaving}
            onClick={onPrimary}
            className="btn-primary sm:min-w-0"
          >
            {isSaving ? primaryPendingLabel : primaryLabel}
          </button>
          {variant === 'create' && onSaveAsDraft ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={onSaveAsDraft}
              className="btn-secondary sm:min-w-0"
            >
              {isSaving ? draftSecondaryPendingLabel : 'Save as Draft'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={isSaving}
            onClick={onDiscard}
            className={discardClass}
          >
            {variant === 'create' ? 'Discard' : 'Discard changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
