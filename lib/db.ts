import { supabase } from './supabase';
import type {
  Event,
  Slot,
  Signup,
  SlotWithSignups,
  EventWithSlots,
} from '@/types/database';

export async function getEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single();

  if (error || !data) return null;
  return data as Event;
}

export async function getEventWithSlots(
  eventId: string,
  options?: { publishedOnly?: boolean }
): Promise<EventWithSlots | null> {
  const publishedOnly = options?.publishedOnly !== false;
  let query = supabase.from('events').select('*').eq('id', eventId);
  if (publishedOnly) query = query.eq('published', true);
  const { data: event, error: eventError } = await query.single();

  if (eventError || !event) return null;

  const eventRow = event as Event;
  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select(`
      *,
      signups (*)
    `)
    .eq('event_id', eventId)
    .order(eventRow.signup_type === 'simple' ? 'role_name' : 'start_time', {
      ascending: true,
      nullsFirst: true,
    });

  if (slotsError) return null;

  const slotsWithSignups: SlotWithSignups[] = (slots || []).map((s: Slot & { signups: Signup[] }) => ({
    ...s,
    signups: s.signups.filter((sig) => !sig.cancelled),
  }));

  return {
    ...eventRow,
    slots: slotsWithSignups,
  } as EventWithSlots;
}

export async function getSlot(slotId: string) {
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('id', slotId)
    .single();

  if (error || !data) return null;
  return data as Slot;
}

export async function createSignup(params: {
  slotId: string;
  name: string;
  email: string;
  comment?: string;
}) {
  const { data, error } = await supabase
    .from('signups')
    // @ts-expect-error Supabase Insert type inference
    .insert({
      slot_id: params.slotId,
      name: params.name,
      email: params.email,
      comment: params.comment || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Signup;
}

export async function getSignupByCancelToken(token: string) {
  const { data, error } = await supabase
    .from('signups')
    .select(`
      *,
      slots (
        *,
        event:events (*)
      )
    `)
    .eq('cancel_token', token)
    .single();

  if (error || !data) return null;
  return data;
}

export async function cancelSignup(signupId: string) {
  const { error } = await supabase
    .from('signups')
    // @ts-expect-error Supabase Update type inference
    .update({ cancelled: true })
    .eq('id', signupId);

  if (error) throw error;
}

export async function getEventsForUser(userId: string) {
  const { data: memberships, error: memError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId);

  if (memError || !memberships?.length) return [];

  const orgIds = (memberships as { organization_id: string }[]).map(
    (m) => m.organization_id
  );

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('organization_id', orgIds)
    .order('start_date', { ascending: false });

  if (error) return [];
  return (data || []) as Event[];
}

export async function getEventWithSlotsForDashboard(eventId: string) {
  return getEventWithSlots(eventId, { publishedOnly: false });
}

export { getSlotRemainingCapacity } from './slot-utils';

export function getEventCoverage(event: EventWithSlots): {
  filled: number;
  total: number;
  percentage: number;
} {
  let total = 0;
  let filled = 0;
  for (const slot of event.slots) {
    total += slot.capacity;
    filled += Math.min(slot.signups.length, slot.capacity);
  }
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { filled, total, percentage };
}
