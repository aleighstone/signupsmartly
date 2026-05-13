'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, MoreVertical, Pencil } from 'lucide-react';

export type EventCardData = {
  event: {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    signup_type: 'scheduled' | 'simple' | 'availability';
    published: boolean;
    archived: boolean;
  };
  dateLabel: string;
  coverage: { filled: number; total: number; percentage: number };
  availabilityStats?: { responses: number; people: number };
  signupPageUrl: string;
};

type Props = { activeCards: EventCardData[]; archivedCards: EventCardData[] };
type Tab = 'active' | 'archived';
type SortCol = 'event' | 'date' | null;
type SortDir = 'asc' | 'desc' | null;

const SORT_STORAGE_KEY = 'dashboard-signups-sort-v1';

function pctLabel(filled: number, total: number) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return `${filled}/${total} · ${pct}%`;
}

function SortIndicator({ activeDir }: { activeDir: SortDir }) {
  if (!activeDir) return <ArrowUpDown size={12} className="opacity-35" aria-hidden />;
  if (activeDir === 'asc') return <ArrowUp size={12} aria-hidden />;
  return <ArrowDown size={12} aria-hidden />;
}

function MoreMenu({ card }: { card: EventCardData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { event } = card;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target || !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handlePublish = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}/copy`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to copy signup');
      const { eventId } = (await res.json()) as { eventId?: string };
      if (!eventId) throw new Error('Failed to copy signup');
      setOpen(false);
      router.push(`/dashboard/event/${eventId}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not copy signup');
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    const ok = window.confirm('Archive this signup? This will disable its public signup page.');
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive');
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Delete this signup permanently? This cannot be undone.');
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] border-2 border-charcoal/20 bg-surface text-charcoal hover:bg-charcoal/5"
        aria-label="More actions for this signup"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical size={16} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[180px] rounded-xl border border-charcoal/10 bg-surface py-1 shadow-soft-md"
        >
          {!event.published ? (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-charcoal hover:bg-charcoal/5 font-body"
              onClick={() => void handlePublish()}
              disabled={busy}
            >
              {busy ? 'Publishing...' : 'Publish'}
            </button>
          ) : null}
          <Link
            href={`/dashboard/event/${event.id}/edit`}
            role="menuitem"
            className="block px-3.5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 font-body"
            onClick={() => setOpen(false)}
          >
            Edit signup
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-charcoal hover:bg-charcoal/5 font-body"
            onClick={() => void handleCopy()}
            disabled={busy}
          >
            Copy signup
          </button>
          <Link
            href={`/dashboard/event/${event.id}/signups`}
            role="menuitem"
            className="block px-3.5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 font-body"
            onClick={() => setOpen(false)}
          >
            View my signups
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-charcoal hover:bg-charcoal/5 font-body"
            onClick={() => void handleArchive()}
            disabled={busy}
          >
            {busy ? 'Archiving...' : 'Archive'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-coral hover:bg-charcoal/5 font-body"
            onClick={() => void handleDelete()}
            disabled={busy}
          >
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardEventList({ activeCards, archivedCards }: Props) {
  const [tab, setTab] = useState<Tab>('active');
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const hasArchived = archivedCards.length > 0;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { sortCol?: SortCol; sortDir?: SortDir };
      if (
        (parsed.sortCol === 'event' || parsed.sortCol === 'date' || parsed.sortCol === null) &&
        (parsed.sortDir === 'asc' || parsed.sortDir === 'desc' || parsed.sortDir === null)
      ) {
        setSortCol(parsed.sortCol ?? null);
        setSortDir(parsed.sortDir ?? null);
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ sortCol, sortDir }));
    } catch {
      // ignore storage failures
    }
  }, [sortCol, sortDir]);

  const cards = tab === 'active' ? activeCards : archivedCards;
  const sortedCards = useMemo(() => {
    if (!sortCol || !sortDir) return cards;
    const out = [...cards];
    out.sort((a, b) => {
      if (sortCol === 'event') {
        const av = a.event.title.toLowerCase();
        const bv = b.event.title.toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }
      const av = a.event.start_date ?? 'zzz';
      const bv = b.event.start_date ?? 'zzz';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return out;
  }, [cards, sortCol, sortDir]);

  const toggleSort = (col: Exclude<SortCol, null>) => {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir('asc');
      return;
    }
    if (sortDir === 'asc') {
      setSortDir('desc');
      return;
    }
    setSortCol(null);
    setSortDir(null);
  };

  return (
    <div className="space-y-4">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-[22px] font-semibold text-charcoal font-heading">Your Signups</h1>
          {hasArchived ? (
            <div className="inline-flex items-center gap-[2px] rounded-[10px] bg-charcoal/7 p-[3px]">
              {(['active', 'archived'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-[8px] px-[14px] py-[6px] text-[13px] font-semibold leading-none transition-colors font-body ${
                    tab === t
                      ? 'bg-surface text-charcoal shadow-[0_1px_3px_rgba(0,0,0,0.10)]'
                      : 'bg-transparent text-muted'
                  }`}
                >
                  {t === 'active' ? 'Active' : 'Archived'}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hidden md:block">
          {tab === 'active' ? (
            <Link
              href="/create-event"
              className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] border-2 border-transparent bg-sage px-[18px] py-[9px] text-sm font-semibold text-white transition-colors hover:bg-sage-hover font-body"
            >
              + Create Signup
            </Link>
          ) : (
            <span
              className="invisible inline-flex min-h-[40px] items-center justify-center rounded-[10px] border-2 border-transparent bg-sage px-[18px] py-[9px] text-sm font-semibold text-white font-body"
              aria-hidden="true"
            >
              + Create Signup
            </span>
          )}
        </div>
      </div>

      {sortedCards.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
          <p className="text-muted font-body">
            {tab === 'active' ? 'No active signups.' : 'No archived signups.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-xl border border-charcoal/10 bg-surface shadow-soft md:block">
            <div className="flex items-center gap-5 border-b border-charcoal/10 bg-charcoal/[0.02] px-5 py-2.5">
              <div className="basis-[280px] shrink-0 grow-0">
                <button
                  type="button"
                  onClick={() => toggleSort('event')}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] font-body ${
                    sortCol === 'event' ? 'text-charcoal' : 'text-muted'
                  }`}
                >
                  Event <SortIndicator activeDir={sortCol === 'event' ? sortDir : null} />
                </button>
              </div>
              <div className="basis-[140px] shrink-0 grow-0">
                <button
                  type="button"
                  onClick={() => toggleSort('date')}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] font-body ${
                    sortCol === 'date' ? 'text-charcoal' : 'text-muted'
                  }`}
                >
                  Date <SortIndicator activeDir={sortCol === 'date' ? sortDir : null} />
                </button>
              </div>
              <div className="flex-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                Coverage
              </div>
              <div className="w-[122px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted font-body">
                Actions
              </div>
            </div>

            {sortedCards.map((card) => {
              const isSignupPageEnabled = card.event.published;
              const isAvailability = card.event.signup_type === 'availability';
              return (
                <div
                  key={card.event.id}
                  className="flex items-center gap-5 border-b border-charcoal/10 bg-surface px-5 py-3.5 last:border-b-0 hover:bg-charcoal/[0.015]"
                >
                  <div className="basis-[280px] shrink-0 grow-0 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/event/${card.event.id}/signups`}
                        className="overflow-hidden text-sm font-semibold leading-[1.4] text-charcoal no-underline underline-offset-2 hover:underline font-heading [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                      >
                        {card.event.title}
                      </Link>
                      {!card.event.published ? (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280] font-body">
                          Draft
                        </span>
                      ) : null}
                      {card.event.archived ? (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-charcoal/10 px-2 py-0.5 text-[11px] font-semibold text-charcoal/60 font-body">
                          Archived
                        </span>
                      ) : null}
                      {isAvailability ? (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-sage/10 px-2 py-0.5 text-[11px] font-semibold text-sage font-body">
                          Poll
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="basis-[140px] shrink-0 grow-0">
                    <span className={`text-[13px] font-body ${card.event.start_date ? 'text-charcoal' : 'text-muted'}`}>
                      {card.event.start_date ? card.dateLabel : '—'}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-2.5">
                    {isAvailability ? (
                      <span className="text-xs text-muted font-body">
                        {card.availabilityStats?.responses ?? 0} responses · {card.availabilityStats?.people ?? 0} people
                      </span>
                    ) : (
                      <>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal/10">
                          <div
                            className="h-full rounded-full bg-sage"
                            style={{ width: `${card.coverage.percentage}%` }}
                          />
                        </div>
                        <span className="w-20 whitespace-nowrap text-right text-xs text-muted font-body">
                          {pctLabel(card.coverage.filled, card.coverage.total)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="w-[122px]">
                    <div className="flex items-center gap-1.5">
                      {isSignupPageEnabled ? (
                        <a
                          href={card.signupPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Signup Page"
                          aria-label="Signup Page"
                          className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-charcoal/20 bg-surface text-charcoal"
                        >
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Not yet published"
                          aria-label="Not yet published"
                          className="inline-flex h-[34px] w-[34px] cursor-not-allowed items-center justify-center rounded-[8px] border border-charcoal/[0.08] bg-charcoal/[0.03] text-charcoal/[0.25]"
                        >
                          <ExternalLink size={14} />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/event/${card.event.id}/edit`}
                        title="Edit signup"
                        aria-label="Edit signup"
                        className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-charcoal/20 bg-surface text-charcoal"
                      >
                        <Pencil size={14} />
                      </Link>
                      <MoreMenu card={card} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <ul className="space-y-3 md:hidden">
            {sortedCards.map((card) => {
              const isSignupPageEnabled = card.event.published;
              const isAvailability = card.event.signup_type === 'availability';
              return (
                <li
                  key={card.event.id}
                  className="rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft"
                >
                  <div className="mb-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/dashboard/event/${card.event.id}/signups`}
                          className="overflow-hidden text-[15px] font-semibold leading-[1.4] text-charcoal no-underline underline-offset-2 hover:underline font-heading [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                        >
                          {card.event.title}
                        </Link>
                        {!card.event.published ? (
                          <span className="inline-flex items-center rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280] font-body">
                            Draft
                          </span>
                        ) : null}
                        {card.event.archived ? (
                          <span className="inline-flex items-center rounded-full bg-charcoal/10 px-2 py-0.5 text-[11px] font-semibold text-charcoal/60 font-body">
                            Archived
                          </span>
                        ) : null}
                        {isAvailability ? (
                          <span className="inline-flex items-center rounded-full bg-sage/10 px-2 py-0.5 text-[11px] font-semibold text-sage font-body">
                            Poll
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted font-body">
                        {card.event.start_date ? card.dateLabel : '—'}
                      </p>
                    </div>
                    <MoreMenu card={card} />
                  </div>

                  {isAvailability ? (
                    <p className="text-xs text-muted font-body">
                      {card.availabilityStats?.responses ?? 0} responses · {card.availabilityStats?.people ?? 0} people
                    </p>
                  ) : (
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-body">
                        <span className="font-medium text-charcoal">Coverage</span>
                        <span className="text-muted">{pctLabel(card.coverage.filled, card.coverage.total)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/10">
                        <div
                          className="h-full rounded-full bg-sage"
                          style={{ width: `${card.coverage.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3.5 flex gap-2">
                    <Link
                      href={`/dashboard/event/${card.event.id}/signups`}
                      className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] border-2 border-transparent bg-sage px-[14px] py-2 text-[13px] font-semibold text-white transition-colors hover:bg-sage-hover font-body"
                    >
                      View Signups
                    </Link>
                    {isSignupPageEnabled ? (
                      <a
                        href={card.signupPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] border-2 border-charcoal bg-transparent px-[14px] py-2 text-[13px] font-medium text-charcoal transition-colors hover:bg-charcoal/5 font-body"
                      >
                        Signup Page
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-[40px] w-full cursor-not-allowed items-center justify-center rounded-[10px] border-2 border-charcoal bg-transparent px-[14px] py-2 text-[13px] font-medium text-charcoal opacity-50 font-body"
                        title="Not yet published"
                      >
                        Signup Page
                      </button>
                    )}
                    <Link
                      href={`/dashboard/event/${card.event.id}/edit`}
                      aria-label="Edit signup"
                      title="Edit signup"
                      className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] border border-charcoal/20 bg-surface text-charcoal"
                    >
                      <Pencil size={14} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
