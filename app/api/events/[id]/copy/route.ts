import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { duplicateEventAsDraft, getSourceEventOwnedByUser } from '@/lib/event-copy';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sourceEvent = await getSourceEventOwnedByUser(id, user.id);
  if (!sourceEvent) {
    return NextResponse.json(
      { error: 'Event not found or you do not have permission to copy it.' },
      { status: 404 }
    );
  }

  try {
    const { eventId } = await duplicateEventAsDraft({
      sourceEvent,
      createdBy: user.id,
    });
    return NextResponse.json({ eventId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to copy event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
