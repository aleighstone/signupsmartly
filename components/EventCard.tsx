'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CoverageMeter } from '@/components/CoverageMeter';
import { ShareCopyModal } from '@/components/ShareCopyModal';

type PendingTransferCardInfo = {
  id: string;
  recipientEmail: string;
};

type EventCardProps = {
  event: {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    signup_type: 'scheduled' | 'simple';
  };
  dateLabel: string;
  coverage: { filled: number; total: number; percentage: number };
  signupPageUrl: string;
  pendingTransfer?: PendingTransferCardInfo | null;
};

export function EventCard({
  event,
  dateLabel,
  coverage,
  signupPageUrl,
  pendingTransfer,
}: EventCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedNotice) return;
    const timeout = setTimeout(() => setCopiedNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [copiedNotice]);

  const makeCopy = async () => {
    setLoadingCopy(true);
    setInlineError(null);
    try {
      const response = await fetch(`/api/events/${event.id}/copy`, { method: 'POST' });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to copy event');
      router.push(`/dashboard/event/${json.eventId}/edit?copied=1`);
    } catch (e) {
      setInlineError(e instanceof Error ? e.message : 'Failed to copy event');
    } finally {
      setLoadingCopy(false);
      setMenuOpen(false);
    }
  };

  const cancelPendingShare = async () => {
    if (!pendingTransfer) return;
    const confirmed = window.confirm('Cancel this share? The copy will be deleted.');
    if (!confirmed) return;
    setLoadingCancel(true);
    setInlineError(null);
    try {
      const response = await fetch(`/api/pending-transfers/${pendingTransfer.id}`, {
        method: 'DELETE',
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Could not cancel share');
      router.refresh();
    } catch (e) {
      setInlineError(e instanceof Error ? e.message : 'Could not cancel share');
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <>
      <li className="rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-charcoal font-heading">{event.title}</h2>
            <p className="text-sm text-muted font-body">{dateLabel}</p>
            <div className="mt-3 w-72 shrink-0">
              <CoverageMeter
                filled={coverage.filled}
                total={coverage.total}
                percentage={coverage.percentage}
                size="sm"
                signupType={event.signup_type}
              />
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg border border-charcoal/20 px-2 py-1 text-charcoal hover:bg-charcoal/5"
              aria-label="Event actions"
            >
              ⋯
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-charcoal/10 bg-surface p-1 shadow-soft-md">
                <button
                  type="button"
                  onClick={makeCopy}
                  disabled={loadingCopy}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-charcoal hover:bg-charcoal/5"
                >
                  {loadingCopy ? 'Copying...' : 'Make a copy'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShareOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-charcoal hover:bg-charcoal/5"
                >
                  Share a copy
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href={`/dashboard/event/${event.id}/signups`} className="btn-primary">
            View My Signups
          </Link>
          <a
            href={signupPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Signup Page
          </a>
          <Link
            href={`/dashboard/event/${event.id}/edit`}
            className="rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body"
          >
            Edit
          </Link>
        </div>

        {pendingTransfer ? (
          <p className="mt-3 text-sm text-muted font-body">
            📤 Shared copy pending · Sent to {pendingTransfer.recipientEmail} ·{' '}
            <button
              type="button"
              onClick={cancelPendingShare}
              disabled={loadingCancel}
              className="font-medium text-charcoal underline underline-offset-2 hover:no-underline disabled:opacity-60"
            >
              {loadingCancel ? 'Canceling...' : 'Cancel'}
            </button>
          </p>
        ) : null}

        {inlineError ? <p className="mt-3 text-sm text-coral font-body">{inlineError}</p> : null}
      </li>

      <ShareCopyModal
        eventId={event.id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onSuccess={(email) => {
          setCopiedNotice(`A copy has been sent to ${email}. It expires in 14 days if unclaimed.`);
          router.refresh();
        }}
      />

      {copiedNotice ? (
        <div className="fixed bottom-5 right-5 z-[90] max-w-sm rounded-xl border border-charcoal/10 bg-surface px-4 py-3 text-sm text-charcoal shadow-soft-md">
          {copiedNotice}
        </div>
      ) : null}
    </>
  );
}
