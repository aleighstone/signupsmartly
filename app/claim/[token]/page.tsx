import { serviceSupabase } from '@/lib/supabase-service';
import { AppLayout } from '@/components/AppLayout';
import { ClaimPageClient } from './ClaimPageClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

function InvalidCard() {
  return (
    <AppLayout>
      <div className="mx-auto mt-8 max-w-xl rounded-xl border border-coral/25 bg-surface p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-charcoal font-heading">
          This link is invalid or has expired.
        </h1>
      </div>
    </AppLayout>
  );
}

export default async function ClaimPage({ params }: PageProps) {
  const { token } = await params;

  const { data: transfer } = await serviceSupabase
    .from('pending_transfers')
    .select('id, event_id, recipient_email, sender_id, claimed_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!transfer) return <InvalidCard />;
  const row = transfer as {
    id: string;
    event_id: string;
    recipient_email: string;
    sender_id: string;
    claimed_at: string | null;
    expires_at: string;
  };
  if (row.claimed_at || new Date(row.expires_at).getTime() <= Date.now()) return <InvalidCard />;

  const [{ data: event }, { data: slots, count: slotCount }, { data: sender }, { data: existingUser }] =
    await Promise.all([
      serviceSupabase
        .from('events')
        .select('id, title, signup_type')
        .eq('id', row.event_id)
        .maybeSingle(),
      serviceSupabase
        .from('slots')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', row.event_id),
      serviceSupabase
        .from('users')
        .select('name')
        .eq('id', row.sender_id)
        .maybeSingle(),
      serviceSupabase
        .from('users')
        .select('id')
        .eq('email', row.recipient_email.toLowerCase())
        .maybeSingle(),
    ]);

  if (!event) return <InvalidCard />;
  void slots;

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold text-charcoal font-heading">Claim shared signup copy</h1>

        <div className="mt-6 rounded-xl border border-charcoal/10 bg-surface p-5 shadow-soft">
          <p className="text-lg font-semibold text-charcoal font-heading">📋 {(event as { title: string }).title}</p>
          <p className="mt-1 text-sm text-muted font-body">
            {(event as { signup_type: 'scheduled' | 'simple' }).signup_type === 'simple'
              ? 'Simple list'
              : 'Scheduled'}{' '}
            · {slotCount ?? 0} volunteer {(slotCount ?? 0) === 1 ? 'spot' : 'spots'}
          </p>
          <p className="mt-2 text-sm text-muted font-body">
            Shared by {(sender as { name?: string } | null)?.name || 'SignupSmartly organizer'}
          </p>
        </div>

        <ClaimPageClient
          token={token}
          recipientEmail={row.recipient_email}
          recipientHasAccount={!!existingUser}
        />
      </div>
    </AppLayout>
  );
}
