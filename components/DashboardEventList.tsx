'use client';

import { useState } from 'react';
import { EventCard } from '@/components/EventCard';
import type { EventCardData } from '@/components/EventCard';

type Props = {
  activeCards: EventCardData[];
  archivedCards: EventCardData[];
};

export function DashboardEventList({ activeCards, archivedCards }: Props) {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const cards = tab === 'active' ? activeCards : archivedCards;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-1 rounded-lg border border-charcoal/15 bg-surface p-0.5">
          {(['active', 'archived'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium font-body capitalize transition-colors ${
                tab === t
                  ? 'bg-charcoal text-white shadow-soft'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
          <p className="text-muted font-body">
            {tab === 'active' ? 'No active signups.' : 'No archived signups.'}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {cards.map(({ event, coverage, dateLabel, signupPageUrl }) => (
            <EventCard
              key={event.id}
              event={event}
              dateLabel={dateLabel}
              coverage={coverage}
              signupPageUrl={signupPageUrl}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
