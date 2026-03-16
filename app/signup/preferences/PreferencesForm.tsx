'use client';

import { useState } from 'react';

interface PreferencesFormProps {
  token: string;
  initialOptIn: boolean;
  initialOffset: '1_day' | 'morning_of';
  slotName?: string;
  hasDate: boolean;
}

export function PreferencesForm(props: PreferencesFormProps) {
  const { token, initialOptIn, initialOffset, hasDate } = props;
  const [optIn, setOptIn] = useState(initialOptIn);
  const [offset, setOffset] = useState(initialOffset);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasDate && optIn) {
      setError('Reminders are only available for events with a date.');
      return;
    }
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/signup/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          reminder_opt_in: optIn,
          reminder_offset: offset,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save preferences');
      }
      setMessage('Your reminder preferences have been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const disabled = isSaving || !hasDate;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-charcoal/10 bg-surface p-6 space-y-4 shadow-soft"
    >
      {!hasDate && (
        <p className="text-sm text-muted font-body">
          This event doesn&apos;t have a date, so reminders are not available
          for this signup.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-charcoal font-body">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-charcoal/30 text-sage focus:ring-sage/40"
            checked={optIn && hasDate}
            disabled={disabled || !hasDate}
            onChange={(e) => setOptIn(e.target.checked)}
          />
          <span>Send me a reminder email</span>
        </label>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="reminder_offset"
            className="text-sm font-medium text-charcoal font-body"
          >
            When should we remind you?
          </label>
          <select
            id="reminder_offset"
            className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal bg-white focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
            value={offset}
            onChange={(e) =>
              setOffset(e.target.value as '1_day' | 'morning_of')
            }
            disabled={disabled || !optIn}
          >
            <option value="1_day">1 day before</option>
            <option value="morning_of">Morning of the event</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-coral font-body">{error}</p>
      )}
      {message && (
        <p className="text-sm text-sage font-body">{message}</p>
      )}

      <button
        type="submit"
        disabled={isSaving || !hasDate}
        className="w-full rounded-xl bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
      >
        {isSaving ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  );
}

