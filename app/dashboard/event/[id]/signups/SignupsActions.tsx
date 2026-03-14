'use client';

import { usePostHog } from '@posthog/react';
import type { EventWithSlots } from '@/types/database';

interface SignupsActionsProps {
  event: EventWithSlots;
  rows: {
    role: string;
    name: string;
    email: string;
    time: string | null;
    comment: string | null;
    createdAt: string;
    source: 'volunteer' | 'organizer';
  }[];
  isSimple: boolean;
}

export function SignupsActions({ event, rows, isSimple }: SignupsActionsProps) {
  const posthog = usePostHog();
  const csvHeaders = isSimple
    ? ['Item', 'Name', 'Email', 'Comment', 'Signup Timestamp', 'Source']
    : ['Spot', 'Name', 'Email', 'Time', 'Comment', 'Signup Timestamp', 'Source'];

  const csvRows = rows.map((r) =>
    isSimple
      ? [r.role, r.name, r.email, r.comment || '', r.createdAt, r.source]
      : [r.role, r.name, r.email, r.time || '', r.comment || '', r.createdAt, r.source]
  );

  const csvContent = [csvHeaders, ...csvRows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const exportCsv = () => {
    if (posthog) {
      posthog.capture('csv_exported', {
        signup_type: event.signup_type,
        total_signups: rows.length,
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}-signups.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={exportCsv}
        className="rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body"
      >
        Export CSV
      </button>
    </div>
  );
}
