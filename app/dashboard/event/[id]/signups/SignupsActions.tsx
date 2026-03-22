'use client';

import { useState, useEffect } from 'react';
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
  eventId: string;
  signupPageUrl: string;
}

const buttonClass =
  'rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body';

export function SignupsActions({
  event,
  rows,
  isSimple,
  eventId,
  signupPageUrl,
}: SignupsActionsProps) {
  const posthog = usePostHog();
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

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
        <button type="button" onClick={exportCsv} className={buttonClass}>
          Export CSV
        </button>
        <button type="button" onClick={handlePrint} className={buttonClass}>
          Print
        </button>
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
    </>
  );
}
