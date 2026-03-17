import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Event } from '@/types/database';
import { createSignup, getSlot, getOrganizationOwner } from '@/lib/db';
import { sendSignupConfirmation, sendOrganizerInstantNotification } from '@/lib/email';
import { effectiveNotificationPreference } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

const signupSchema = z.object({
  slotId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  comment: z.string().max(500).optional(),
  reminder_opt_in: z.boolean().optional(),
  reminder_offset: z.enum(['1_day', 'morning_of']).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      slotId,
      name,
      email,
      comment,
      reminder_opt_in = true,
      reminder_offset = '1_day',
    } = parsed.data;

    const slot = await getSlot(slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const { data: eventRow } = await supabase
      .from('events')
      .select('*')
      .eq('id', slot.event_id)
      .single();

    const event = eventRow as Event | null;

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { count } = await supabase
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('slot_id', slotId)
      .eq('cancelled', false);

    if ((count ?? 0) >= slot.capacity) {
      return NextResponse.json(
        { error: 'This slot is full' },
        { status: 409 }
      );
    }

    const signup = await createSignup({
      slotId,
      name,
      email,
      comment,
      reminder_opt_in,
      reminder_offset,
    });

    await sendSignupConfirmation({
      signup,
      slot,
      event,
    });

    // Organizer notifications: insert digest row, send instant if applicable.
    // This should never block a volunteer from signing up.
    try {
      const ownerId = await getOrganizationOwner(event.organization_id);
      if (ownerId) {
        const { data: ownerRow } = await supabase
          .from('users')
          .select('id, email, notification_preference')
          .eq('id', ownerId)
          .single();

        const owner = ownerRow as { id: string; email: string; notification_preference: string } | null;
        if (owner?.email) {
          const userPref = (owner.notification_preference ?? 'daily') as 'instant' | 'daily' | 'weekly' | 'never';
          const eventOverride = event.notification_override as 'instant' | 'daily' | 'weekly' | 'never' | null;
          const effective = effectiveNotificationPreference(userPref, eventOverride);

          const db = supabase as unknown as {
            from: (t: string) => {
              insert: (v: object) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null }> } };
              update: (v: object) => { eq: (c: string, v: string) => Promise<unknown> };
            };
          };
          const { data: digestRow } = await db
            .from('organizer_notification_digest')
            .insert({ user_id: ownerId, event_id: event.id, signup_id: signup.id })
            .select('id')
            .single();

          const digestId = digestRow?.id;
          if (digestId && effective === 'instant' && signup.email !== owner.email) {
            try {
              await sendOrganizerInstantNotification({
                event,
                slot,
                signup,
                organizerEmail: owner.email,
              });
              await db
                .from('organizer_notification_digest')
                .update({ digest_sent_at: new Date().toISOString() })
                .eq('id', digestId);
            } catch (err) {
              console.error('Failed to send instant organizer notification:', err);
            }
          }
        }
      }
    } catch (notificationErr) {
      console.error('Organizer notification error (non-blocking):', notificationErr);
    }

    return NextResponse.json({ signupId: signup.id });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
