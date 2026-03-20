'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';

const REASON_OPTIONS = [
  'General feedback',
  'Feature request',
  'Bug report / problem',
] as const;

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState<(typeof REASON_OPTIONS)[number]>(
    'General feedback'
  );
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, email, reason, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send feedback');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-semibold text-charcoal font-heading">
          Your feedback has been sent 🎉
        </h1>
        <Link
          href="/dashboard"
          className="mt-6 inline-block btn-primary"
        >
          Go to My Dashboard
        </Link>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold text-charcoal font-heading">
        Submit Feedback
      </h1>
      <p className="mt-2 text-sm text-muted font-body">
        If you have general feedback, want to request a feature enhancement, or
        have found a problem you want to report, submit the form below! We
        appreciate all feedback and will be happy to answer questions if needed.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-xl space-y-4 rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft"
      >
        {error && (
          <p className="rounded-xl bg-coral p-3 text-sm text-white font-body">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-charcoal mb-1 font-body"
          >
            Name <span className="text-muted">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
            placeholder="Your name"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-charcoal mb-1 font-body"
          >
            Your Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
            placeholder="you@example.com"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-charcoal mb-1 font-body"
          >
            Reason
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) =>
              setReason(e.target.value as (typeof REASON_OPTIONS)[number])
            }
            className="w-full appearance-none rounded-xl border border-charcoal/20 bg-white px-3 py-2.5 text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '16px 16px',
              paddingRight: '2.75rem',
            }}
            disabled={isSubmitting}
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-charcoal mb-1 font-body"
          >
            Message
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body resize-none disabled:opacity-60"
            placeholder="Your feedback..."
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-60"
        >
          {isSubmitting ? 'Sending…' : 'Submit'}
        </button>
      </form>
    </AppLayout>
  );
}
