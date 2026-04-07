'use client';

import { useState } from 'react';

type ShareCopyModalProps = {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
};

export function ShareCopyModal({ eventId, open, onClose, onSuccess }: ShareCopyModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to send copy');
      onClose();
      onSuccess(email.trim().toLowerCase());
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send copy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-charcoal/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal font-heading">Share a copy</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-muted hover:text-charcoal"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal font-body">Recipient email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
              placeholder="name@example.com"
            />
          </div>
          {error ? <p className="text-sm text-coral font-body">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
