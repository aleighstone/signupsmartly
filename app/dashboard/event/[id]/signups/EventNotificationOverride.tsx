'use client';

import { useState } from 'react';

type NotificationPreference = 'instant' | 'daily' | 'weekly' | 'never';

const LABELS: Record<NotificationPreference, string> = {
  instant: 'Instantly',
  daily: 'Daily digest',
  weekly: 'Weekly digest',
  never: 'Never',
};

interface Props {
  eventId: string;
  eventOverride: NotificationPreference | null;
  globalPreference: NotificationPreference;
}

export function EventNotificationOverride({
  eventId,
  eventOverride,
  globalPreference,
}: Props) {
  const [value, setValue] = useState<NotificationPreference | null>(eventOverride);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const defaultLabel = `Use my default (${LABELS[globalPreference]})`;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    const nextValue = raw === '' ? null : (raw as NotificationPreference);
    setValue(nextValue);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/events/${eventId}/notification-override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_override: nextValue }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setValue(eventOverride);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        htmlFor="event-notification-override"
        className="text-sm font-medium text-charcoal font-body"
      >
        Notifications for this event:
      </label>
      <select
        id="event-notification-override"
        value={value ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-sm font-body text-charcoal bg-surface focus:ring-2 focus:ring-sage/30 focus:border-sage disabled:opacity-60"
      >
        <option value="">{defaultLabel}</option>
        <option value="instant">Instantly</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly digest</option>
        <option value="never">Never</option>
      </select>
      {saved && (
        <span className="text-sm text-sage font-body">Saved</span>
      )}
    </div>
  );
}
