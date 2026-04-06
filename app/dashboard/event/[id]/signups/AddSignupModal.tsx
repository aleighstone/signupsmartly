'use client';

import { useState, useEffect, useMemo } from 'react';
import { DEFAULT_COMMENT_LABEL, normalizeCommentLabel } from '@/lib/slot-comment';

interface SlotOption {
  id: string;
  role_name: string;
  comment_label: string;
  comment_required: boolean;
}

interface AddSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSlot: Pick<SlotOption, 'id' | 'role_name'> | null;
  slots: SlotOption[];
  isSimple: boolean;
  onAdded: () => void;
}

const selectClassName =
  'w-full appearance-none rounded-xl border border-charcoal/20 bg-surface bg-no-repeat bg-[length:14px_14px] pl-3 pr-11 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60';

const chevronBg = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
  backgroundPosition: 'right 0.75rem center' as const,
};

export function AddSignupModal({
  isOpen,
  onClose,
  preselectedSlot,
  slots,
  isSimple,
  onAdded,
}: AddSignupModalProps) {
  const [slotId, setSlotId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const initial = preselectedSlot?.id ?? slots[0]?.id ?? '';
    setSlotId(initial);
    setName('');
    setEmail('');
    setComment('');
    setError('');
  }, [isOpen, preselectedSlot?.id, slots]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === slotId),
    [slots, slotId]
  );

  const commentFieldLabel = selectedSlot
    ? normalizeCommentLabel(selectedSlot.comment_label)
    : DEFAULT_COMMENT_LABEL;
  const commentRequired = Boolean(selectedSlot?.comment_required);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (commentRequired && !comment.trim()) {
      setError(
        `Please enter ${commentFieldLabel === DEFAULT_COMMENT_LABEL ? 'a comment' : commentFieldLabel.toLowerCase()}.`
      );
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/signup/organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          name: name.trim(),
          email: email.trim() || null,
          comment: comment.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add signup');
      onClose();
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const label = isSimple ? 'Item' : 'Spot';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-signup-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md">
        <h2 id="add-signup-title" className="text-lg font-semibold text-charcoal font-heading">
          Add signup
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="slot" className="block text-sm font-medium text-charcoal mb-1 font-body">
              {label}
            </label>
            <select
              id="slot"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              className={selectClassName}
              style={chevronBg}
              disabled={isSubmitting || slots.length <= 1}
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.role_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="add-name" className="block text-sm font-medium text-charcoal mb-1 font-body">
              Name <span className="text-coral">*</span>
            </label>
            <input
              id="add-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
              placeholder="Name"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="add-email" className="block text-sm font-medium text-charcoal mb-1 font-body">
              Email <span className="text-muted">(optional)</span>
            </label>
            <input
              id="add-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
              placeholder="email@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="add-comment" className="block text-sm font-medium text-charcoal mb-1 font-body">
              {commentFieldLabel}
              {commentRequired ? (
                <span className="text-coral"> *</span>
              ) : (
                <span className="text-muted font-normal"> (optional)</span>
              )}
            </label>
            <textarea
              id="add-comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body resize-none disabled:opacity-60"
              placeholder={
                commentFieldLabel === DEFAULT_COMMENT_LABEL
                  ? 'Any notes?'
                  : `Enter ${commentFieldLabel.toLowerCase()}`
              }
              disabled={isSubmitting}
              aria-required={commentRequired}
            />
          </div>

          {error && (
            <p className="text-sm text-coral font-body">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
