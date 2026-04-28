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
        email: signup.email ?? '',
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
          className="text-sm text-muted hover:text-charcoal transition-colors font-body"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {eventData.title}
          </h1>
          <p className="text-neutral-500">
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

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Volunteer Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Comment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Signup Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-sm text-neutral-900">
                  {row.role}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {row.email}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {row.time}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500 max-w-[200px] truncate">
                  {row.comment || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-400">
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
