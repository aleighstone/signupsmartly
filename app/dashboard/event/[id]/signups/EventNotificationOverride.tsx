'use client';

import { useState } from 'react';

type NotificationPreference = 'instant' | 'daily' | 'weekly' | 'never';

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
  const normalizeForUi = (pref: NotificationPreference): NotificationPreference =>
    pref === 'weekly' ? 'daily' : pref;
  const [value, setValue] = useState<NotificationPreference>(
    normalizeForUi(eventOverride ?? globalPreference)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value as NotificationPreference;
    const nextOverride = selected === globalPreference ? null : selected;

    setValue(selected);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/events/${eventId}/notification-override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_override: nextOverride }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setValue(normalizeForUi(eventOverride ?? globalPreference));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label
        htmlFor="event-notification-override"
        className="text-sm font-medium text-charcoal font-body"
      >
        Notifications for this event:
      </label>
      <select
        id="event-notification-override"
        value={value}
        onChange={handleChange}
        disabled={saving}
        className="min-h-9 rounded-[10px] border border-charcoal/20 bg-surface px-3 pr-7 text-[13px] text-charcoal font-body focus:border-sage focus:ring-2 focus:ring-sage/30 disabled:opacity-60"
      >
        <option value="daily">Daily digest</option>
        <option value="instant">Instant</option>
        <option value="never">None</option>
      </select>
      {saved ? <span className="text-sm text-sage font-body">Saved</span> : null}
    </div>
  );
}
