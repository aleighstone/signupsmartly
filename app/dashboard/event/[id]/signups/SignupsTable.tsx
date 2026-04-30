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
      <div className="mb-6 mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-surface shadow-soft">
        <table className="min-w-full divide-y divide-charcoal/10">
          <thead>
            <tr className="bg-charcoal/[0.02]">
              <th className="align-top px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                {label}
              </th>
              {!isSimple && (
                <th className="align-top px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                  Date &amp; Time
                </th>
              )}
              <th className="align-top px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                Name
              </th>
              <th className="align-top px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                Email
              </th>
              <th className="align-top px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                Comment
              </th>
              <th className="align-top px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                Signup Timestamp
              </th>
              <th className="w-10 px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/10">
            {rows.map((row, i) => (
              <tr
                key={row.isEmpty ? `empty-${row.slotId}-${i}` : `signup-${row.signup!.id}`}
                className={row.isEmpty ? 'bg-charcoal/[0.02]' : 'hover:bg-charcoal/[0.015]'}
              >
                <td className={`align-top px-5 py-3.5 text-[13px] leading-[1.45] font-body ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
                  {row.role}
                </td>
                {!isSimple && (
                  <td
                    className={`align-top px-5 py-3.5 text-[13px] leading-[1.45] font-body whitespace-pre-line ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}
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
                <td className={`align-top px-5 py-3.5 text-[13px] leading-[1.45] font-body ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
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
                <td className="max-w-0 align-top px-5 py-3.5 text-[13px] leading-[1.45] font-body text-muted">
                  {row.isEmpty ? (
                    ''
                  ) : row.signup!.email ? (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                      {row.signup!.email}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={`align-top px-5 py-3.5 text-[13px] leading-[1.45] font-body ${row.isEmpty ? 'text-muted' : 'text-charcoal'}`}>
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
                <td className={`align-top px-5 py-3.5 text-[13px] leading-[1.45] text-muted`}>
                  {row.isEmpty ? (
                    ''
                  ) : (
                    <div className="min-w-0">
                      <span className="block whitespace-pre-line font-body">{row.signup!.createdAt}</span>
                        {row.signup!.source === 'organizer' && (
                        <span className="mt-1 inline-block rounded-[6px] bg-charcoal/[0.07] px-[7px] py-[2px] text-[11px] font-medium text-muted font-body">
                            by organizer
                          </span>
                        )}
                    </div>
                  )}
                </td>
                <td className="align-top px-5 py-3.5">
                  {row.isEmpty ? null : (
                    <div className="flex items-center justify-center pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          openDeleteModal(
                            row.signup!.id,
                            row.signup!.name,
                            row.role
                          )
                        }
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-charcoal/[0.15] bg-transparent text-muted transition-colors hover:border-coral/30 hover:bg-coral/5 hover:text-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
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
