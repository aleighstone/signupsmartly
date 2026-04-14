'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CoverageMeter } from '@/components/CoverageMeter';

type EventCardProps = {
  event: {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    signup_type: 'scheduled' | 'simple';
    published: boolean;
  };
  dateLabel: string;
  coverage: { filled: number; total: number; percentage: number };
  signupPageUrl: string;
};

export function EventCard({ event, dateLabel, coverage, signupPageUrl }: EventCardProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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
      router.push(`/dashboard/event/${eventId}/edit?copied=1`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not copy signup');
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
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-48 min-w-[12rem] rounded-xl border border-charcoal/15 bg-surface py-1 shadow-soft-md"
              >
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
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-charcoal/5 font-body"
                  onClick={() => void handleCopy()}
                >
                  Copy signup
                </button>
                <Link
                  href={`/dashboard/event/${event.id}/edit`}
                  role="menuitem"
                  className="block rounded-lg px-3 py-2.5 text-sm text-charcoal hover:bg-charcoal/5 font-body"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit signup
                </Link>
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

      {!event.published ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
      ) : (
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
      )}
    </li>
  );
}
