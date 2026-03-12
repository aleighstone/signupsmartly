import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getEventWithSlotsForDashboard, getEventCoverage } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { CoverageMeter } from '@/components/CoverageMeter';
import { formatEventDateRange, formatTimeRange } from '@/lib/calendar';
import { RosterActions } from './RosterActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RosterPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) notFound();

  const eventData = await getEventWithSlotsForDashboard(id);
  if (!eventData) notFound();

  const coverage = getEventCoverage(eventData);

  const rows: {
    role: string;
    name: string;
    email: string;
    time: string;
    comment: string | null;
    createdAt: string;
  }[] = [];

  for (const slot of eventData.slots) {
    for (const signup of slot.signups) {
      rows.push({
        role: slot.role_name,
        name: signup.name,
        email: signup.email,
        time: formatTimeRange(slot.start_time, slot.end_time),
        comment: signup.comment,
        createdAt: new Date(signup.created_at).toLocaleString(),
      });
    }
    if (slot.signups.length === 0) {
      rows.push({
        role: slot.role_name,
        name: '—',
        email: '—',
        time: formatTimeRange(slot.start_time, slot.end_time),
        comment: null,
        createdAt: '—',
      });
    }
  }

  rows.sort(
    (a, b) =>
      a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-charcoal transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal font-heading">
            {eventData.title}
          </h1>
          <p className="text-muted font-body">
            {formatEventDateRange(eventData.start_date, eventData.end_date)}
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
        <RosterActions event={eventData} rows={rows} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-surface shadow-soft">
        <table className="min-w-full divide-y divide-charcoal/10">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Volunteer Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Comment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted font-body">
                Signup Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/10">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-sm text-charcoal font-body">
                  {row.role}
                </td>
                <td className="px-4 py-3 text-sm text-charcoal font-body">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-sm text-muted font-body">
                  {row.email}
                </td>
                <td className="px-4 py-3 text-sm text-muted font-body">
                  {row.time}
                </td>
                <td className="px-4 py-3 text-sm text-muted font-body max-w-[200px] truncate">
                  {row.comment || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {row.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
