import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createOrganizerSignup, getSlot } from '@/lib/db';
import { serviceSupabase } from '@/lib/supabase-service';
import { reportProductionError } from '@/lib/error-reporter';

const organizerSignupSchema = z.object({
  slotId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional().nullable(),
  comment: z.string().max(500).optional().nullable(),
});

const organizerDeleteSignupSchema = z.object({
  signupId: z.string().uuid(),
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

    const { data: eventData } = await serviceSupabase
      .from('events')
      .select('organization_id')
      .eq('id', slot.event_id)
      .single();

    const event = eventData as { organization_id: string } | null;
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: membership } = await serviceSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', event.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized for this event' }, { status: 403 });
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

    const signup = await createOrganizerSignup({
      slotId,
      name,
      email: email ?? null,
      comment: trimmedComment || null,
    });

    return NextResponse.json({ signupId: signup.id });
  } catch (err) {
    console.error('Organizer signup error:', err);
    await reportProductionError({ error: err, request, status: 500 }).catch(() => {});
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseClient = await createClient();
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = organizerDeleteSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { signupId } = parsed.data;

    const { data: signupRow, error: signupErr } = await serviceSupabase
      .from('signups')
      .select('id, slot_id, cancelled')
      .eq('id', signupId)
      .single();

    if (signupErr || !signupRow) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    const signup = signupRow as {
      id: string;
      slot_id: string;
      cancelled: boolean;
    };
    if (signup.cancelled) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    const slot = await getSlot(signup.slot_id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const { data: eventData } = await serviceSupabase
      .from('events')
      .select('organization_id')
      .eq('id', slot.event_id)
      .single();

    const event = eventData as { organization_id: string } | null;
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: membership } = await serviceSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', event.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized for this event' },
        { status: 403 }
      );
    }

    const { data: updated, error: updateErr } = await serviceSupabase
      .from('signups')
      // @ts-expect-error Supabase Update type inference
      .update({ cancelled: true })
      .eq('id', signupId)
      .eq('cancelled', false)
      .select('id')
      .maybeSingle();

    if (updateErr) throw updateErr;
    if (!updated) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Organizer delete signup error:', err);
    await reportProductionError({ error: err, request, status: 500 }).catch(
      () => {}
    );
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
