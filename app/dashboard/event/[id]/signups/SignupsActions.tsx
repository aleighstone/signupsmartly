'use client';

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
  }[];
  isSimple: boolean;
}

export function SignupsActions({ event, rows, isSimple }: SignupsActionsProps) {
  const csvHeaders = isSimple
    ? ['Item', 'Volunteer Name', 'Email', 'Comment', 'Signup Timestamp']
    : ['Role', 'Volunteer Name', 'Email', 'Time', 'Comment', 'Signup Timestamp'];

  const csvRows = rows.map((r) =>
    isSimple
      ? [r.role, r.name, r.email, r.comment || '', r.createdAt]
      : [r.role, r.name, r.email, r.time || '', r.comment || '', r.createdAt]
  );

  const csvContent = [csvHeaders, ...csvRows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const exportCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}-signups.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyRecap = async () => {
    await navigator.clipboard.writeText(recapText);
    setRecapCopied(true);
    setTimeout(() => setRecapCopied(false), 2000);
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
