'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePostHog } from '@posthog/react';
import { format } from 'date-fns';
import type { EventWithSlots, Slot } from '@/types/database';
import { formatTimeRange } from '@/lib/calendar';
import { formatCommentForExport } from '@/lib/slot-comment';

interface SignupsActionsProps {
  event: EventWithSlots;
  rows: {
    role: string;
    name: string;
    email: string;
    time: string | null;
    comment: string | null;
    comment_label: string;
    createdAt: string;
    source: 'volunteer' | 'organizer';
  }[];
  isSimple: boolean;
  eventId: string;
  signupPageUrl: string;
}

const buttonClass =
  'rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body';

function formatSlotDateTime(slot: Slot): string {
  if (!slot.start_time) return '';
  const start = new Date(slot.start_time);
  const dateStr = format(start, 'MMMM d, yyyy');
  const timeStr = formatTimeRange(slot.start_time, slot.end_time);
  return timeStr && timeStr !== 'All day' ? `${dateStr} ${timeStr}` : dateStr;
}

function buildExportListText(event: EventWithSlots, isSimple: boolean): string {
  const lines: string[] = [];

  lines.push(event.title);

  if (event.start_date) {
    const startDatePart = event.start_date.slice(0, 10);
    const endDatePart = event.end_date?.slice(0, 10);
    const sameDay = !endDatePart || startDatePart === endDatePart;
    const toLocalDate = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    if (sameDay) {
      lines.push(format(toLocalDate(startDatePart), 'EEEE, MMMM d, yyyy'));
    } else {
      lines.push(`${format(toLocalDate(startDatePart), 'MMMM d, yyyy')} – ${format(toLocalDate(endDatePart!), 'MMMM d, yyyy')}`);
    }
  }

  if (event.location) lines.push(event.location);
  if (event.description?.trim()) lines.push(event.description.trim());

  lines.push('');

  const eventSpansMultipleDays = (() => {
    if (!event.start_date || !event.end_date) return false;
    const startPart = event.start_date.slice(0, 10);
    const endPart = event.end_date.slice(0, 10);
    return startPart !== endPart;
  })();

  const slots = [...event.slots];
  if (isSimple) {
    slots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else {
    slots.sort((a, b) => {
      const aStart = a.start_time ? new Date(a.start_time).getTime() : 0;
      const bStart = b.start_time ? new Date(b.start_time).getTime() : 0;
      return aStart - bStart;
    });
  }

  for (const slot of slots) {
    lines.push(slot.role_name);

    if (eventSpansMultipleDays && !isSimple && slot.start_time) {
      const dt = formatSlotDateTime(slot);
      if (dt) lines.push(dt);
    }

    if (slot.instructions?.trim()) lines.push(slot.instructions.trim());

    for (let i = 1; i <= slot.capacity; i++) {
      const signup = slot.signups[i - 1];
      const namePart = `${i}. ${signup?.name ?? ''}`;
      const note = signup
        ? formatCommentForExport(slot.comment_label, signup.comment)
        : '';
      lines.push(note ? `${namePart} — ${note}` : namePart);
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function SignupsActions({
  event,
  rows,
  isSimple,
  eventId,
  signupPageUrl,
}: SignupsActionsProps) {
  const posthog = usePostHog();
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showExportListModal, setShowExportListModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [listCopied, setListCopied] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!copied && !listCopied) return;
    const t = setTimeout(() => {
      setCopied(false);
      setListCopied(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [copied, listCopied]);

  useEffect(() => {
    if (!showExportDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  const csvHeaders = isSimple
    ? ['Item', 'Name', 'Email', 'Comment', 'Signup Timestamp', 'Source']
    : ['Spot', 'Name', 'Email', 'Time', 'Comment', 'Signup Timestamp', 'Source'];

  const csvRows = rows.map((r) => {
    const commentCell = formatCommentForExport(r.comment_label, r.comment);
    return isSimple
      ? [r.role, r.name, r.email, commentCell, r.createdAt, r.source]
      : [r.role, r.name, r.email, r.time || '', commentCell, r.createdAt, r.source];
  });

  const csvContent = [csvHeaders, ...csvRows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const exportListText = buildExportListText(event, isSimple);

  const exportCsv = () => {
    setShowExportDropdown(false);
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

  const openExportListModal = () => {
    setShowExportDropdown(false);
    setShowExportListModal(true);
    if (posthog) {
      posthog.capture('export_list_opened', { event_id: eventId });
    }
  };

  const handleCopyList = async () => {
    await navigator.clipboard.writeText(exportListText);
    setListCopied(true);
    if (posthog) {
      posthog.capture('export_list_copied', { event_id: eventId });
    }
  };

  const signupUrl = signupPageUrl;

  const handleCopy = async () => {
    if (!signupUrl) return;
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    if (posthog) {
      posthog.capture('signup_link_copied', { event_id: eventId });
    }
  };

  const handlePrint = () => {
    setShowExportDropdown(false);
    if (posthog) {
      posthog.capture('signups_printed', {
        event_id: eventId,
        total_signups: rows.length,
      });
    }
    window.print();
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  header,
  nav,
  [data-no-print],
  .nps-btn {
    display: none !important;
  }
  * {
    box-shadow: none !important;
    background-color: transparent !important;
  }
  body {
    font-size: 12pt;
  }
  tr {
    page-break-inside: avoid;
  }
}
`,
        }}
      />
      <div data-no-print className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowCopyModal(true)}
          className={buttonClass}
        >
          Copy Signup URL
        </button>
        <Link href={`/dashboard/event/${eventId}/edit`} className={buttonClass + ' text-center no-underline'}>
          Edit Event
        </Link>
        <div className="relative" ref={exportDropdownRef}>
          <button
            type="button"
            onClick={() => setShowExportDropdown((v) => !v)}
            className={buttonClass + ' w-full flex items-center justify-center gap-2'}
            aria-expanded={showExportDropdown}
            aria-haspopup="true"
          >
            Export
            <svg
              className={`shrink-0 text-muted transition-transform duration-200 ${
                showExportDropdown ? 'rotate-180' : ''
              }`}
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showExportDropdown && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-charcoal/10 bg-surface py-1 shadow-soft-md">
              <button
                type="button"
                onClick={exportCsv}
                className="block w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={openExportListModal}
                className="block w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
              >
                Export List
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="block w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
              >
                Print
              </button>
            </div>
          )}
        </div>
      </div>

      {showCopyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="copy-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCopyModal(false)}
            aria-hidden="true"
          />
          <div
            className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className="absolute right-4 top-4 text-xl leading-none text-muted hover:text-charcoal"
              aria-label="Close"
            >
              ✕
            </button>
            <h2
              id="copy-modal-title"
              className="font-heading text-lg font-semibold text-charcoal"
            >
              Copy Signup Link
            </h2>
            <p className="mt-1 text-sm text-muted font-body">
              Share this link with your volunteers.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={signupUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 select-all rounded-xl border border-charcoal/20 bg-surface px-3 py-2 text-sm text-charcoal font-body"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white font-body hover:bg-sage/90 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportListModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-list-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowExportListModal(false)}
            aria-hidden="true"
          />
          <div
            className="relative mx-4 w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-charcoal/10">
              <h2
                id="export-list-modal-title"
                className="font-heading text-lg font-semibold text-charcoal"
              >
                Export List
              </h2>
              <button
                type="button"
                onClick={() => setShowExportListModal(false)}
                className="text-xl leading-none text-muted hover:text-charcoal"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre
                className="whitespace-pre-wrap font-body text-sm text-charcoal bg-sand/30 rounded-xl p-4"
                style={{ fontFamily: 'inherit' }}
              >
                {exportListText}
              </pre>
            </div>
            <div className="p-4 border-t border-charcoal/10">
              <button
                type="button"
                onClick={handleCopyList}
                className="rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white font-body hover:bg-sage/90 transition-colors"
              >
                {listCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
