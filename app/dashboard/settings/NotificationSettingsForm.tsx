'use client';

import { useState } from 'react';

type Preference = 'instant' | 'daily' | 'weekly' | 'never';

const OPTIONS: { value: Preference; label: string; description: string }[] = [
  { value: 'instant', label: 'Instantly', description: 'Get an email as soon as someone signs up' },
  { value: 'daily', label: 'Daily digest', description: 'Get a summary email each morning with overnight signups' },
  { value: 'weekly', label: 'Weekly digest', description: 'Get a summary email every Monday morning' },
  { value: 'never', label: 'Never', description: "Don't send me signup notification emails" },
];

interface NotificationSettingsFormProps {
  initialPreference: Preference;
}

export function NotificationSettingsForm({ initialPreference }: NotificationSettingsFormProps) {
  const [preference, setPreference] = useState<Preference>(initialPreference);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preference: preference }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-charcoal font-heading">Signup Notifications</h2>
      <p className="mt-1 text-sm text-muted font-body">
        Choose how often you want to hear about new signups across all your events.
      </p>
      <fieldset className="mt-4 space-y-3">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/10 p-3 hover:bg-charcoal/[0.02] has-[:checked]:border-sage has-[:checked]:bg-sage/5"
          >
            <input
              type="radio"
              name="notification_preference"
              value={opt.value}
              checked={preference === opt.value}
              onChange={() => setPreference(opt.value)}
              className="mt-0.5 h-4 w-4 border-charcoal/30 text-sage focus:ring-sage/40"
            />
            <div>
              <span className="font-medium text-charcoal font-body">{opt.label}</span>
              <p className="text-sm text-muted font-body">{opt.description}</p>
            </div>
          </label>
        ))}
      </fieldset>
      {error && <p className="mt-4 text-sm text-coral font-body">{error}</p>}
      {message && <p className="mt-4 text-sm text-sage font-body">{message}</p>}
      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 btn-primary"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
