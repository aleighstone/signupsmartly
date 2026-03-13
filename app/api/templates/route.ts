import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';

const templateSlotSchema = z.object({
  slot_name: z.string().min(1),
  capacity: z.number().min(1),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
});

const createTemplateSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1),
  signup_type: z.enum(['scheduled', 'simple']),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  slots: z.array(templateSlotSchema).min(1),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .in('role', ['owner', 'organizer', 'viewer'])
      .limit(1)
      .single();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: templates, error } = await supabase
      .from('templates')
      .select('id, name, signup_type, description, location, created_at, template_slots(id, slot_name, capacity, start_time, end_time, instructions)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(templates || []);
  } catch (err) {
    console.error('Get templates error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { organization_id, name, signup_type, description, location, slots } = parsed.data;

    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization_id)
      .in('role', ['owner', 'organizer'])
      .limit(1)
      .single();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: template, error: templateError } = await supabase
      .from('templates')
      // @ts-expect-error Supabase Insert type
      .insert({ organization_id, name, signup_type, description: description || null, location: location || null })
      .select('id')
      .single();

    if (templateError || !template) throw templateError || new Error('Failed to create template');

    const slotsToInsert = slots.map((s) => ({
      template_id: template.id,
      slot_name: s.slot_name,
      capacity: s.capacity,
      start_time: s.start_time || null,
      end_time: s.end_time || null,
      instructions: s.instructions ?? null,
    }));

    const { error: slotsError } = await supabase.from('template_slots').insert(slotsToInsert);
    if (slotsError) throw slotsError;

    return NextResponse.json({ id: template.id, name });
  } catch (err) {
    console.error('Create template error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}
