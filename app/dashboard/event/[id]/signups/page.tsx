import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getEventWithSlotsForDashboard, getEventCoverage, getOrganizationTimezone } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { CoverageWithStillNeeded } from './CoverageWithStillNeeded';
import { EventNotificationOverride } from './EventNotificationOverride';
import { formatEventDateRange, formatTimeRange } from '@/lib/calendar';
import { SignupsActions } from './SignupsActions';
import { SignupsTable } from './SignupsTable';
import { TrackSignupsPageView } from '@/app/providers/PostHogTracker';

type NotificationPreference = 'instant' | 'daily' | 'weekly' | 'never';

interface PageProps {
  params: Promise<{ id: string }>;
}

type TableRow = {
  slotId: string;
  role: string;
  time: string | null;
  isEmpty: boolean;
  signup?: {
    id: string;
    name: string;
    email: string | null;
    comment: string | null;
    createdAt: string;
    source: 'volunteer' | 'organizer';
  };
};

type CsvRow = {
  role: string;
  name: string;
  email: string;
  time: string | null;
  comment: string | null;
  createdAt: string;
  source: 'volunteer' | 'organizer';
};

export default async function SignupsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/event/${id}/signups`)}`);

  const { data: ourUserRow } = await supabase
    .from('users')
    .select('notification_preference')
    .eq('id', user.id)
    .single();

  const ourUser = ourUserRow as { notification_preference?: string } | null;
  const globalPreference = (ourUser?.notification_preference ?? 'daily') as NotificationPreference;

  const eventData = await getEventWithSlotsForDashboard(id);
  if (!eventData) notFound();

  const coverage = getEventCoverage(eventData);
  const isSimple = eventData.signup_type === 'simple';
  const timezone = await getOrganizationTimezone(eventData.organization_id);

  const tableRows: TableRow[] = [];
  const csvRows: CsvRow[] = [];

  for (const slot of eventData.slots) {
    const slotTime = isSimple ? null : formatTimeRange(slot.start_time, slot.end_time, timezone);
    const signupSource = (s: { source?: 'volunteer' | 'organizer' }) => s.source ?? 'volunteer';

    for (const signup of slot.signups) {
      tableRows.push({
        slotId: slot.id,
        role: slot.role_name,
        time: slotTime,
        isEmpty: false,
        signup: {
          id: signup.id,
          name: signup.name,
          email: signup.email,
          comment: signup.comment,
          createdAt: new Date(signup.created_at).toLocaleString(),
          source: signupSource(signup),
        },
      });
      csvRows.push({
        role: slot.role_name,
        name: signup.name,
        email: signup.email ?? '',
        time: slotTime,
        comment: signup.comment,
        createdAt: new Date(signup.created_at).toLocaleString(),
        source: signupSource(signup),
      });
    }
    const emptyCount = Math.max(0, slot.capacity - slot.signups.length);
    for (let i = 0; i < emptyCount; i++) {
      tableRows.push({
        slotId: slot.id,
        role: slot.role_name,
        time: slotTime,
        isEmpty: true,
      });
    }
  }

  tableRows.sort((a, b) => a.role.localeCompare(b.role));
  csvRows.sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));

  const slotsNeedingFill = eventData.slots
    .map((slot) => {
      const filled = slot.signups.length;
      const needed = Math.max(0, slot.capacity - filled);
      return { role_name: slot.role_name, needed };
    })
    .filter((s) => s.needed > 0);

  return (
    <AppLayout>
      <TrackSignupsPageView
        signupType={eventData.signup_type}
        totalSignups={coverage.filled}
        coveragePct={coverage.percentage}
      />
      <div data-no-print className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-charcoal transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-charcoal font-heading">
            {eventData.title}
          </h1>
          <p className="text-muted font-body">
            {formatEventDateRange(eventData.start_date, eventData.end_date)}
          </p>
          <div className="mt-3 max-w-sm">
            <CoverageWithStillNeeded
              filled={coverage.filled}
              total={coverage.total}
              percentage={coverage.percentage}
              signupType={eventData.signup_type}
              slotsNeedingFill={slotsNeedingFill}
            />
          </div>
        </div>
        <SignupsActions event={eventData} rows={csvRows} isSimple={isSimple} eventId={id} />
      </div>

      <SignupsTable
        rows={tableRows}
        slots={eventData.slots.map((s) => ({ id: s.id, role_name: s.role_name }))}
        isSimple={isSimple}
      />

      <div data-no-print className="mt-6 max-w-sm">
        <EventNotificationOverride
          eventId={id}
          eventOverride={eventData.notification_override as NotificationPreference | null}
          globalPreference={globalPreference}
        />
      </div>
    </AppLayout>
  );
}
