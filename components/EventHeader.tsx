import { formatEventDateRange } from '@/lib/calendar';
import type { Event } from '@/types/database';

interface EventHeaderProps {
  event: Event;
}

export function EventHeader({ event }: EventHeaderProps) {
  const dateRange = formatEventDateRange(event.start_date, event.end_date);

  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        {event.title}
      </h1>
      <dl className="flex flex-col gap-1 text-neutral-600">
        <div>
          <dt className="sr-only">Date</dt>
          <dd>{dateRange}</dd>
        </div>
        {event.location && (
          <div>
            <dt className="sr-only">Location</dt>
            <dd>{event.location}</dd>
          </div>
        )}
      </dl>
      {event.description && (
        <p className="text-neutral-600 text-sm leading-relaxed max-w-2xl">
          {event.description}
        </p>
      )}
    </header>
  );
}
