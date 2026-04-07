import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { serviceSupabase } from '@/lib/supabase-service';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: transfer, error } = await serviceSupabase
    .from('pending_transfers')
    .select('id, sender_id, event_id, claimed_at, expires_at')
    .eq('id', id)
    .single();

  if (error || !transfer) {
    return NextResponse.json({ error: 'Transfer not found.' }, { status: 404 });
  }

  const row = transfer as {
    id: string;
    sender_id: string;
    event_id: string;
    claimed_at: string | null;
    expires_at: string;
  };
  if (row.sender_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (row.claimed_at) {
    return NextResponse.json({ error: 'This transfer has already been claimed.' }, { status: 409 });
  }

  const { data: event } = await serviceSupabase
    .from('events')
    .select('id, created_by')
    .eq('id', row.event_id)
    .maybeSingle();

  if (event && (event as { created_by: string | null }).created_by === null) {
    await serviceSupabase.from('events').delete().eq('id', row.event_id).is('created_by', null);
  }
  await serviceSupabase.from('pending_transfers').delete().eq('id', row.id).eq('sender_id', user.id);

  return NextResponse.json({ ok: true });
}
