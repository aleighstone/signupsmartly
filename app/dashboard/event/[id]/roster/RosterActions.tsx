'use client';

import { useState } from 'react';
import type { EventWithSlots } from '@/types/database';

interface RosterActionsProps {
  event: EventWithSlots;
  rows: {
    role: string;
    name: string;
    email: string;
    time: string;
    comment: string | null;
    createdAt: string;
  }[];
}

export function RosterActions({ event, rows }: RosterActionsProps) {
  const [recapOpen, setRecapOpen] = useState(false);
  const [recapCopied, setRecapCopied] = useState(false);

  const csvContent = [
    ['Role', 'Volunteer Name', 'Email', 'Time', 'Comment', 'Signup Timestamp'],
    ...rows.map((r) => [
      r.role,
      r.name,
      r.email,
      r.time,
      r.comment || '',
      r.createdAt,
    ]),
  ]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const recapText = [
    'Thank you to our volunteers!',
    '',
    ...event.slots.flatMap((slot) => {
      const names = slot.signups.map((s) => s.name);
      if (names.length === 0) return [];
      return [slot.role_name, ...names.map((n) => `• ${n}`), ''];
    }),
    'Organized with SignupSmartly',
  ].join('\n');

  const exportCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}-roster.csv`;
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
      <button
        type="button"
        onClick={() => setRecapOpen(!recapOpen)}
        className="rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body"
      >
        {recapOpen ? 'Hide Recap' : 'Generate Volunteer Recap'}
      </button>

      {recapOpen && (
        <div className="mt-4 rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft">
          <h3 className="text-sm font-medium text-charcoal mb-2 font-body">
            Volunteer Recap
          </h3>
          <pre className="whitespace-pre-wrap rounded-xl bg-sand/50 p-4 text-sm text-charcoal font-body max-h-64 overflow-y-auto">
            {recapText}
          </pre>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={copyRecap}
              className="rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover transition-colors"
            >
              {recapCopied ? 'Copied!' : 'Copy Recap'}
            </button>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(recapText)}`}
              download={`${event.title.replace(/\s+/g, '-')}-recap.txt`}
              className="rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body"
            >
              Download Text
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
