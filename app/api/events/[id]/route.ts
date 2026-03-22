import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { serviceSupabase } from '@/lib/supabase-service';
import { reportProductionError } from '@/lib/error-reporter';
import type { Event, Slot, Signup } from '@/types/database';

const patchEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  slots: z.array(
    z.object({
      id: z.string().uuid().optional(),
      role_name: z.string().min(1),
      capacity: z.number().min(1),
      start_time: z.string().nullable().optional(),
      end_time: z.string().nullable().optional(),
      instructions: z.string().nullable().optional(),
      role_description: z.string().nullable().optional(),
    })
  ),
  deleted_slot_ids: z
    .array(
      z.object({
        id: z.string().uuid(),
        reason: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: eventRow, error: eventError } = await serviceSupabase
      .from('events')
      .select('id, organization_id, start_date, end_date, location, title')
      .eq('id', id)
      .single();

    if (eventError || !eventRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventRow as {
      id: string;
      organization_id: string;
      start_date: string | null;
      end_date: string | null;
      location: string | null;
      title: string;
    };

    const { data: membership } = await serviceSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', event.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      description,
      location,
      start_date,
      end_date,
      slots,
      deleted_slot_ids = [],
    } = parsed.data;

    const dateChanged =
      start_date !== event.start_date || end_date !== event.end_date;
    const locationChanged = location !== event.location;

    // Validate capacity vs signup count server-side
    for (const slot of slots) {
      if (slot.id) {
        const { data: existingSlot } = await serviceSupabase
          .from('slots')
          .select('id')
          .eq('id', slot.id)
          .single();
        if (existingSlot) {
          const { count } = await serviceSupabase
            .from('signups')
            .select('*', { count: 'exact', head: true })
            .eq('slot_id', slot.id)
            .eq('cancelled', false);
          if (count != null && slot.capacity < count) {
            return NextResponse.json(
              {
                error: `Capacity cannot be below ${count} for a slot with that many signups.`,
              },
              { status: 409 }
            );
          }
        }
      }
    }

    await serviceSupabase
      .from('events')
      // @ts-expect-error Supabase Update type inference
      .update({
        title,
        description: description ?? null,
        location: location ?? null,
        start_date: start_date ?? null,
        end_date: end_date ?? null,
      })
      .eq('id', id);

    const cancelledSignups: {
      signup: Signup & { cancel_token: string };
      slot: Slot;
      reason: string | null;
    }[] = [];

    for (const { id: slotId, reason } of deleted_slot_ids) {
      const { data: slotRow } = await serviceSupabase
        .from('slots')
        .select('*')
        .eq('id', slotId)
        .eq('event_id', id)
        .single();

      if (!slotRow) continue;

      const slot = slotRow as Slot;
      const { data: signupRows } = await serviceSupabase
        .from('signups')
        .select('*')
        .eq('slot_id', slotId)
        .eq('cancelled', false);

      for (const s of signupRows || []) {
        cancelledSignups.push({
          signup: s as Signup & { cancel_token: string },
          slot,
          reason: reason ?? null,
        });
      }

      await serviceSupabase.from('signups').delete().eq('slot_id', slotId);
      await serviceSupabase.from('slots').delete().eq('id', slotId);
    }

    for (const slot of slots) {
      if (slot.id) {
        await serviceSupabase
          .from('slots')
          // @ts-expect-error Supabase Update type inference
          .update({
            role_name: slot.role_name,
            capacity: slot.capacity,
            start_time: slot.start_time ?? null,
            end_time: slot.end_time ?? null,
            instructions: slot.instructions ?? null,
            role_description: slot.role_description ?? null,
          })
          .eq('id', slot.id)
          .eq('event_id', id);
      } else {
        await serviceSupabase
          .from('slots')
          // @ts-expect-error Supabase Insert type inference
          .insert({
          event_id: id,
          role_name: slot.role_name,
          capacity: slot.capacity,
          start_time: slot.start_time ?? null,
          end_time: slot.end_time ?? null,
          instructions: slot.instructions ?? null,
          role_description: slot.role_description ?? null,
        });
      }
    }

    const { data: updatedEvent } = await serviceSupabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    const eventForEmails = (updatedEvent ?? {
      ...event,
      title,
      description: description ?? null,
      location: location ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      signup_type: 'scheduled' as const,
      published: true,
      created_by: null,
      created_at: '',
      notification_override: null,
    }) as Event;

    const { data: keptSlots } = await serviceSupabase
      .from('slots')
      .select('id')
      .eq('event_id', id);
    const keptSlotIds = (keptSlots || []).map((s: { id: string }) => s.id);

    let remainingSignups: Array<{ signup: Signup & { cancel_token: string }; slot: Slot }> = [];
    if (keptSlotIds.length > 0) {
      const { data: signupRows } = await serviceSupabase
        .from('signups')
        .select('*, slots(*)')
        .eq('cancelled', false)
        .in('slot_id', keptSlotIds);

      remainingSignups = (signupRows || []).map(
        (r: { slot_id: string; slots: Slot } & Signup) => ({
          signup: {
            id: r.id,
            slot_id: r.slot_id,
            name: r.name,
            email: r.email,
            comment: r.comment,
            cancelled: r.cancelled,
            cancel_token: r.cancel_token,
            source: r.source,
            reminder_opt_in: r.reminder_opt_in,
            reminder_offset: r.reminder_offset,
            reminder_sent_at: r.reminder_sent_at,
            created_at: r.created_at,
          } as Signup & { cancel_token: string },
          slot: r.slots as Slot,
        })
      );
    }

    try {
      const {
        sendSignupCancelledByOrganizer,
        sendEventDateChanged,
        sendEventLocationChanged,
      } = await import('@/lib/email');

      for (const { signup, slot, reason } of cancelledSignups) {
        if (signup.email) {
          await sendSignupCancelledByOrganizer({
            signup,
            slot,
            event: eventForEmails,
            reason,
          });
        }
      }

      if (dateChanged) {
        for (const row of remainingSignups) {
          const { signup, slot } = row as { signup: Signup; slot: Slot };
          if (signup.email) {
            await sendEventDateChanged({
              signup,
              slot,
              event: eventForEmails,
              oldStartDate: event.start_date,
              oldEndDate: event.end_date,
            });
          }
        }
      }

      if (locationChanged) {
        for (const row of remainingSignups) {
          const { signup, slot } = row as { signup: Signup; slot: Slot };
          if (signup.email) {
            await sendEventLocationChanged({
              signup,
              slot,
              event: eventForEmails,
              oldLocation: event.location,
            });
          }
        }
      }
    } catch (emailErr) {
      console.error('Edit event emails failed (non-blocking):', emailErr);
    }

    return NextResponse.json({ id });
  } catch (err: unknown) {
    console.error('Edit event error:', err);
    await reportProductionError({ error: err, request, status: 500 });
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to update event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
