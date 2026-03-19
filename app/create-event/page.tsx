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

  let ourUser = (await supabase
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single()).data as { id: string } | null;

  if (!ourUser) {
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Organizer',
    });
    ourUser = { id: user.id };
  }

  const userId = ourUser.id;

  let membership = (await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .single()).data as { organization_id: string } | null;

  if (!membership?.organization_id) {
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Organizer';
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
        user_id: userId,
        role: 'owner',
      });
      membership = { organization_id: org.id };
    }
  }

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
      <h1 className="text-2xl font-semibold text-charcoal font-heading">Create Signup</h1>
      <CreateEventForm organizationId={orgId} createdBy={userId} />
    </AppLayout>
  );
}
