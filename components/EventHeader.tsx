import type { CSSProperties } from 'react';
import { formatEventDateRange } from '@/lib/calendar';
import type { Event } from '@/types/database';
import { MarkdownBody } from '@/components/MarkdownBody';

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
      <dl className="flex flex-col gap-1 font-body">
        {dateRange && (
          <div>
            <dt className="sr-only">Date</dt>
            <dd className="text-base font-semibold text-charcoal leading-tight">{dateRange}</dd>
          </div>
        )}
        {event.location && (
          <div>
            <dt className="sr-only">Location</dt>
            <dd className="text-sm font-medium text-charcoal">{event.location}</dd>
          </div>
        )}
      </dl>
      {event.description && (
        <div className="text-muted text-sm leading-relaxed font-body prose prose-sm max-w-none prose-p:text-muted prose-li:text-muted prose-headings:text-charcoal prose-strong:text-charcoal">
          <MarkdownBody markdown={event.description} />
        </div>
      )}
    </header>
  );
}
