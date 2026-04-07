'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target || !menuRef.current?.contains(target)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

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
      <li className="rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft sm:p-6">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="font-semibold text-charcoal font-heading">{event.title}</h2>
              <p className="mt-0.5 text-sm text-muted font-body">{dateLabel}</p>
            </div>

            <div ref={menuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-charcoal/25 bg-surface text-charcoal shadow-soft transition-colors hover:border-charcoal/40 hover:bg-charcoal/5 focus:outline-none focus:ring-2 focus:ring-sage/35 focus:ring-offset-2"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="More actions for this signup"
                >
                  <span className="sr-only">Open menu</span>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-48 min-w-[12rem] rounded-xl border border-charcoal/15 bg-surface py-1 shadow-soft-md"
                  >
                    <Link
                      href={`/dashboard/event/${event.id}/edit`}
                      role="menuitem"
                      className="block rounded-lg px-3 py-2.5 text-sm text-charcoal hover:bg-charcoal/5 font-body"
                      onClick={() => setMenuOpen(false)}
                    >
                      Edit signup
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={makeCopy}
                      disabled={loadingCopy}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body disabled:opacity-60"
                    >
                      {loadingCopy ? 'Copying…' : 'Make a copy'}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShareOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
                    >
                      Share a copy
                    </button>
                  </div>
                ) : null}
              </div>
          </div>

          <div className="mt-4 w-full">
            <CoverageMeter
              filled={coverage.filled}
              total={coverage.total}
              percentage={coverage.percentage}
              size="sm"
              signupType={event.signup_type}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <Link href={`/dashboard/event/${event.id}/signups`} className="btn-primary w-full text-center">
            View My Signups
          </Link>
          <a
            href={signupPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full text-center"
          >
            Signup Page
          </a>
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
