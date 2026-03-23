import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { ensureUserAndOrg } from '@/lib/ensure-user-org';
import { TrackDashboardView } from '@/app/providers/PostHogTracker';
import { getEventsForUser, getEventWithSlotsForDashboard, getEventCoverage, hasEventWithVolunteerSignup, getOrgSlugForUser } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { CoverageMeter } from '@/components/CoverageMeter';
import { NpsBanner } from '@/components/NpsBanner';
import { formatEventDateRange } from '@/lib/calendar';
import { serviceSupabase } from '@/lib/supabase-service';

function shouldShowNps(
  npsSubmittedAt: string | null,
  npsDismissedAt: string | null,
  hasVolunteerSignup: boolean
): boolean {
  if (!hasVolunteerSignup || npsSubmittedAt) return false;
  if (!npsDismissedAt) return true;
  const dismissed = new Date(npsDismissedAt).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return dismissed < sevenDaysAgo;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let events: Awaited<ReturnType<typeof getEventsForUser>> = [];
  let userId: string | null = null;
  let ourUser: { id: string; nps_submitted_at: string | null; nps_dismissed_at: string | null } | null = null;

  if (authUser) {
    const { userId: ensuredUserId } = await ensureUserAndOrg(authUser);
    userId = ensuredUserId;

    const { data: ourUserData } = await serviceSupabase
      .from('users')
      .select('id, nps_submitted_at, nps_dismissed_at')
      .eq('id', userId)
      .maybeSingle();

    ourUser = ourUserData as { id: string; nps_submitted_at: string | null; nps_dismissed_at: string | null } | null;
    if (!ourUser) {
      ourUser = { id: userId, nps_submitted_at: null, nps_dismissed_at: null };
    }

    events = await getEventsForUser(userId);
  }

  const orgSlug = userId ? await getOrgSlugForUser(userId) : null;
  const eventUrl = (eventId: string) =>
    orgSlug
      ? `https://${orgSlug}.signupsmartly.com/event/${eventId}`
      : `/event/${eventId}`;

  const hasVolunteerSignup = userId ? await hasEventWithVolunteerSignup(userId) : false;
  const showNps =
    !!authUser &&
    !!userId &&
    !!ourUser &&
    hasVolunteerSignup &&
    shouldShowNps(
      ourUser.nps_submitted_at ?? null,
      ourUser.nps_dismissed_at ?? null,
      hasVolunteerSignup
    );

  return (
    <AppLayout>
      <TrackDashboardView eventCount={events.length} />
      <h1 className="text-2xl font-semibold text-charcoal font-heading">Your Signups</h1>

      {!authUser ? (
        <div className="mt-8 rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
          <p className="text-muted font-body">
            Sign in to view and manage your events.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary-lg">
              Create your first event
            </Link>
            <Link href="/login" className="btn-secondary-lg">
              Sign in
            </Link>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
          <p className="text-muted font-body">Nothing to see here.</p>
          <Link href="/create-event" className="mt-4 btn-primary">
            Create your first signup
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {events.map(async (event) => {
            const eventWithSlots = await getEventWithSlotsForDashboard(event.id);
            const coverage = eventWithSlots
              ? getEventCoverage(eventWithSlots)
              : { filled: 0, total: 0, percentage: 0 };

            return (
              <li
                key={event.id}
                className="rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-charcoal font-heading">
                      {event.title}
                    </h2>
                    <p className="text-sm text-muted font-body">
                      {formatEventDateRange(event.start_date, event.end_date)}
                    </p>
                    <div className="mt-3 w-72 shrink-0">
                      <CoverageMeter
                        filled={coverage.filled}
                        total={coverage.total}
                        percentage={coverage.percentage}
                        size="sm"
                        signupType={event.signup_type}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/event/${event.id}/signups`}
                      className="btn-primary"
                    >
                      View My Signups
                    </Link>
                    <a
                      href={eventUrl(event.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      Signup Page
                    </a>
                    <Link
                      href={`/dashboard/event/${event.id}/edit`}
                      className="rounded-xl border-2 border-charcoal px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors font-body"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showNps && (
        <div className="mt-8">
          <NpsBanner />
        </div>
      )}
    </AppLayout>
  );
}
