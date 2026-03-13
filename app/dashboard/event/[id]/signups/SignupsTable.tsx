'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddSignupModal } from './AddSignupModal';

type TableRow = {
  slotId: string;
  role: string;
  time: string | null;
  isEmpty: boolean;
  signup?: {
    id: string;
    name: string;
    email: string | null;
    comment: string | null;
    createdAt: string;
    source: 'volunteer' | 'organizer';
  };
};

interface SignupsTableProps {
  rows: TableRow[];
  slots: { id: string; role_name: string }[];
  isSimple: boolean;
}

export function SignupsTable({ rows, slots, isSimple }: SignupsTableProps) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPreselected, setAddModalPreselected] = useState<{ id: string; role_name: string } | null>(null);

  const handleAddClick = (slotId: string, role: string) => {
    setAddModalPreselected({ id: slotId, role_name: role });
    setAddModalOpen(true);
  };

  const handleAdded = () => {
    router.refresh();
  };

  const label = isSimple ? 'Item' : 'Spot';

  return (
    <>
      <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-surface shadow-soft">
        <table className="min-w-full divide-y divide-charcoal/10">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                {label}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Email
              </th>
              {!isSimple && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                  Time
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Comment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Signup Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/10">
            {rows.map((row, i) => (
              <tr
                key={row.isEmpty ? `empty-${row.slotId}-${i}` : `signup-${row.signup!.id}`}
                className={row.isEmpty ? 'bg-charcoal/[0.02]' : ''}
              >
                <td className={`px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
                  {row.role}
                </td>
                <td className={`px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
                  {row.isEmpty ? (
                    <button
                      type="button"
                      onClick={() => handleAddClick(row.slotId, row.role)}
                      className="text-sage hover:text-sage-hover font-medium focus:outline-none focus:underline"
                    >
                      + Add signup
                    </button>
                  ) : (
                    <span className="flex items-center gap-2 flex-wrap">
                      {row.signup!.name}
                      {row.signup!.source === 'organizer' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-charcoal/10 text-muted font-body">
                          added by organizer
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className={`px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-muted'}`}>
                  {row.isEmpty ? '' : (row.signup!.email ?? '—')}
                </td>
                {!isSimple && (
                  <td className={`px-4 py-3 text-sm font-body ${row.isEmpty ? 'text-muted' : 'text-muted'}`}>
                    {row.time ?? ''}
                  </td>
                )}
                <td className={`px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-muted'}`}>
                  {row.isEmpty ? '' : (row.signup!.comment ?? '—')}
                </td>
                <td className={`px-4 py-3 text-sm ${row.isEmpty ? 'text-muted' : 'text-muted'}`}>
                  {row.isEmpty ? '' : row.signup!.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddSignupModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        preselectedSlot={addModalPreselected}
        slots={slots}
        isSimple={isSimple}
        onAdded={handleAdded}
      />
    </>
  );
}
