import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Event } from '@/types/database';
import { createSignup, getSlot, getOrganizationOwner } from '@/lib/db';
import { sendSignupConfirmation, sendOrganizerInstantNotification } from '@/lib/email';
import { reportProductionError } from '@/lib/error-reporter';
import { effectiveNotificationPreference } from '@/lib/notifications';
import { serviceSupabase } from '@/lib/supabase-service';

function sameEmail(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}

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

    const { data: eventRow } = await serviceSupabase
      .from('events')
      .select('*')
      .eq('id', slot.event_id)
      .single();

    const event = eventRow as Event | null;

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { count } = await serviceSupabase
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

    const commentRequired = Boolean(slot.comment_required);
    const trimmedComment = (comment ?? '').trim();
    if (commentRequired && !trimmedComment) {
      return NextResponse.json(
        { error: 'This spot requires a response in the notes field.' },
        { status: 400 }
      );
    }

    const { data: activeForSlot } = await serviceSupabase
      .from('signups')
      .select('id, email')
      .eq('slot_id', slotId)
      .eq('cancelled', false);

    const activeRows = (activeForSlot ?? []) as { id: string; email: string | null }[];
    const existing = activeRows.find((row) => sameEmail(row.email ?? '', email));
    if (existing) {
      return NextResponse.json({ signupId: existing.id });
    }

    let signup: Awaited<ReturnType<typeof createSignup>>;
    try {
      signup = await createSignup({
        slotId,
        name,
        email,
        comment: trimmedComment || undefined,
        reminder_opt_in,
        reminder_offset,
      });
    } catch (insertErr) {
      if (isUniqueViolation(insertErr)) {
        const { data: afterRace } = await serviceSupabase
          .from('signups')
          .select('id, email')
          .eq('slot_id', slotId)
          .eq('cancelled', false);
        const raceRows = (afterRace ?? []) as { id: string; email: string | null }[];
        const winner = raceRows.find((row) => sameEmail(row.email ?? '', email));
        if (winner) {
          return NextResponse.json({ signupId: winner.id });
        }
      }
      throw insertErr;
    }

    // Volunteer confirmation email should not block signup success
    try {
      await sendSignupConfirmation({
        signup,
        slot,
        event,
      });
    } catch (emailErr) {
      console.error('Volunteer confirmation email error (non-blocking):', emailErr);
    }

    // Organizer notifications: insert digest row, send instant if applicable.
    // This should never block a volunteer from signing up.
    try {
      const ownerId = await getOrganizationOwner(event.organization_id);
      if (ownerId) {
        const { data: ownerRow } = await serviceSupabase
          .from('users')
          .select('id, email, notification_preference')
          .eq('id', ownerId)
          .single();

        const owner = ownerRow as { id: string; email: string; notification_preference: string } | null;
        if (owner?.email) {
          const userPref = (owner.notification_preference ?? 'daily') as 'instant' | 'daily' | 'weekly' | 'never';
          const eventOverride = event.notification_override as 'instant' | 'daily' | 'weekly' | 'never' | null;
          const effective = effectiveNotificationPreference(userPref, eventOverride);

          const db = serviceSupabase as unknown as {
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
    await reportProductionError({ error: err, request, status: 500 });
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
