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
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center space-y-4">
        <p className="text-neutral-700 font-medium">Your signup has been cancelled.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800"
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
        className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {isSubmitting ? 'Cancelling…' : 'Yes, cancel my signup'}
      </button>
      <Link
        href="/"
        className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 text-center focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
      >
        Keep my signup
      </Link>
    </div>
  );
}
