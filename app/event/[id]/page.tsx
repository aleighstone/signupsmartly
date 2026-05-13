import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getEventWithSlots, getEventCoverage } from '@/lib/db';
import { getOrgBySlug } from '@/lib/org-branding';
import { createClient } from '@/lib/supabase-server';
import { buildVolunteerFacingThemeHead } from '@/data/themes';

export const dynamic = 'force-dynamic';
import { EventHeader } from '@/components/EventHeader';
import { TrackEventPageView } from '@/app/providers/PostHogTracker';
import { CoverageMeter } from '@/components/CoverageMeter';
import { EventPageClient } from './EventPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const eventData = await getEventWithSlots(id);

  if (!eventData || (eventData as typeof eventData & { archived: boolean }).archived) {
    return {
      title: 'SignupSmartly',
    };
  }

  const description = eventData.description
    ? eventData.description.slice(0, 160).replace(/\n/g, ' ')
    : 'Sign up for a volunteer spot.';

  return {
    title: `${eventData.title} — SignupSmartly`,
    description,
    openGraph: {
      title: eventData.title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: eventData.title,
      description,
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOrganizer = !!user;
  const eventData = await getEventWithSlots(id);

  if (!eventData) notFound();
  if ((eventData as typeof eventData & { archived: boolean }).archived) notFound();

  const slug = (await headers()).get('x-org-slug');
  const org = slug ? await getOrgBySlug(slug) : null;
  const isFalcons = slug === 'falconstrack';

  const coverage = getEventCoverage(eventData);
  const isAvailability = eventData.signup_type === 'availability';
  const availabilityResponses = eventData.slots.reduce(
    (sum, slot) => sum + slot.signups.length,
    0
  );
  const openSlots = eventData.slots.reduce(
    (sum, s) => sum + Math.max(0, s.capacity - s.signups.length),
    0
  );
  const { fontsUrl, themeStyleCss } = buildVolunteerFacingThemeHead(eventData.theme);

  return (
    <main className="min-h-screen bg-sand">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontsUrl} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: themeStyleCss }} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {isOrganizer && (
          <div className="mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-charcoal transition-colors font-body"
            >
              <span aria-hidden>←</span> My Dashboard
            </Link>
          </div>
        )}
        {org && (
          <div className="mb-6">
            {isFalcons ? (
              <span className="text-sm font-medium text-muted font-body">
                LA Falcons Track Parent Volunteers
              </span>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-muted hover:text-charcoal transition-colors"
              >
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt=""
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium font-body">{org.name}</span>
                )}
              </Link>
            )}
          </div>
        )}

        <EventHeader event={eventData} titleStyle={{ fontFamily: 'var(--theme-font)' }} />

        <TrackEventPageView
          signupType={eventData.signup_type === 'simple' ? 'simple' : 'scheduled'}
          coveragePct={coverage.percentage}
          openSlots={openSlots}
        />
        <div className="mt-7 rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft sm:mt-8">
          {isAvailability ? (
            <p className="text-sm font-semibold text-charcoal font-body">
              {availabilityResponses} {availabilityResponses === 1 ? 'response' : 'responses'} so far
            </p>
          ) : (
            <CoverageMeter
              filled={coverage.filled}
              total={coverage.total}
              percentage={coverage.percentage}
              signupType={eventData.signup_type === 'simple' ? 'simple' : 'scheduled'}
              volunteerPageThemed
            />
          )}
        </div>

        <div className="mt-7 sm:mt-8">
          <EventPageClient event={eventData} />
        </div>

        <footer className="mt-12 text-center text-sm text-muted space-y-1">
          <p>
            <Link
              href="https://www.signupsmartly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-charcoal transition-colors"
            >
              Organized with SignupSmartly
            </Link>
          </p>
          {isFalcons && (
            <p>
              For more info visit{' '}
              <a
                href="https://www.falconstrack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-charcoal transition-colors"
              >
                www.falconstrack.com
              </a>{' '}
              or{' '}
              <a
                href="mailto:lafalcons1990@gmail.com"
                className="hover:text-charcoal transition-colors"
              >
                contact us
              </a>
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
