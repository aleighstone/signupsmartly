import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { serviceSupabase } from '@/lib/supabase-service';
import { duplicateEventAsDraft, getSourceEventOwnedByUser } from '@/lib/event-copy';
import { sendClaimExistingUserEmail, sendClaimNewUserEmail } from '@/lib/email';

const bodySchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address.'),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const recipientEmail = parsed.data.recipientEmail.trim().toLowerCase();
  const senderEmail = (user.email || '').trim().toLowerCase();
  if (recipientEmail === senderEmail) {
    return NextResponse.json(
      { error: "You can't share a copy with yourself." },
      { status: 400 }
    );
  }

  const sourceEvent = await getSourceEventOwnedByUser(id, user.id);
  if (!sourceEvent) {
    return NextResponse.json(
      { error: 'Event not found or you do not have permission to share it.' },
      { status: 404 }
    );
  }

  try {
    const { eventId } = await duplicateEventAsDraft({
      sourceEvent,
      createdBy: null,
    });

    const { data: pendingTransfer, error: transferError } = await serviceSupabase
      .from('pending_transfers')
      // @ts-expect-error Supabase insert type narrowing
      .insert({
        event_id: eventId,
        source_event_id: sourceEvent.id,
        sender_id: user.id,
        recipient_email: recipientEmail,
      })
      .select('id, token')
      .single();

    if (transferError || !pendingTransfer) {
      await serviceSupabase.from('events').delete().eq('id', eventId).is('created_by', null);
      throw transferError || new Error('Failed to create pending transfer');
    }

    const { data: recipientUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', recipientEmail)
      .maybeSingle();

    const { data: senderProfile } = await serviceSupabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .maybeSingle();

    const senderName = (senderProfile as { name?: string } | null)?.name || 'A SignupSmartly organizer';
    const senderEmailValue =
      (senderProfile as { email?: string } | null)?.email || user.email || 'unknown@email.com';
    const claimUrl = `${APP_URL}/claim/${(pendingTransfer as { token: string }).token}`;

    if (recipientUser) {
      await sendClaimExistingUserEmail({
        to: recipientEmail,
        senderName,
        senderEmail: senderEmailValue,
        eventTitle: sourceEvent.title,
        claimUrl,
      });
    } else {
      await sendClaimNewUserEmail({
        to: recipientEmail,
        senderName,
        senderEmail: senderEmailValue,
        eventTitle: sourceEvent.title,
        claimUrl,
      });
    }

    return NextResponse.json({ message: `Copy sent to ${recipientEmail}` });
  } catch (error) {
    // Clean up unclaimed copy artifacts if anything fails after creating them.
    const { data: cleanupTransfer } = await serviceSupabase
      .from('pending_transfers')
      .select('id, event_id')
      .eq('sender_id', user.id)
      .eq('recipient_email', recipientEmail)
      .is('claimed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cleanupTransfer) {
      const t = cleanupTransfer as { id: string; event_id: string };
      await serviceSupabase.from('pending_transfers').delete().eq('id', t.id);
      await serviceSupabase.from('events').delete().eq('id', t.event_id).is('created_by', null);
    }
    const message = error instanceof Error ? error.message : 'Failed to share copy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
