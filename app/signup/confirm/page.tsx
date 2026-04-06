import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { serviceSupabase } from '@/lib/supabase-service';
import { getOrgBySlug } from '@/lib/org-branding';
import { generateAddToCalendarUrl } from '@/lib/calendar';
import type { Event, Slot } from '@/types/database';
import { formatTimeRange } from '@/lib/calendar';
import { TrackSignupSubmitted } from '@/app/providers/PostHogTracker';
import { format } from 'date-fns';
import { buildVolunteerFacingThemeHead } from '@/data/themes';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  if (!id) notFound();

  const { data: signup, error } = await serviceSupabase
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
    theme?: unknown;
  };

  const calendarUrl = generateAddToCalendarUrl({
    event: eventAny as Event,
    slot: slotAny as Slot,
    volunteerName: signupTyped.name,
  });
  const cancelUrl = `/signup/cancel?token=${signupTyped.cancel_token}`;
  const hasTime = !!slotAny.start_time;
  const timeRange = hasTime
    ? formatTimeRange(slotAny.start_time || null, slotAny.end_time || null)
    : null;
  const dateSource = slotAny.start_time || eventAny.start_date || null;
  const dateText = dateSource
    ? format(new Date(dateSource), 'EEEE, MMMM d, yyyy')
    : null;
  const eventId = eventAny.id;
  const isSimple = eventAny.signup_type === 'simple';
  const primaryLabel = isSimple ? 'Item' : 'Spot';
  const hasComment = Boolean(signupTyped.comment?.trim());

  const slug = (await headers()).get('x-org-slug');
  const org = slug ? await getOrgBySlug(slug) : null;

  const { fontsUrl, themeStyleCss } = buildVolunteerFacingThemeHead(eventAny.theme);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontsUrl} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: themeStyleCss }} />
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
        <h1
          className="text-2xl font-semibold text-charcoal"
          style={{ fontFamily: 'var(--theme-font)' }}
        >
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
            <p
              className="font-medium text-charcoal font-body"
              style={{ fontFamily: 'var(--theme-font)' }}
            >
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
            className="inline-flex min-h-[48px] min-w-[140px] w-full items-center justify-center rounded-full border-2 border-transparent px-6 py-3.5 text-base font-semibold font-body transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-charcoal/30 focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--theme-primary)',
              color: 'var(--theme-btn-text)',
            }}
          >
            Add to Calendar
          </a>
          <Link href={cancelUrl} className="btn-secondary-lg">
            Cancel signup
          </Link>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted font-body">
            {org ? (
              <Link
                href="https://www.signupsmartly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-charcoal transition-colors"
              >
                {org.name}
              </Link>
            ) : (
              <>
                Organized with{' '}
                <Link href="/" className="hover:text-charcoal transition-colors">
                  SignupSmartly
                </Link>
              </>
            )}
          </p>
          <p className="text-xs text-muted font-body">
            <Link
              href={`/signup/preferences?token=${signupTyped.cancel_token}`}
              className="underline hover:text-charcoal transition-colors"
            >
              Manage reminder preferences
            </Link>
          </p>
        </div>
      </div>
      </main>
    </>
  );
}
