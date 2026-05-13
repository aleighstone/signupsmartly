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
  const isAvailability = eventData.signup_type === 'availability';
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
    const emptyCount = isAvailability ? 0 : Math.max(0, slot.capacity - slot.signups.length);
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

  const availabilitySummaries = eventData.slots
    .map((slot) => ({
      id: slot.id,
      roleName: slot.role_name,
      count: slot.signups.length,
      people: slot.signups
        .map((signup) => ({ name: signup.name, email: signup.email ?? '' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.count - a.count || a.roleName.localeCompare(b.roleName));
  const availabilityTotalResponses = availabilitySummaries.reduce(
    (sum, slot) => sum + slot.count,
    0
  );
  const availabilityDistinctPeople = new Set(
    eventData.slots.flatMap((slot) =>
      slot.signups.map((signup) => (signup.email || signup.name).toLowerCase())
    )
  ).size;

  return (
    <AppLayout>
      <TrackSignupsPageView
        signupType={isSimple ? 'simple' : 'scheduled'}
        totalSignups={coverage.filled}
        coveragePct={coverage.percentage}
      />
      <div className="mx-auto w-full max-w-[1100px]">
        <div data-no-print className="mb-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-charcoal font-body"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
          <div className="min-w-0">
            <h1 className="mb-1 text-2xl font-bold leading-[1.2] text-charcoal font-heading">
              {eventData.title}
            </h1>
            <p className="text-sm text-muted font-body">
              {formatEventDateRange(eventData.start_date, eventData.end_date)}
            </p>
          </div>
          <SignupsActions event={eventData} rows={csvRows} isSimple={isSimple} eventId={id} signupPageUrl={signupPageUrl} />
        </div>

        {isAvailability ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-charcoal font-heading">Availability</h2>
              <p className="mt-1 text-sm text-muted font-body">
                {availabilityTotalResponses} {availabilityTotalResponses === 1 ? 'response' : 'responses'} total from {availabilityDistinctPeople} {availabilityDistinctPeople === 1 ? 'person' : 'people'}
              </p>
            </div>
            <div className="grid gap-3">
              {availabilitySummaries.map((slot) => (
                <div key={slot.id} className="rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="font-semibold text-charcoal font-body">{slot.roleName}</h3>
                    <span
                      data-availability-count
                      className="w-fit rounded-full bg-sage/10 px-3 py-1 text-sm font-semibold text-sage font-body"
                    >
                      {slot.count} {slot.count === 1 ? 'available' : 'available'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted font-body">
                    {slot.people.length > 0
                      ? slot.people.map((person) => person.name).join(', ')
                      : 'No responses yet'}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted font-body">
              {availabilityTotalResponses} {availabilityTotalResponses === 1 ? 'response' : 'responses'} total from {availabilityDistinctPeople} {availabilityDistinctPeople === 1 ? 'person' : 'people'}
            </p>
          </div>
        ) : (
          <>
            <CoverageWithStillNeeded
              filled={coverage.filled}
              total={coverage.total}
              percentage={coverage.percentage}
              signupType={isSimple ? 'simple' : 'scheduled'}
              slotsNeedingFill={slotsNeedingFill}
            />

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
          </>
        )}

        <div data-no-print className="mt-6">
          <EventNotificationOverride
            eventId={id}
            eventOverride={eventData.notification_override as NotificationPreference | null}
            globalPreference={globalPreference}
          />
        </div>
      </div>
    </AppLayout>
  );
}
