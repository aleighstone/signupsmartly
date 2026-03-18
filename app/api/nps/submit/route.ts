import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { getEventCountForUser } from '@/lib/db';
import { reportProductionError } from '@/lib/error-reporter';
import { sendNpsResponse } from '@/lib/email';

const submitSchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { score, comment } = parsed.data;

    const { data: userRow } = await supabase
      .from('users')
      .select('id, email, nps_submitted_at')
      .eq('id', authUser.id)
      .single();

    const user = userRow as { id: string; email: string; nps_submitted_at: string | null } | null;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.nps_submitted_at) {
      return NextResponse.json({ error: 'NPS already submitted' }, { status: 400 });
    }

    // New table/columns - types need regeneration for strict inference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    const { error: insertError } = await client.from('nps_responses').insert({
      user_id: user.id,
      score,
      comment: comment ?? null,
    });

    if (insertError) throw insertError;

    const { error: updateError } = await client
      .from('users')
      .update({ nps_submitted_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) throw updateError;

    const eventCount = await getEventCountForUser(user.id);
    await sendNpsResponse({
      score,
      comment: comment ?? null,
      userEmail: user.email,
      eventCount,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('NPS submit error:', err);
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
