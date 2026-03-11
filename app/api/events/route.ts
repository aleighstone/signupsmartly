import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';

const slotSchema = z.object({
  role_name: z.string().min(1),
  role_description: z.string().nullable().optional(),
  start_time: z.string(),
  end_time: z.string(),
  capacity: z.number().min(1),
  instructions: z.string().nullable().optional(),
});

const createEventSchema = z.object({
  organization_id: z.string().uuid(),
  created_by: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string(),
  end_date: z.string(),
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

    const { data: event, error: eventError } = await supabase
      .from('events')
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      .insert({
        ...eventData,
        published: eventData.published ?? true,
      })
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
      start_time: s.start_time,
      end_time: s.end_time,
      capacity: s.capacity,
      instructions: s.instructions ?? null,
    }));

    const { error: slotsError } = await supabase
      .from('slots')
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      .insert(slotsToInsert);

    if (slotsError) throw slotsError;

    return NextResponse.json({ id: eventRow.id });
  } catch (err) {
    console.error('Create event error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to create event',
      },
      { status: 500 }
    );
  }
}
