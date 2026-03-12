'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CancelFormProps {
  cancelToken: string;
}

export function CancelForm({ cancelToken }: CancelFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/signup/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelToken }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      setCancelled(true);
      router.refresh();
    } catch {
      alert('Failed to cancel signup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cancelled) {
    return (
      <div className="rounded-xl border border-charcoal/10 bg-surface p-6 text-center space-y-4 shadow-soft">
        <p className="text-charcoal font-medium font-body">Your signup has been cancelled.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-sage px-4 py-3 text-sm font-medium text-white hover:bg-sage-hover transition-colors font-body"
        >
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleCancel}
        disabled={isSubmitting}
        className="flex-1 rounded-xl bg-coral px-4 py-3 text-sm font-medium text-white hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:opacity-60 transition-colors font-body"
      >
        {isSubmitting ? 'Cancelling…' : 'Yes, cancel my signup'}
      </button>
      <Link
        href="/"
        className="flex-1 rounded-xl border-2 border-charcoal bg-transparent px-4 py-3 text-sm font-medium text-charcoal hover:bg-charcoal/5 text-center focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2 transition-colors font-body"
      >
        Keep my signup
      </Link>
    </div>
  );
}
