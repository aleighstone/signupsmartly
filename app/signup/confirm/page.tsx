import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { generateAddToCalendarUrl } from '@/lib/calendar';
import type { Event, Slot } from '@/types/database';
import { formatTimeRange } from '@/lib/calendar';
import { getOrganizationTimezone } from '@/lib/db';
import { TrackSignupSubmitted } from '@/app/providers/PostHogTracker';
import { format } from 'date-fns';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  if (!id) notFound();

  const { data: signup, error } = await supabase
    .from('signups')
    .select(`
      *,
      slots (
        *,
        events (*)
      )
    `)
    .eq('id', id)
    .eq('cancelled', false)
    .single();

  if (error || !signup) notFound();

  type SignupWithRelations = {
    name: string;
    cancel_token: string;
    comment: string | null;
    slots?: unknown;
  };
  const signupTyped = signup as SignupWithRelations;
  const slotData = signupTyped.slots;
  const slot = Array.isArray(slotData) ? slotData[0] : slotData;
  const eventData = slot && (slot as { events?: unknown }).events;
  const event = Array.isArray(eventData) ? eventData[0] : eventData;

  if (!slot || !event) notFound();

  const slotAny = slot as {
    role_name?: string;
    start_time?: string | null;
    end_time?: string | null;
  };
  const eventAny = event as {
    id?: string;
    organization_id?: string;
    title?: string;
    location?: string | null;
    start_date?: string | null;
    signup_type?: 'scheduled' | 'simple';
  };

  const timezone = eventAny.organization_id
    ? await getOrganizationTimezone(eventAny.organization_id)
    : 'America/New_York';

  const calendarUrl = generateAddToCalendarUrl({
    event: eventAny as Event,
    slot: slotAny as Slot,
    volunteerName: signupTyped.name,
  });
  const cancelUrl = `/signup/cancel?token=${signupTyped.cancel_token}`;
  const hasTime = slotAny.start_time && slotAny.end_time;
  const timeRange = hasTime
    ? formatTimeRange(slotAny.start_time || null, slotAny.end_time || null, timezone)
    : null;
  const dateSource = slotAny.start_time || eventAny.start_date || null;
  const dateText = dateSource
    ? format(new Date(dateSource), 'EEEE, MMMM d, yyyy')
    : null;
  const eventId = eventAny.id;
  const isSimple = eventAny.signup_type === 'simple';
  const primaryLabel = isSimple ? 'Item' : 'Spot';
  const hasComment = Boolean(signupTyped.comment?.trim());

  return (
    <main className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 relative">
      <TrackSignupSubmitted
        signupType={isSimple ? 'simple' : 'scheduled'}
        hasComment={hasComment}
      />
      {eventId && (
        <Link
          href={`/event/${eventId}`}
          className="absolute top-4 left-4 text-sm text-muted hover:text-charcoal transition-colors font-body"
        >
          ← Back to Event Page
        </Link>
      )}
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-semibold text-charcoal font-heading">
          You&apos;re signed up!
        </h1>

        <div className="rounded-xl border border-charcoal/10 bg-surface p-6 text-left space-y-4 shadow-soft">
          <div>
            <p className="text-sm text-muted font-body">{primaryLabel}</p>
            <p className="font-medium text-charcoal font-body">{slotAny.role_name}</p>
          </div>
          {dateText && (
            <div>
              <p className="text-sm text-muted font-body">Date</p>
              <p className="font-medium text-charcoal font-body">{dateText}</p>
            </div>
          )}
          {timeRange && (
            <div>
              <p className="text-sm text-muted font-body">Time</p>
              <p className="font-medium text-charcoal font-body">{timeRange}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted font-body">Event</p>
            <p className="font-medium text-charcoal font-body">
              {eventAny.title}
            </p>
          </div>
          {eventAny.location && (
            <div>
              <p className="text-sm text-muted font-body">Location</p>
              <p className="font-medium text-charcoal font-body">
                {eventAny.location}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-lg"
          >
            Add to Calendar
          </a>
          <Link href={cancelUrl} className="btn-secondary-lg">
            Cancel signup
          </Link>
        </div>

        <p className="text-sm text-muted font-body">
          Organized with{' '}
          <Link href="/" className="hover:text-charcoal transition-colors">
            SignupSmartly
          </Link>
        </p>
      </div>
    </main>
  );
}
