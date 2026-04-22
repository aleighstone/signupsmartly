import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceSupabase } from '@/lib/supabase-service';
import { reportProductionError } from '@/lib/error-reporter';
import { reminderOffsetDbZod } from '@/lib/reminder-offset';

const schema = z.object({
  token: z.string().min(1),
  reminder_opt_in: z.boolean(),
  reminder_offset: reminderOffsetDbZod,
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, reminder_opt_in, reminder_offset } = parsed.data;

    const { data, error } = await serviceSupabase
      .from('signups')
      .select('*')
      .eq('cancel_token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    const signup = data as { id: string; cancelled: boolean };

    if (signup.cancelled) {
      return NextResponse.json(
        { error: 'Signup is already cancelled' },
        { status: 400 }
      );
    }

    const { error: updateError } = await serviceSupabase
      .from('signups')
      // @ts-expect-error Supabase Update type inference
      .update({
        reminder_opt_in,
        reminder_offset,
      })
      .eq('id', signup.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update reminder preferences error:', err);
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

