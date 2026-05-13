import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { reportProductionError } from '@/lib/error-reporter';
import { normalizeCommentLabel } from '@/lib/slot-comment';

const slotSchema = z.object({
  role_name: z.string().min(1),
  role_description: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  capacity: z.number().min(1),
  instructions: z.string().nullable().optional(),
  comment_label: z.string().max(60).optional(),
  comment_required: z.boolean().optional(),
});


function availabilitySlotKey(slot: { start_time?: string | null; end_time?: string | null }): string {
  const startDate = slot.start_time?.slice(0, 10) ?? '';
  const startTime = slot.start_time?.slice(11, 16) ?? '';
  const endTime = slot.end_time?.slice(11, 16) ?? '';
  return [startDate, startTime, endTime].join('|');
}

function hasDuplicateAvailabilitySlots(slots: Array<{ start_time?: string | null; end_time?: string | null }>): boolean {
  const seen = new Set<string>();
  for (const slot of slots) {
    const key = availabilitySlotKey(slot);
    if (!slot.start_time || !key.trim()) return true;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

const createEventSchema = z.object({
  organization_id: z.string().uuid(),
  created_by: z.string().uuid(),
  signup_type: z.enum(['scheduled', 'simple', 'availability']).optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  published: z.boolean().optional(),
  show_signups: z.boolean().optional(),
  theme: z
    .object({
      colorKey: z.string().optional(),
      fontKey: z.string().optional(),
    })
    .optional()
    .nullable(),
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
    if (eventData.signup_type === 'availability' && hasDuplicateAvailabilitySlots(slots)) {
      return NextResponse.json(
        { error: 'Availability poll dates must be unique and include a date.' },
        { status: 400 }
      );
    }

    const { theme, ...eventFields } = eventData;
    const eventPayload = {
      ...eventFields,
      signup_type: eventData.signup_type ?? 'scheduled',
      start_date: eventData.start_date || null,
      end_date: eventData.end_date || null,
      published: eventData.published ?? true,
      show_signups: eventData.show_signups ?? true,
      ...(theme !== undefined ? { theme } : {}),
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
    const showSignups = eventPayload.show_signups ?? true;
    const slotsToInsert = slots.map((s, index) => ({
      event_id: eventRow.id,
      role_name: s.role_name,
      role_description: s.role_description ?? null,
      start_time: s.start_time || null,
      end_time: s.end_time || null,
      capacity: s.capacity,
      instructions: s.instructions ?? null,
      comment_label: normalizeCommentLabel(s.comment_label),
      comment_required: s.comment_required ?? false,
      comment_show_publicly: showSignups,
      sort_order: index,
    }));

    const { error: slotsError } = await supabase
      .from('slots')
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      .insert(slotsToInsert);

    if (slotsError) throw slotsError;

    // Send event created confirmation email (non-blocking)
    try {
      const { sendEventCreatedConfirmation } = await import('@/lib/email');
      await sendEventCreatedConfirmation({
        organizerEmail: user.email!,
        eventId: eventRow.id,
        eventTitle: parsed.data.title,
        startDate: parsed.data.start_date ?? null,
        endDate: parsed.data.end_date ?? null,
        signupType: parsed.data.signup_type ?? 'scheduled',
      });
    } catch (emailErr) {
      // Log but don't fail the request — event was created successfully
      console.error('Event created email failed (non-blocking):', emailErr);
    }

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
