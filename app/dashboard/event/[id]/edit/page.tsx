import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getEventWithSlotsForDashboard } from '@/lib/db';
import { AppLayout } from '@/components/AppLayout';
import { EditEventForm } from './EditEventForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/event/${id}/edit`)}`);

  const event = await getEventWithSlotsForDashboard(id);
  if (!event) notFound();

  return (
    <AppLayout>
      <div className="mb-6">
        <Link
          href={`/dashboard/event/${id}/signups`}
          className="text-sm text-muted hover:text-charcoal transition-colors font-body"
        >
          ← Back to signups
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-charcoal font-heading mb-6">Edit signup</h1>
      <EditEventForm event={event} />
    </AppLayout>
  );
}
