import { serviceSupabase as supabase } from './supabase-service';
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
  const showSignupsPublic =
    publishedOnly && (eventRow.show_signups ?? true);

  // Public: never select email/cancel_token. Comments only when we may return them
  // (show_signups); still redact per-slot in the mapper unless comment_show_publicly.
  const signupsSelect = publishedOnly
    ? showSignupsPublic
      ? 'signups (id, name, comment, cancelled)'
      : 'signups (id, name, cancelled)'
    : 'signups (*)';
  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select(`
      *,
      ${signupsSelect}
    `)
    .eq('event_id', eventId)
    .order(eventRow.signup_type === 'simple' ? 'role_name' : 'start_time', {
      ascending: true,
      nullsFirst: true,
    });

  if (slotsError) return null;

  const slotsWithSignups: SlotWithSignups[] = (slots || []).map(
    (s: Slot & { signups: Signup[] }) => {
      const active = s.signups.filter((sig) => !sig.cancelled);
      if (!publishedOnly) {
        return { ...s, signups: active };
      }
      const signups = active.map((sig) => {
        const safeComment =
          showSignupsPublic && s.comment_show_publicly
            ? (sig.comment ?? null)
            : null;
        return {
          ...sig,
          email: null,
          comment: safeComment,
          cancel_token: '',
        } as Signup;
      });
      return { ...s, signups };
    }
  );

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
  reminder_opt_in?: boolean;
  reminder_offset?: '1_day' | 'morning_of';
}) {
  const { data, error } = await supabase
    .from('signups')
    // @ts-expect-error Supabase Insert type inference
    .insert({
      slot_id: params.slotId,
      name: params.name,
      email: params.email,
      comment: params.comment || null,
      source: 'volunteer',
      reminder_opt_in:
        typeof params.reminder_opt_in === 'boolean'
          ? params.reminder_opt_in
          : true,
      reminder_offset: params.reminder_offset || '1_day',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Signup;
}

export async function createOrganizerSignup(params: {
  slotId: string;
  name: string;
  email?: string | null;
  comment?: string | null;
}) {
  const { data, error } = await supabase
    .from('signups')
    // @ts-expect-error Supabase Insert type inference
    .insert({
      slot_id: params.slotId,
      name: params.name,
      email: params.email ?? null,
      comment: params.comment ?? null,
      source: 'organizer',
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
    .order('created_at', { ascending: false });

  if (error) return [];
  const events = (data || []) as Event[];
  if (events.length === 0) return [];

  const { data: hiddenTransfers } = await supabase
    .from('pending_transfers')
    .select('event_id, expires_at, claimed_at')
    .is('claimed_at', null);

  const hiddenIds = new Set<string>();
  (hiddenTransfers ?? []).forEach((row) => {
    const transfer = row as {
      event_id: string;
      expires_at: string;
      claimed_at: string | null;
    };
    if (transfer.claimed_at) return;
    if (new Date(transfer.expires_at).getTime() <= Date.now()) return;
    hiddenIds.add(transfer.event_id);
  });

  return events.filter((e) => !hiddenIds.has(e.id));
}

export async function getEventWithSlotsForDashboard(eventId: string) {
  return getEventWithSlots(eventId, { publishedOnly: false });
}

export async function getPublishedEventsForOrg(organizationId: string) {
  const { data } = await supabase
    .from('events')
    .select('id, title, start_date, end_date, signup_type')
    .eq('organization_id', organizationId)
    .eq('published', true)
    .order('start_date', { ascending: true });
  return (data ?? []) as Array<{
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    signup_type: 'scheduled' | 'simple';
  }>;
}

export async function getOrganizationTimezone(organizationId: string): Promise<string> {
  const { data, error } = await supabase
    .from('organizations')
    .select('timezone')
    .eq('id', organizationId)
    .single();
  if (error || !data) return 'America/New_York';
  return (data as { timezone: string }).timezone || 'America/New_York';
}

export async function getOrgSlugForUser(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('organization_members')
    .select('organizations(slug)')
    .eq('user_id', userId)
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .maybeSingle();
  const row = data as { organizations: { slug: string | null } | null } | null;
  return row?.organizations?.slug ?? null;
}

export { getSlotRemainingCapacity } from './slot-utils';

export async function hasEventWithVolunteerSignup(userId: string): Promise<boolean> {
  const { data: memberships, error: memError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId);

  if (memError || !memberships?.length) return false;

  const orgIds = (memberships as { organization_id: string }[]).map((m) => m.organization_id);

  const { data: orgEvents } = await supabase
    .from('events')
    .select('id')
    .in('organization_id', orgIds);

  if (!orgEvents?.length) return false;

  const eventIds = (orgEvents as { id: string }[]).map((e) => e.id);

  const { data: orgSlots } = await supabase
    .from('slots')
    .select('id')
    .in('event_id', eventIds);

  if (!orgSlots?.length) return false;

  const slotIds = (orgSlots as { id: string }[]).map((s) => s.id);

  const { data: volunteerSignups } = await supabase
    .from('signups')
    .select('id')
    .in('slot_id', slotIds)
    .eq('source', 'volunteer')
    .eq('cancelled', false)
    .limit(1);

  return (volunteerSignups?.length ?? 0) > 0;
}

export async function getEventCountForUser(userId: string): Promise<number> {
  const { data: memberships, error: memError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId);

  if (memError || !memberships?.length) return 0;

  const orgIds = (memberships as { organization_id: string }[]).map((m) => m.organization_id);

  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .in('organization_id', orgIds);

  if (error) return 0;
  return count ?? 0;
}

/** Returns the user_id of the organization owner (first owner in organization_members). */
export async function getOrganizationOwner(organizationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
    .limit(1)
    .single();

  if (error || !data) return null;
  return (data as { user_id: string }).user_id;
}

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
