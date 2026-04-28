import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getEventWithSlotsForDashboard, getEventCoverage, getOrgSlugForUser } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { CoverageWithStillNeeded } from './CoverageWithStillNeeded';
import { EventNotificationOverride } from './EventNotificationOverride';
import {
  formatEventDateRange,
  formatOrganizerSlotDateAndTime,
  formatSignupTimestamp,
} from '@/lib/calendar';
import { SignupsActions } from './SignupsActions';
import { SignupsTable } from './SignupsTable';
import { TrackSignupsPageView } from '@/app/providers/PostHogTracker';
import { DEFAULT_COMMENT_LABEL } from '@/lib/slot-comment';

type NotificationPreference = 'instant' | 'daily' | 'weekly' | 'never';

interface PageProps {
  params: Promise<{ id: string }>;
}

type TableRow = {
  slotId: string;
  role: string;
  dateAndTime: string | null;
  isEmpty: boolean;
  signup?: {
    id: string;
    name: string;
    email: string | null;
    comment: string | null;
    comment_label: string;
    createdAt: string;
    source: 'volunteer' | 'organizer';
  };
};

type CsvRow = {
  role: string;
  name: string;
  email: string;
  dateAndTime: string | null;
  comment: string | null;
  comment_label: string;
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

  const orgSlug = await getOrgSlugForUser(user.id);
  const signupPageUrl = orgSlug
    ? `https://${orgSlug}.signupsmartly.com/event/${id}`
    : `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/event/${id}`;

  const coverage = getEventCoverage(eventData);
  const isSimple = eventData.signup_type === 'simple';
  const tableRows: TableRow[] = [];
  const csvRows: CsvRow[] = [];

  for (const slot of eventData.slots) {
    const slotDateAndTime = isSimple
      ? null
      : formatOrganizerSlotDateAndTime(slot.start_time, slot.end_time);
    const signupSource = (s: { source?: 'volunteer' | 'organizer' }) => s.source ?? 'volunteer';

    for (const signup of slot.signups) {
      tableRows.push({
        slotId: slot.id,
        role: slot.role_name,
        dateAndTime: slotDateAndTime,
        isEmpty: false,
        signup: {
          id: signup.id,
          name: signup.name,
          email: signup.email,
          comment: signup.comment,
          comment_label: slot.comment_label ?? DEFAULT_COMMENT_LABEL,
          createdAt: formatSignupTimestamp(signup.created_at),
          source: signupSource(signup),
        },
      });
      csvRows.push({
        role: slot.role_name,
        name: signup.name,
        email: signup.email ?? '',
        dateAndTime: slotDateAndTime,
        comment: signup.comment,
        comment_label: slot.comment_label ?? DEFAULT_COMMENT_LABEL,
        createdAt: formatSignupTimestamp(signup.created_at),
        source: signupSource(signup),
      });
    }
    const emptyCount = Math.max(0, slot.capacity - slot.signups.length);
    for (let i = 0; i < emptyCount; i++) {
      tableRows.push({
        slotId: slot.id,
        role: slot.role_name,
        dateAndTime: slotDateAndTime,
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
          className="text-sm text-muted hover:text-charcoal transition-colors font-body"
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
        <SignupsActions event={eventData} rows={csvRows} isSimple={isSimple} eventId={id} signupPageUrl={signupPageUrl} />
      </div>

      <SignupsTable
        rows={tableRows}
        slots={eventData.slots.map((s) => ({
          id: s.id,
          role_name: s.role_name,
          comment_label: s.comment_label ?? DEFAULT_COMMENT_LABEL,
          comment_required: s.comment_required ?? false,
        }))}
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
