import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { ensureUserAndOrg } from '@/lib/ensure-user-org';
import { TrackDashboardView } from '@/app/providers/PostHogTracker';
import { TrackMetaCompleteRegistration } from '@/app/providers/MetaPixelTracker';
import { getEventsForUser, getEventWithSlotsForDashboard, getEventCoverage, hasEventWithVolunteerSignup, getOrgSlugForUser } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { DashboardEventList } from '@/components/DashboardEventList';
import type { EventCardData } from '@/components/DashboardEventList';
import { NpsBanner } from '@/components/NpsBanner';
import { formatEventDateRangeCompact } from '@/lib/calendar';
import { serviceSupabase } from '@/lib/supabase-service';
import type { Event } from '@/types/database';

export const dynamic = 'force-dynamic';

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

  let activeEvents: Awaited<ReturnType<typeof getEventsForUser>> = [];
  let archivedEvents: Awaited<ReturnType<typeof getEventsForUser>> = [];
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

    [activeEvents, archivedEvents] = await Promise.all([
      getEventsForUser(userId, { archived: false }),
      getEventsForUser(userId, { archived: true }),
    ]);
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

  const buildEventCards = async (
    events: Awaited<ReturnType<typeof getEventsForUser>>
  ): Promise<EventCardData[]> =>
    Promise.all(events.map(async (event) => {
      const eventWithSlots = await getEventWithSlotsForDashboard(event.id);
      const coverage = eventWithSlots
        ? getEventCoverage(eventWithSlots)
        : { filled: 0, total: 0, percentage: 0 };
      return {
        event: event as Event & { archived: boolean },
        coverage,
        dateLabel: formatEventDateRangeCompact(event.start_date, event.end_date),
        signupPageUrl: eventUrl(event.id),
      };
    }));
  const [activeCards, archivedCards] = await Promise.all([
    buildEventCards(activeEvents),
    buildEventCards(archivedEvents),
  ]);

  return (
    <AppLayout>
      <TrackMetaCompleteRegistration userId={authUser && userId ? userId : null} />
      <TrackDashboardView eventCount={activeEvents.length} />

      {!authUser ? (
        <div className="space-y-6">
          <h1 className="text-[22px] font-semibold text-charcoal font-heading">Your Signups</h1>
          <div className="rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
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
        </div>
      ) : activeEvents.length === 0 && archivedEvents.length === 0 ? (
        <div className="space-y-6">
          <h1 className="text-[22px] font-semibold text-charcoal font-heading">Your Signups</h1>
          <div className="rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
            <p className="text-muted font-body">Nothing to see here.</p>
            <Link href="/create-event" className="mt-4 btn-primary">
              Create your first signup
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <DashboardEventList activeCards={activeCards} archivedCards={archivedCards} />
        </div>
      )}

      {showNps && (
        <div className="mt-8">
          <NpsBanner />
        </div>
      )}
    </AppLayout>
  );
}
