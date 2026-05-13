import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serviceSupabase } from '@/lib/supabase-service';
import { reportProductionError } from '@/lib/error-reporter';
import { sendAvailabilityConfirmation } from '@/lib/email';
import type { Event, Slot, Signup } from '@/types/database';

const availabilitySchema = z.object({
  slotIds: z.array(z.string().uuid()).min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function duplicateMessage(): string {
  return "It looks like you've already submitted your availability. Email the organizer if you need to make changes.";
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const slotIds = Array.from(new Set(parsed.data.slotIds));
    const email = normalizeEmail(parsed.data.email);
    const name = parsed.data.name.trim();

    const { data: slotRows, error: slotError } = await serviceSupabase
      .from('slots')
      .select('*, event:events!slots_event_id_fkey (*)')
      .in('id', slotIds);

    if (slotError) throw slotError;
    const slots = (slotRows ?? []) as Array<Slot & { event: Event | null }>;
    if (slots.length !== slotIds.length) {
      return NextResponse.json({ error: 'One or more dates were not found.' }, { status: 404 });
    }

    const eventIds = new Set(slots.map((slot) => slot.event_id));
    if (eventIds.size !== 1) {
      return NextResponse.json(
        { error: 'All selected dates must belong to the same poll.' },
        { status: 400 }
      );
    }

    const event = slots[0]?.event;
    if (!event || event.signup_type !== 'availability') {
      return NextResponse.json({ error: 'This is not an availability poll.' }, { status: 400 });
    }

    const { data: allEventSlotRows, error: allEventSlotsError } = await serviceSupabase
      .from('slots')
      .select('id')
      .eq('event_id', event.id);

    if (allEventSlotsError) throw allEventSlotsError;

    const eventSlotIds = ((allEventSlotRows ?? []) as Array<{ id: string }>).map(
      (slot) => slot.id
    );
    const { data: existingRows } = await serviceSupabase
      .from('signups')
      .select('id, email')
      .in('slot_id', eventSlotIds)
      .eq('cancelled', false);

    const existing = (existingRows ?? []) as Array<{ id: string; email: string | null }>;
    if (existing.some((row) => normalizeEmail(row.email ?? '') === email)) {
      return NextResponse.json({ error: duplicateMessage() }, { status: 409 });
    }

    const responseGroupId = randomUUID();
    const rows = slots.map((slot) => ({
      slot_id: slot.id,
      name,
      email,
      comment: null,
      source: 'volunteer',
      reminder_opt_in: false,
      reminder_offset: '1_day',
      response_group_id: responseGroupId,
    }));

    const { data: insertedRows, error: insertError } = await serviceSupabase
      .from('signups')
      // @ts-expect-error Supabase Insert type inference
      .insert(rows)
      .select('*');

    if (insertError) {
      if (isUniqueViolation(insertError)) {
        return NextResponse.json({ error: duplicateMessage() }, { status: 409 });
      }
      throw insertError;
    }

    const signups = (insertedRows ?? []) as Signup[];

    try {
      await sendAvailabilityConfirmation({
        event,
        slots,
        signup: signups[0],
      });
    } catch (emailErr) {
      console.error('Availability confirmation email error (non-blocking):', emailErr);
    }

    revalidatePath(`/event/${event.id}`);
    revalidatePath(`/dashboard/event/${event.id}/signups`);

    return NextResponse.json({ responseId: responseGroupId });
  } catch (err) {
    console.error('Availability submission error:', err);
    await reportProductionError({ error: err, request, status: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
