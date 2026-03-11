import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
const schema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { id, email, name } = parsed.data;
    if (id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    const { error } = await supabase.from('users').insert({
      id,
      email,
      name,
    });

    if (error && error.code !== '23505') {
      throw error;
    }

    const { data: members } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', id);

    if (!members?.length) {
    const { data: orgData } = await supabase
      .from('organizations')
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      .insert({ name: `${name}'s Organization`, timezone: 'America/New_York' })
      .select('id')
      .single();

    const org = orgData as { id: string } | null;
    if (org) {
      // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: id,
        role: 'owner',
      });
    }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sync user error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
