import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackEmail } from '@/lib/email';
import { reportProductionError } from '@/lib/error-reporter';

const contactSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email('Valid email required'),
  reason: z.enum(['General feedback', 'Feature request', 'Bug report / problem']),
  message: z.string().min(1, 'Message is required').max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, reason, message } = parsed.data;
    await sendFeedbackEmail({ name: name || null, email, reason, message });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    await reportProductionError({ error: err, request, status: 500 });
    return NextResponse.json(
      { error: 'Failed to send feedback' },
      { status: 500 }
    );
  }
}
