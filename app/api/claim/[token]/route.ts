import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { serviceSupabase } from '@/lib/supabase-service';
import { ensureUserAndOrg } from '@/lib/ensure-user-org';

const newUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

function isActiveTransfer(transfer: { claimed_at: string | null; expires_at: string }): boolean {
  if (transfer.claimed_at) return false;
  return new Date(transfer.expires_at).getTime() > Date.now();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const supabase = await createClient();

  const { data: transferData } = await serviceSupabase
    .from('pending_transfers')
    .select('id, event_id, recipient_email, claimed_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!transferData) {
    return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 404 });
  }

  const transfer = transferData as {
    id: string;
    event_id: string;
    recipient_email: string;
    claimed_at: string | null;
    expires_at: string;
  };
  if (!isActiveTransfer(transfer)) {
    return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 400 });
  }

  const recipientEmail = transfer.recipient_email.trim().toLowerCase();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  const body = await request.json().catch(() => null);
  const parsedNewUser = newUserSchema.safeParse(body);
  const isNewUserClaim = parsedNewUser.success;

  if (!isNewUserClaim) {
    if (!sessionUser) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }
    if ((sessionUser.email || '').trim().toLowerCase() !== recipientEmail) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address.' },
        { status: 403 }
      );
    }

    const { data: eventRow } = await serviceSupabase
      .from('events')
      .select('organization_id, created_by')
      .eq('id', transfer.event_id)
      .single();
    if (!eventRow) {
      return NextResponse.json({ error: 'Shared copy no longer exists.' }, { status: 404 });
    }
    const previous = eventRow as { organization_id: string; created_by: string | null };

    const ensured = await ensureUserAndOrg(sessionUser as User);
    if (!ensured.orgId) {
      return NextResponse.json({ error: 'Could not prepare your organization.' }, { status: 500 });
    }

    const updateEvent = await serviceSupabase
      .from('events')
      // @ts-expect-error supabase update type narrowing
      .update({ organization_id: ensured.orgId, created_by: sessionUser.id, published: false })
      .eq('id', transfer.event_id)
      .is('created_by', null);
    if (updateEvent.error) {
      return NextResponse.json({ error: 'Could not claim this copy.' }, { status: 500 });
    }

    const updateTransfer = await serviceSupabase
      .from('pending_transfers')
      // @ts-expect-error supabase update type narrowing
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', transfer.id)
      .is('claimed_at', null);

    if (updateTransfer.error) {
      await serviceSupabase
        .from('events')
        // @ts-expect-error supabase update type narrowing
        .update({ organization_id: previous.organization_id, created_by: previous.created_by })
        .eq('id', transfer.event_id);
      return NextResponse.json({ error: 'Could not finalize claim.' }, { status: 500 });
    }

    return NextResponse.json({ redirectTo: '/dashboard' });
  }

  // New user claim path: create account + assign copy + sign in.
  const { name, password } = parsedNewUser.data;
  let createdUserId: string | null = null;
  try {
    const { data: createAuth, error: createAuthError } = await serviceSupabase.auth.admin.createUser({
      email: recipientEmail,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (createAuthError || !createAuth.user) {
      throw createAuthError || new Error('Could not create account');
    }
    createdUserId = createAuth.user.id;

    const ensured = await ensureUserAndOrg({
      ...createAuth.user,
      email: recipientEmail,
      user_metadata: { ...(createAuth.user.user_metadata || {}), name },
    } as User);
    if (!ensured.orgId) {
      throw new Error('Could not prepare organization for new account');
    }

    const updateEvent = await serviceSupabase
      .from('events')
      // @ts-expect-error supabase update type narrowing
      .update({ organization_id: ensured.orgId, created_by: createdUserId, published: false })
      .eq('id', transfer.event_id)
      .is('created_by', null);
    if (updateEvent.error) throw updateEvent.error;

    const updateTransfer = await serviceSupabase
      .from('pending_transfers')
      // @ts-expect-error supabase update type narrowing
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', transfer.id)
      .is('claimed_at', null);
    if (updateTransfer.error) throw updateTransfer.error;

    const signInResult = await supabase.auth.signInWithPassword({
      email: recipientEmail,
      password,
    });
    if (signInResult.error) throw signInResult.error;

    return NextResponse.json({ redirectTo: '/dashboard' });
  } catch (error) {
    if (createdUserId) {
      await serviceSupabase.auth.admin.deleteUser(createdUserId);
    }
    const message = error instanceof Error ? error.message : 'Failed to claim signup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
