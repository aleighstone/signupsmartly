import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrgBySlug } from '@/lib/org-branding';
import { getPublishedEventsForOrg, getEventWithSlots, getEventCoverage } from '@/lib/db';
import { CoverageMeter } from '@/components/CoverageMeter';
import { formatEventDateRange } from '@/lib/calendar';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const FALCONS_SLUG = 'falconstrack';
const FALCONS_DISPLAY_NAME = 'LA Falcons Track Parent Volunteers';

export default async function OrgHomePage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const isFalcons = slug === FALCONS_SLUG;
  const displayName = isFalcons ? FALCONS_DISPLAY_NAME : org.name;
  const events = await getPublishedEventsForOrg(org.id);

  return (
    <main className="min-h-screen bg-sand">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          {org.logo_url && (
            <img
              src={org.logo_url}
              alt=""
              className="mx-auto max-h-16 w-auto object-contain"
            />
          )}
          <h1 className={`text-3xl font-semibold text-charcoal font-heading ${org.logo_url ? 'mt-4' : ''}`}>
            {displayName}
          </h1>
          <p className="mt-2 text-muted font-body">
            Volunteer signups for {displayName}
          </p>
        </div>

        {events.length === 0 ? (
          <p className="text-center text-muted font-body py-8">
            No signups are available yet. Check back soon.
          </p>
        ) : (
          <ul className="space-y-4">
            {events.map(async (event) => {
              const eventWithSlots = await getEventWithSlots(event.id);
              const coverage = eventWithSlots
                ? getEventCoverage(eventWithSlots)
                : { filled: 0, total: 0, percentage: 0 };

              const buttonStyle = org.primary_color
                ? { backgroundColor: org.primary_color }
                : undefined;

              return (
                <li
                  key={event.id}
                  className="rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft"
                >
                  <h2 className="font-semibold text-charcoal font-heading">
                    {event.title}
                  </h2>
                  <p className="text-sm text-muted font-body mt-1">
                    {formatEventDateRange(event.start_date, event.end_date) ||
                      'Ongoing'}
                  </p>
                  <div className="mt-3 w-48">
                    <CoverageMeter
                      filled={coverage.filled}
                      total={coverage.total}
                      percentage={coverage.percentage}
                      size="sm"
                      signupType={event.signup_type === 'simple' ? 'simple' : 'scheduled'}
                      primaryColor={org.primary_color}
                    />
                  </div>
                  <Link
                    href={`/event/${event.id}`}
                    className="mt-4 inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-xl border-2 border-transparent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-body"
                    style={
                      buttonStyle ?? {
                        backgroundColor: 'var(--brand-primary)',
                      }
                    }
                  >
                    Sign Up
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

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
