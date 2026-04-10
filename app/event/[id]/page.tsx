import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getEventWithSlots, getEventCoverage } from '@/lib/db';
import { getOrgBySlug } from '@/lib/org-branding';
import { buildVolunteerFacingThemeHead } from '@/data/themes';

export const dynamic = 'force-dynamic';
import { EventHeader } from '@/components/EventHeader';
import { TrackEventPageView } from '@/app/providers/PostHogTracker';
import { CoverageMeter } from '@/components/CoverageMeter';
import { EventPageClient } from './EventPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const eventData = await getEventWithSlots(id);

  if (!eventData) notFound();

  const slug = (await headers()).get('x-org-slug');
  const org = slug ? await getOrgBySlug(slug) : null;
  const isFalcons = slug === 'falconstrack';

  const coverage = getEventCoverage(eventData);
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
          signupType={eventData.signup_type}
          coveragePct={coverage.percentage}
          openSlots={openSlots}
        />
        <div className="mt-8 rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft">
          <CoverageMeter
            filled={coverage.filled}
            total={coverage.total}
            percentage={coverage.percentage}
            signupType={eventData.signup_type}
            volunteerPageThemed
          />
        </div>

        <div className="mt-8">
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
