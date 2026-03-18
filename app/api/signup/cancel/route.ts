import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSignupByCancelToken, cancelSignup } from '@/lib/db';
import { reportProductionError } from '@/lib/error-reporter';

const cancelSchema = z.object({
  cancelToken: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { cancelToken } = parsed.data;
    const signup = await getSignupByCancelToken(cancelToken);
    if (!signup) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    const s = signup as { id: string; cancelled: boolean };
    if (s.cancelled) {
      return NextResponse.json({ error: 'Already cancelled' }, { status: 400 });
    }

    await cancelSignup(s.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    await reportProductionError({ error: err, request, status: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cancel failed' },
      { status: 500 }
    );
  }
}
