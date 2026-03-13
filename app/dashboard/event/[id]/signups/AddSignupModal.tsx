'use client';

import { useState } from 'react';

interface SlotOption {
  id: string;
  role_name: string;
}

interface AddSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSlot: SlotOption | null;
  slots: SlotOption[];
  isSimple: boolean;
  onAdded: () => void;
}

export function AddSignupModal({
  isOpen,
  onClose,
  preselectedSlot,
  slots,
  isSimple,
  onAdded,
}: AddSignupModalProps) {
  const [slotId, setSlotId] = useState(preselectedSlot?.id ?? slots[0]?.id ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setSlotId(preselectedSlot?.id ?? slots[0]?.id ?? '');
    setName('');
    setEmail('');
    setComment('');
    setError('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
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
      reset();
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
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
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
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
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
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              placeholder="email@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="add-comment" className="block text-sm font-medium text-charcoal mb-1 font-body">
              Comment <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id="add-comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body resize-none"
              placeholder="Any notes?"
              disabled={isSubmitting}
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
