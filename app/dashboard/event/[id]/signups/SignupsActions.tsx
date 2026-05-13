'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePostHog } from '@posthog/react';
import { format } from 'date-fns';
import { ChevronDown, Copy, Pencil } from 'lucide-react';
import type { EventWithSlots, Slot } from '@/types/database';
import { formatTimeRange } from '@/lib/calendar';
import { formatCommentForExport } from '@/lib/slot-comment';

interface SignupsActionsProps {
  event: EventWithSlots;
  rows: {
    role: string;
    name: string;
    email: string;
    dateAndTime: string | null;
    comment: string | null;
    comment_label: string;
    createdAt: string;
    source: 'volunteer' | 'organizer';
  }[];
  isSimple: boolean;
  eventId: string;
  signupPageUrl: string;
}

const secondaryButtonClass =
  'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[10px] border-2 border-charcoal bg-transparent px-[18px] py-[9px] text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5 font-body';

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
      lines.push(
        `${format(toLocalDate(startDatePart), 'MMMM d, yyyy')} – ${format(toLocalDate(endDatePart!), 'MMMM d, yyyy')}`
      );
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
      const note = signup ? formatCommentForExport(slot.comment_label, signup.comment) : '';
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
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCopyToast) return;
    const t = setTimeout(() => setShowCopyToast(false), 2200);
    return () => clearTimeout(t);
  }, [showCopyToast]);

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
    : ['Spot', 'Date & Time', 'Name', 'Email', 'Comment', 'Signup Timestamp', 'Source'];

  const csvRows = rows.map((r) => {
    const commentCell = formatCommentForExport(r.comment_label, r.comment);
    return isSimple
      ? [r.role, r.name, r.email, commentCell, r.createdAt, r.source]
      : [r.role, r.dateAndTime || '', r.name, r.email, commentCell, r.createdAt, r.source];
  });

  const csvContent = [csvHeaders, ...csvRows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const exportListText = buildExportListText(event, isSimple);

  const exportCsv = () => {
    setShowExportDropdown(false);
    posthog?.capture('csv_exported', { signup_type: event.signup_type, total_signups: rows.length });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}-signups.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportList = () => {
    setShowExportDropdown(false);
    posthog?.capture('export_list_opened', { event_id: eventId });
    const blob = new Blob([exportListText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}-signups-list.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!signupPageUrl) return;
    await navigator.clipboard.writeText(signupPageUrl);
    setShowCopyToast(true);
    posthog?.capture('signup_link_copied', { event_id: eventId });
  };

  const handlePrint = () => {
    setShowExportDropdown(false);
    posthog?.capture('signups_printed', { event_id: eventId, total_signups: rows.length });
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
  .nps-btn { display: none !important; }
  * { box-shadow: none !important; background-color: transparent !important; }
  body { font-size: 12pt; }
  tr { page-break-inside: avoid; }
}
`,
        }}
      />

      <div data-no-print className="flex flex-row flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[10px] border-2 border-transparent bg-sage px-[18px] py-[9px] text-sm font-semibold text-white transition-colors hover:bg-sage-hover font-body"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copy Public URL
        </button>

        <Link href={`/dashboard/event/${eventId}/edit`} className={secondaryButtonClass + ' no-underline'}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Link>

        <div className="relative" ref={exportDropdownRef}>
          <button
            type="button"
            onClick={() => setShowExportDropdown((v) => !v)}
            className={secondaryButtonClass}
            aria-expanded={showExportDropdown}
            aria-haspopup="menu"
          >
            Export
            <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />
          </button>
          {showExportDropdown ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] rounded-xl border border-charcoal/10 bg-surface py-1 shadow-soft-md"
            >
              <button
                type="button"
                role="menuitem"
                onClick={exportCsv}
                className="block w-full px-[14px] py-[10px] text-left text-[13px] font-medium text-charcoal hover:bg-charcoal/5 font-body"
              >
                Export CSV
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={exportList}
                className="block w-full px-[14px] py-[10px] text-left text-[13px] font-medium text-charcoal hover:bg-charcoal/5 font-body"
              >
                Export List
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handlePrint}
                className="block w-full px-[14px] py-[10px] text-left text-[13px] font-medium text-charcoal hover:bg-charcoal/5 font-body"
              >
                Print
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-[10px] bg-charcoal px-[18px] py-[10px] text-[13px] font-medium text-white transition-all duration-200 ${
          showCopyToast
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
        role="status"
        aria-live="polite"
      >
        Public URL copied!
      </div>
    </>
  );
}
