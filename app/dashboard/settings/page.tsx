import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { AppLayout } from '@/components/AppLayout';
import { NotificationSettingsForm } from './NotificationSettingsForm';

type NotificationPreference = 'instant' | 'daily' | 'weekly' | 'never';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard/settings');
  }

  const { data: ourUserRow } = await supabase
    .from('users')
    .select('id, notification_preference')
    .eq('email', user.email!)
    .single();

  const ourUser = ourUserRow as { id: string; notification_preference?: string } | null;
  const preference = (ourUser?.notification_preference ?? 'daily') as NotificationPreference;

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
      <h1 className="text-2xl font-semibold text-charcoal font-heading">Settings</h1>
      <div className="mt-8 max-w-xl">
        <NotificationSettingsForm initialPreference={preference} />
      </div>
    </AppLayout>
  );
}
