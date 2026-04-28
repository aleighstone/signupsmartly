import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { ensureUserAndOrg } from '@/lib/ensure-user-org';
import { AppLayout } from '@/components/AppLayout';
import { CreateEventForm } from './CreateEventForm';

export default async function CreateEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/create-event');
  }

  const { userId, orgId } = await ensureUserAndOrg(user);
  if (!orgId) {
    return (
      <AppLayout>
        <p className="text-muted font-body">
          You need an organization to create events. Please sign up first.
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CreateEventForm organizationId={orgId} createdBy={userId} />
    </AppLayout>
  );
}
