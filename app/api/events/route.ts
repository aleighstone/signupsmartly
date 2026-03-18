import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { reportProductionError } from '@/lib/error-reporter';

const slotSchema = z.object({
  role_name: z.string().min(1),
  role_description: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  capacity: z.number().min(1),
  instructions: z.string().nullable().optional(),
});

const createEventSchema = z.object({
  organization_id: z.string().uuid(),
  created_by: z.string().uuid(),
  signup_type: z.enum(['scheduled', 'simple']).optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  published: z.boolean().optional(),
  slots: z.array(slotSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slots, ...eventData } = parsed.data;
    const eventPayload = {
      ...eventData,
      signup_type: eventData.signup_type ?? 'scheduled',
      start_date: eventData.start_date || null,
      end_date: eventData.end_date || null,
      published: eventData.published ?? true,
    };

    const { data: event, error: eventError } = await supabase
      .from('events')
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      .insert(eventPayload)
      .select('id')
      .single();

    if (eventError || !event) {
      throw eventError || new Error('Failed to create event');
    }

    const eventRow = event as { id: string };
    const slotsToInsert = slots.map((s) => ({
      event_id: eventRow.id,
      role_name: s.role_name,
      role_description: s.role_description ?? null,
      start_time: s.start_time || null,
      end_time: s.end_time || null,
      capacity: s.capacity,
      instructions: s.instructions ?? null,
    }));

    const { error: slotsError } = await supabase
      .from('slots')
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      .insert(slotsToInsert);

    if (slotsError) throw slotsError;

    return NextResponse.json({ id: eventRow.id });
  } catch (err: unknown) {
    console.error('Create event error:', err);
    await reportProductionError({ error: err, request, status: 500 });
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to create event';
    const details =
      err && typeof err === 'object' && 'details' in err
        ? (err as { details: unknown }).details
        : undefined;
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code: unknown }).code
        : undefined;
    return NextResponse.json(
      { error: message, ...(details != null ? { details } : {}), ...(code != null ? { code } : {}) },
      { status: 500 }
    );
  }
}
