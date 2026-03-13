import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createOrganizerSignup, getSlot } from '@/lib/db';
import { supabase } from '@/lib/supabase';

const organizerSignupSchema = z.object({
  slotId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional().nullable(),
  comment: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = organizerSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slotId, name, email, comment } = parsed.data;

    const slot = await getSlot(slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const { data: eventData } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', slot.event_id)
      .single();

    const event = eventData as { organization_id: string } | null;
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', event.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized for this event' }, { status: 403 });
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

    const signup = await createOrganizerSignup({
      slotId,
      name,
      email: email ?? null,
      comment: comment ?? null,
    });

    return NextResponse.json({ signupId: signup.id });
  } catch (err) {
    console.error('Organizer signup error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
