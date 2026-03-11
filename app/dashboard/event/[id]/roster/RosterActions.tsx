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
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => setRecapOpen(!recapOpen)}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        {recapOpen ? 'Hide Recap' : 'Generate Volunteer Recap'}
      </button>

      {recapOpen && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">
            Volunteer Recap
          </h3>
          <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm text-neutral-800 font-sans max-h-64 overflow-y-auto">
            {recapText}
          </pre>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={copyRecap}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              {recapCopied ? 'Copied!' : 'Copy Recap'}
            </button>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(recapText)}`}
              download={`${event.title.replace(/\s+/g, '-')}-recap.txt`}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Download Text
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
