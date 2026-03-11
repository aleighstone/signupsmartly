import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSignup, getSlot } from '@/lib/db';
import { sendSignupConfirmation } from '@/lib/email';
import { supabase } from '@/lib/supabase';

const signupSchema = z.object({
  slotId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  comment: z.string().max(500).optional(),
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

    const { slotId, name, email, comment } = parsed.data;

    const slot = await getSlot(slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', slot.event_id)
      .single();

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

    const signup = await createSignup({ slotId, name, email, comment });

    await sendSignupConfirmation({
      signup,
      slot,
      event,
    });

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
