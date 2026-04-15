'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { AddSignupModal } from './AddSignupModal';
import { DeleteSignupModal } from './DeleteSignupModal';
import { DEFAULT_COMMENT_LABEL, normalizeCommentLabel } from '@/lib/slot-comment';

type TableRow = {
  slotId: string;
  role: string;
  dateAndTime: string | null;
  isEmpty: boolean;
  signup?: {
    id: string;
    name: string;
    email: string | null;
    comment: string | null;
    comment_label: string;
    createdAt: string;
    source: 'volunteer' | 'organizer';
  };
};

interface SignupsTableProps {
  rows: TableRow[];
  slots: {
    id: string;
    role_name: string;
    comment_label: string;
    comment_required: boolean;
  }[];
  isSimple: boolean;
}

/** Split organizer date/time display: first comma, or MM/DD/YYYY vs rest. */
function splitDateAndTimeForTable(
  dateAndTime: string | null
): { datePart: string; timePart: string | null } {
  if (!dateAndTime?.trim()) return { datePart: '', timePart: null };
  const s = dateAndTime.trim();
  const commaIdx = s.indexOf(',');
  if (commaIdx !== -1) {
    const datePart = s.slice(0, commaIdx).trim();
    const rest = s.slice(commaIdx + 1).trim();
    return { datePart, timePart: rest || null };
  }
  const m = /^(\d{2}\/\d{2}\/\d{4})(?:\s+(.+))?$/.exec(s);
  if (m) {
    return { datePart: m[1], timePart: m[2]?.trim() || null };
  }
  return { datePart: s, timePart: null };
}

export function SignupsTable({ rows, slots, isSimple }: SignupsTableProps) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPreselected, setAddModalPreselected] = useState<{
    id: string;
    role_name: string;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    signupId: string;
    name: string;
    role: string;
  } | null>(null);

  const handleAddClick = (slotId: string, role: string) => {
    setAddModalPreselected({ id: slotId, role_name: role });
    setAddModalOpen(true);
  };

  const handleAdded = () => {
    router.refresh();
  };

  const openDeleteModal = (signupId: string, name: string, role: string) => {
    setDeleteTarget({ signupId, name, role });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const label = isSimple ? 'Item' : 'Spot';

  return (
    <>
      <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-surface shadow-soft">
        <table className="min-w-full divide-y divide-charcoal/10">
          <thead>
            <tr>
              <th className="align-top px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                {label}
              </th>
              {!isSimple && (
                <th className="align-top px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                  Date &amp; Time
                </th>
              )}
              <th className="align-top px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Name
              </th>
              <th className="align-top px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Email
              </th>
              <th className="align-top px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Comment
              </th>
              <th className="align-top px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
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
                <td className={`align-top px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
                  {row.role}
                </td>
                {!isSimple && (
                  <td
                    className={`align-top px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}
                  >
                    {(() => {
                      const { datePart, timePart } = splitDateAndTimeForTable(
                        row.dateAndTime
                      );
                      if (!datePart && !timePart) return '';
                      if (!timePart) {
                        return <span className="block">{datePart}</span>;
                      }
                      return (
                        <>
                          <span className="block">{datePart}</span>
                          <span className="block text-muted">{timePart}</span>
                        </>
                      );
                    })()}
                  </td>
                )}
                <td className={`align-top px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
                  {row.isEmpty ? (
                    <button
                      type="button"
                      onClick={() => handleAddClick(row.slotId, row.role)}
                      className="text-sage hover:text-sage-hover font-medium focus:outline-none focus:underline"
                    >
                      + Add
                    </button>
                  ) : (
                    row.signup!.name
                  )}
                </td>
                <td className={`align-top px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-muted'}`}>
                  {row.isEmpty ? '' : (row.signup!.email ?? '—')}
                </td>
                <td className={`align-top px-4 py-3 text-sm font-body break-words ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
                  {row.isEmpty ? (
                    ''
                  ) : (
                    (() => {
                      const lbl = normalizeCommentLabel(row.signup!.comment_label);
                      const text = row.signup!.comment?.trim();
                      const custom = lbl !== DEFAULT_COMMENT_LABEL;
                      if (!text && !custom) return '—';
                      if (!text) return <span className="text-muted">—</span>;
                      if (!custom) return text;
                      return (
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted font-body">
                            {lbl}
                          </p>
                          <p className="text-sm text-charcoal font-body whitespace-pre-wrap">{text}</p>
                        </div>
                      );
                    })()
                  )}
                </td>
                <td className={`align-top px-4 py-3 text-sm ${row.isEmpty ? 'text-muted' : 'text-muted'}`}>
                  {row.isEmpty ? (
                    ''
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="block font-body">{row.signup!.createdAt}</span>
                        {row.signup!.source === 'organizer' && (
                          <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded bg-charcoal/10 text-muted font-body">
                            by organizer
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openDeleteModal(
                            row.signup!.id,
                            row.signup!.name,
                            row.role
                          )
                        }
                        className="inline-flex shrink-0 items-center justify-center rounded p-1 text-charcoal/65 hover:text-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
                        aria-label={`Remove ${row.signup!.name} from ${row.role}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden strokeWidth={2} />
                      </button>
                    </div>
                  )}
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

      <DeleteSignupModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        target={deleteTarget}
        onRemoved={() => router.refresh()}
      />
    </>
  );
}
