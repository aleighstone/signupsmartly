import type { CSSProperties } from 'react';
import { formatEventDateRange } from '@/lib/calendar';
import type { Event } from '@/types/database';

interface EventHeaderProps {
  event: Event;
  /** Public signup page: heading font from CSS variable (inline only; no Tailwind font class). */
  titleStyle?: CSSProperties;
}

export function EventHeader({ event, titleStyle }: EventHeaderProps) {
  const dateRange = formatEventDateRange(event.start_date, event.end_date);

  return (
    <header className="space-y-2">
      <h1
        style={titleStyle}
        className={`text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl ${titleStyle ? '' : 'font-heading'}`}
      >
        {event.title}
      </h1>
      <dl className="flex flex-col gap-1 text-muted font-body">
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
        <p className="text-muted text-sm leading-relaxed max-w-2xl font-body">
          {event.description}
        </p>
      )}
    </header>
  );
}
