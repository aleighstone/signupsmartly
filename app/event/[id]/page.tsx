import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventWithSlots, getEventCoverage, getOrganizationTimezone } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { EventHeader } from '@/components/EventHeader';
import { CoverageMeter } from '@/components/CoverageMeter';
import { EventPageClient } from './EventPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const eventData = await getEventWithSlots(id);

  if (!eventData) notFound();

  const coverage = getEventCoverage(eventData);
  const timezone = await getOrganizationTimezone(eventData.organization_id);

  return (
    <main className="min-h-screen bg-sand">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <EventHeader event={eventData} />

        <div className="mt-8 rounded-xl border border-charcoal/10 bg-surface p-4 shadow-soft">
          <CoverageMeter
            filled={coverage.filled}
            total={coverage.total}
            percentage={coverage.percentage}
            signupType={eventData.signup_type}
          />
        </div>

        <div className="mt-8">
          <EventPageClient event={eventData} timezone={timezone} />
        </div>

        <p className="mt-12 text-center text-sm text-muted">
          <Link href="/" className="hover:text-charcoal transition-colors">
            Organized with SignupSmartly
          </Link>
        </p>
      </div>
    </main>
  );
}
