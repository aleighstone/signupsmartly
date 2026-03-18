import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { reportProductionError } from '@/lib/error-reporter';

const schema = z.object({
  notification_override: z.enum(['instant', 'daily', 'weekly', 'never']).nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { notification_override } = parsed.data;

    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('id, organization_id')
      .eq('id', eventId)
      .single();

    if (eventError || !eventRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventRow as { id: string; organization_id: string };

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', event.organization_id)
      .eq('user_id', user.id)
      .single();

    const mem = membership as { role: string } | null;
    const isOwner = mem?.role === 'owner';
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('events')
      // @ts-expect-error Supabase Update type inference
      .update({ notification_override })
      .eq('id', eventId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update notification override error:', err);
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
