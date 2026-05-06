'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { CoverageMeter } from '@/components/CoverageMeter';

/** Full-width stacked on mobile; from md up, right-aligned row using half the card, two equal buttons. */
const CARD_ACTION_ROW =
  'mt-5 flex w-full justify-end';
const CARD_ACTION_GRID =
  'grid w-full grid-cols-1 gap-3 md:w-1/2 md:grid-cols-2 md:gap-4';

type EventCardProps = {
  event: {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    signup_type: 'scheduled' | 'simple';
    published: boolean;
    archived: boolean;
  };
  dateLabel: string;
  coverage: { filled: number; total: number; percentage: number };
  signupPageUrl: string;
};

export type EventCardData = {
  event: EventCardProps['event'];
  dateLabel: string;
  coverage: EventCardProps['coverage'];
  signupPageUrl: string;
};

export function EventCard({ event, dateLabel, coverage, signupPageUrl }: EventCardProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

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

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopy = async () => {
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/events/${event.id}/copy`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to copy signup');
      const { eventId } = (await res.json()) as { eventId?: string };
      if (!eventId) throw new Error('Failed to copy signup');
      router.push(`/dashboard/event/${eventId}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not copy signup');
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/events/${event.id}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/events/${event.id}/unarchive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unarchive');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <li className="rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft sm:p-6">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-charcoal font-heading">{event.title}</h2>
              {!event.published && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 font-body">
                  Draft
                </span>
              )}
              {event.archived && (
                <span className="inline-flex items-center rounded-full bg-charcoal/10 px-2.5 py-0.5 text-xs font-medium text-charcoal/60 font-body">
                  Archived
                </span>
              )}
            </div>
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
              <MoreVertical size={18} strokeWidth={2} aria-hidden />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-48 min-w-[12rem] rounded-xl border border-charcoal/15 bg-surface py-1 shadow-soft-md"
              >
                {event.archived ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleUnarchive();
                    }}
                    disabled={isArchiving}
                  >
                    {isArchiving ? 'Unarchiving…' : 'Unarchive'}
                  </button>
                ) : (
                  <>
                    {!event.published ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
                        onClick={() => {
                          setMenuOpen(false);
                          void handlePublish();
                        }}
                        disabled={isPublishing}
                      >
                        {isPublishing ? 'Publishing…' : 'Publish'}
                      </button>
                    ) : null}
                    <Link
                      href={`/dashboard/event/${event.id}/edit`}
                      role="menuitem"
                      className="block rounded-lg px-3 py-2.5 text-sm text-charcoal hover:bg-charcoal/5 font-body"
                      onClick={() => setMenuOpen(false)}
                    >
                      Edit
                    </Link>
                    {event.published ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
                        onClick={() => void handleCopy()}
                      >
                        Copy
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-coral hover:bg-coral/5 font-body"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmArchiveOpen(true);
                      }}
                    >
                      Archive
                    </button>
                  </>
                )}
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

      {event.archived ? (
        <div className={CARD_ACTION_ROW}>
          <Link href={`/dashboard/event/${event.id}/signups`} className="btn-primary text-center">
            View My Signups
          </Link>
        </div>
      ) : !event.published ? (
        <div className={CARD_ACTION_ROW}>
          <div className={CARD_ACTION_GRID}>
            <Link href={`/dashboard/event/${event.id}/signups`} className="btn-primary w-full text-center">
              View My Signups
            </Link>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={isPublishing}
              className="btn-secondary w-full text-center disabled:opacity-60"
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      ) : (
        <div className={CARD_ACTION_ROW}>
          <div className={CARD_ACTION_GRID}>
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
        </div>
      )}
      {confirmArchiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-soft-md">
            <h2 className="text-base font-semibold text-charcoal font-heading">
              Archive this signup?
            </h2>
            <p className="mt-2 text-sm text-muted font-body">
              This will make it inaccessible for anyone who has the link.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmArchiveOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary bg-coral border-coral hover:bg-coral/90"
                onClick={() => {
                  setConfirmArchiveOpen(false);
                  void handleArchive();
                }}
                disabled={isArchiving}
              >
                {isArchiving ? 'Archiving…' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
