import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { serviceSupabase } from '@/lib/supabase-service';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { error } = await serviceSupabase
    .from('events')
    // @ts-expect-error Supabase types are regenerated after the local migration runs.
    .update({ archived: true })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
