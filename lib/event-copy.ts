import { serviceSupabase } from '@/lib/supabase-service';
import type { Event, Slot } from '@/types/database';

export function buildCopiedTitle(title: string): string {
  return `Copy of ${title}`;
}

export async function getSourceEventOwnedByUser(eventId: string, userId: string): Promise<Event | null> {
  const { data, error } = await serviceSupabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('created_by', userId)
    .single();

  if (error || !data) return null;
  return data as Event;
}

export async function duplicateEventAsDraft(params: {
  sourceEvent: Event;
  createdBy: string | null;
}): Promise<{ eventId: string }> {
  const { sourceEvent, createdBy } = params;

  const eventPayload = {
    organization_id: sourceEvent.organization_id,
    title: buildCopiedTitle(sourceEvent.title),
    description: sourceEvent.description,
    location: sourceEvent.location,
    start_date: sourceEvent.start_date,
    end_date: sourceEvent.end_date,
    signup_type: sourceEvent.signup_type,
    published: false,
    created_by: createdBy,
    show_signups: sourceEvent.show_signups,
    theme: sourceEvent.theme,
    notification_override: null,
  };

  const { data: insertedEvent, error: eventError } = await serviceSupabase
    .from('events')
    // @ts-expect-error Supabase insert type narrowing
    .insert(eventPayload)
    .select('id')
    .single();
  if (eventError || !insertedEvent) {
    throw eventError || new Error('Failed to create event copy');
  }

  const copiedEventId = (insertedEvent as { id: string }).id;

  const { data: sourceSlots, error: slotsError } = await serviceSupabase
    .from('slots')
    .select('*')
    .eq('event_id', sourceEvent.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (slotsError) throw slotsError;

  const slots = (sourceSlots ?? []) as Slot[];
  if (slots.length > 0) {
    const slotPayload = slots.map((slot, index) => ({
      event_id: copiedEventId,
      role_name: slot.role_name,
      role_description: slot.role_description,
      start_time: slot.start_time,
      end_time: slot.end_time,
      capacity: slot.capacity,
      instructions: slot.instructions,
      comment_label: slot.comment_label,
      comment_required: slot.comment_required,
      comment_show_publicly: sourceEvent.show_signups ?? true,
      sort_order: index,
    }));

    const { error: insertSlotsError } = await serviceSupabase
      .from('slots')
      // @ts-expect-error Supabase insert type narrowing
      .insert(slotPayload);
    if (insertSlotsError) {
      await serviceSupabase.from('events').delete().eq('id', copiedEventId);
      throw insertSlotsError;
    }
  }

  return { eventId: copiedEventId };
}
