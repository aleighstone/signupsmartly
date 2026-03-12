import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getEventsForUser } from '@/lib/db';
import { getEventWithSlotsForDashboard, getEventCoverage } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { CoverageMeter } from '@/components/CoverageMeter';
import { formatEventDateRange } from '@/lib/calendar';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let events: Awaited<ReturnType<typeof getEventsForUser>> = [];
  let userId: string | null = null;

  if (authUser) {
    const { data: ourUserData } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email!)
      .single();

    let ourUser = ourUserData as { id: string } | null;
    if (!ourUser) {
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Organizer',
      });
      ourUser = { id: authUser.id };
    }

    const { data: members } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', ourUser.id);

    if (!members?.length) {
      const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Organizer';
      const { data: orgData } = await supabase
        .from('organizations')
        // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
        .insert({ name: `${name}'s Organization`, timezone: 'America/New_York' })
        .select('id')
        .single();
      const org = orgData as { id: string } | null;
      if (org) {
        // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
        await supabase.from('organization_members').insert({
          organization_id: org.id,
          user_id: ourUser.id,
          role: 'owner',
        });
      }
    }

    userId = ourUser?.id ?? authUser.id;
    events = await getEventsForUser(userId);
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold text-charcoal font-heading">Your Events</h1>

      {!authUser ? (
        <div className="mt-8 rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
          <p className="text-muted font-body">
            Sign in to view and manage your events.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover transition-colors"
          >
            Sign in
          </Link>
        </div>
      ) : events.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-charcoal/20 bg-surface p-8 text-center shadow-soft">
          <p className="text-muted font-body">No events yet.</p>
          <Link
            href="/create-event"
            className="mt-4 inline-block rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover transition-colors"
          >
            Create your first event
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
                    <div className="mt-3 max-w-xs">
                      <CoverageMeter
                        filled={coverage.filled}
                        total={coverage.total}
                        percentage={coverage.percentage}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/event/${event.id}`}
                      className="rounded-xl border-2 border-charcoal bg-transparent px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
                    >
                      View Event
                    </Link>
                    <Link
                      href={`/dashboard/event/${event.id}/roster`}
                      className="rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover transition-colors"
                    >
                      View Roster
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
}
