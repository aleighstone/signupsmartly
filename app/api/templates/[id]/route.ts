import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { reportProductionError } from '@/lib/error-reporter';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: template, error } = await supabase
      .from('templates')
      .select(`
        id,
        organization_id,
        name,
        signup_type,
        description,
        location,
        template_slots (
          id,
          slot_name,
          capacity,
          start_time,
          end_time,
          instructions
        )
      `)
      .eq('id', id)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const t = template as { organization_id: string };
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', t.organization_id)
      .in('role', ['owner', 'organizer', 'viewer'])
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(template);
  } catch (err) {
    console.error('Get template error:', err);
    await reportProductionError({ error: err, request, status: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch template' },
      { status: 500 }
    );
  }
}
