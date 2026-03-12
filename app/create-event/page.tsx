import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { AppLayout } from '@/components/AppLayout';
import { CreateEventForm } from './CreateEventForm';

export default async function CreateEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/create-event');
  }

  const { data: ourUserData } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single();

  const ourUser = ourUserData as { id: string } | null;
  const userId = ourUser?.id ?? user.id;

  const { data: membershipData } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .single();

  const membership = membershipData as { organization_id: string } | null;
  const orgId = membership?.organization_id;
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
      <h1 className="text-2xl font-semibold text-charcoal font-heading">Create Event</h1>
      <CreateEventForm organizationId={orgId} createdBy={userId} />
    </AppLayout>
  );
}
