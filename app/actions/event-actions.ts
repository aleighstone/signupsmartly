'use server';

import { createClient } from '@/lib/supabase-server';
import { normalizeCommentLabel } from '@/lib/slot-comment';
import { buildAvailabilitySlotLabel } from '@/lib/slot-label';

/** Convert a local date + HH:MM time into a literal ISO string stored as UTC.
 *  We intentionally do NOT convert time zones — organizer enters 7:30, we store
 *  7:30 UTC so volunteers see the same digits. */
function toLiteralIso(dateStr: string, timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
  const padded = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  return `${dateStr}T${padded}:00.000Z`;
}

// ---------------------------------------------------------------------------
// Shared post-create email (non-blocking)
// ---------------------------------------------------------------------------

async function sendCreatedEmail(params: {
  organizerEmail: string;
  eventId: string;
  eventTitle: string;
  startDate: string | null;
  endDate: string | null;
  signupType: 'scheduled' | 'simple' | 'availability';
}) {
  try {
    const { sendEventCreatedConfirmation } = await import('@/lib/email');
    await sendEventCreatedConfirmation(params);
  } catch (err) {
    console.error('Event created email failed (non-blocking):', err);
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateEventContext {
  organizationId: string;
  createdBy: string;
  published: boolean;
  colorKey: string;
  fontKey: string;
}

export interface ScheduledSlotInput {
  spot_date: string;
  /** Organizer's typed spot name — stored as role_description in the DB */
  role_name: string;
  start_time?: string;
  end_time?: string;
  capacity: number;
  instructions?: string;
  comment_label?: string;
  comment_required?: boolean;
}

export interface SimpleSlotInput {
  role_name: string;
  role_description?: string;
  capacity: number;
  comment_label?: string;
  comment_required?: boolean;
}

export interface AvailabilitySlotInput {
  spot_date: string;
  start_time?: string;
  end_time?: string;
  instructions?: string;
}

export interface CreateScheduledEventInput extends CreateEventContext {
  title: string;
  description?: string;
  location: string;
  show_signups?: boolean;
  slots: ScheduledSlotInput[];
}

export interface CreateSimpleEventInput extends CreateEventContext {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  show_signups?: boolean;
  slots: SimpleSlotInput[];
}

export interface CreateAvailabilityEventInput extends CreateEventContext {
  title: string;
  description?: string;
  location?: string;
  show_signups?: boolean;
  slots: AvailabilitySlotInput[];
}

export interface CreateEventResult {
  id: string;
}

// ---------------------------------------------------------------------------
// Server actions
// ---------------------------------------------------------------------------

export async function createScheduledEvent(
  input: CreateScheduledEventInput,
): Promise<CreateEventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dates = input.slots.map((s) => s.spot_date).filter(Boolean);
  const startDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const endDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
  const showSignups = input.show_signups ?? true;

  const eventPayload = {
    organization_id: input.organizationId,
    created_by: input.createdBy,
    signup_type: 'scheduled' as const,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
    start_date: startDate ? `${startDate}T00:00:00Z` : null,
    end_date: endDate ? `${endDate}T23:59:59Z` : null,
    published: input.published,
    show_signups: showSignups,
    theme: { colorKey: input.colorKey, fontKey: input.fontKey },
  };

  const { data: event, error: eventError } = await supabase
    .from('events')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .insert(eventPayload)
    .select('id')
    .single();

  if (eventError || !event) throw eventError ?? new Error('Failed to create event');

  const eventRow = event as { id: string };

  const slotsToInsert = input.slots.map((s, index) => {
    const date = s.spot_date;
    const startTimeStr = s.start_time?.trim();
    const endTimeStr = s.end_time?.trim();
    return {
      event_id: eventRow.id,
      // role_name in the DB holds the auto-generated date/time label
      role_name: buildAvailabilitySlotLabel({
        spot_date: date,
        start_time: startTimeStr,
        end_time: endTimeStr,
      }),
      // role_description holds the organizer's typed spot name (e.g. "Setup crew")
      role_description: s.role_name || null,
      start_time:
        date && startTimeStr
          ? toLiteralIso(date, startTimeStr)
          : date
            ? `${date}T00:00:00.000Z`
            : null,
      end_time: date && endTimeStr ? toLiteralIso(date, endTimeStr) : null,
      capacity: s.capacity,
      instructions: s.instructions || null,
      comment_label: normalizeCommentLabel(s.comment_label),
      comment_required: s.comment_required ?? false,
      comment_show_publicly: showSignups,
      sort_order: index,
    };
  });

  const { error: slotsError } = await supabase
    .from('slots')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .insert(slotsToInsert);

  if (slotsError) throw slotsError;

  await sendCreatedEmail({
    organizerEmail: user.email!,
    eventId: eventRow.id,
    eventTitle: input.title,
    startDate: startDate ? `${startDate}T00:00:00Z` : null,
    endDate: endDate ? `${endDate}T23:59:59Z` : null,
    signupType: 'scheduled',
  });

  return { id: eventRow.id };
}

export async function createSimpleEvent(
  input: CreateSimpleEventInput,
): Promise<CreateEventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dateVal = input.start_date?.trim();
  const showSignups = input.show_signups ?? true;

  const eventPayload = {
    organization_id: input.organizationId,
    created_by: input.createdBy,
    signup_type: 'simple' as const,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
    start_date: dateVal ? `${dateVal}T00:00:00Z` : null,
    end_date: dateVal ? `${dateVal}T23:59:59Z` : null,
    published: input.published,
    show_signups: showSignups,
    theme: { colorKey: input.colorKey, fontKey: input.fontKey },
  };

  const { data: event, error: eventError } = await supabase
    .from('events')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .insert(eventPayload)
    .select('id')
    .single();

  if (eventError || !event) throw eventError ?? new Error('Failed to create event');

  const eventRow = event as { id: string };

  const slotsToInsert = input.slots.map((s, index) => ({
    event_id: eventRow.id,
    role_name: s.role_name,
    role_description: s.role_description || null,
    start_time: null,
    end_time: null,
    capacity: s.capacity,
    instructions: null,
    comment_label: normalizeCommentLabel(s.comment_label),
    comment_required: s.comment_required ?? false,
    comment_show_publicly: showSignups,
    sort_order: index,
  }));

  const { error: slotsError } = await supabase
    .from('slots')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .insert(slotsToInsert);

  if (slotsError) throw slotsError;

  await sendCreatedEmail({
    organizerEmail: user.email!,
    eventId: eventRow.id,
    eventTitle: input.title,
    startDate: dateVal ? `${dateVal}T00:00:00Z` : null,
    endDate: dateVal ? `${dateVal}T23:59:59Z` : null,
    signupType: 'simple',
  });

  return { id: eventRow.id };
}

export async function createAvailabilityEvent(
  input: CreateAvailabilityEventInput,
): Promise<CreateEventResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const datedSlots = input.slots.filter((s) => s.spot_date);
  const dates = datedSlots.map((s) => s.spot_date).filter(Boolean);
  const startDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const endDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
  const showSignups = input.show_signups ?? true;

  const eventPayload = {
    organization_id: input.organizationId,
    created_by: input.createdBy,
    signup_type: 'availability' as const,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
    start_date: startDate ? `${startDate}T00:00:00Z` : null,
    end_date: endDate ? `${endDate}T23:59:59Z` : null,
    published: input.published,
    show_signups: showSignups,
    theme: { colorKey: input.colorKey, fontKey: input.fontKey },
  };

  const { data: event, error: eventError } = await supabase
    .from('events')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .insert(eventPayload)
    .select('id')
    .single();

  if (eventError || !event) throw eventError ?? new Error('Failed to create poll');

  const eventRow = event as { id: string };

  const slotsToInsert = input.slots.map((s, index) => {
    const date = s.spot_date?.trim();
    const startTimeStr = s.start_time?.trim();
    const endTimeStr = s.end_time?.trim();
    return {
      event_id: eventRow.id,
      role_name: buildAvailabilitySlotLabel({
        spot_date: date ?? '',
        start_time: startTimeStr,
        end_time: endTimeStr,
      }),
      role_description: s.instructions || null,
      start_time:
        date && startTimeStr
          ? toLiteralIso(date, startTimeStr)
          : date
            ? `${date}T00:00:00.000Z`
            : null,
      end_time: date && endTimeStr ? toLiteralIso(date, endTimeStr) : null,
      capacity: 9999,
      instructions: null,
      comment_label: normalizeCommentLabel(null),
      comment_required: false,
      comment_show_publicly: showSignups,
      sort_order: index,
    };
  });

  const { error: slotsError } = await supabase
    .from('slots')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .insert(slotsToInsert);

  if (slotsError) throw slotsError;

  await sendCreatedEmail({
    organizerEmail: user.email!,
    eventId: eventRow.id,
    eventTitle: input.title,
    startDate: startDate ? `${startDate}T00:00:00Z` : null,
    endDate: endDate ? `${endDate}T23:59:59Z` : null,
    signupType: 'availability',
  });

  return { id: eventRow.id };
}

// ---------------------------------------------------------------------------
// Update draft actions — reuse the same slot-building logic as create, but
// update an existing (draft) event in place. Slots are replaced entirely
// (delete-all then re-insert), which is safe because drafts have no signups.
// ---------------------------------------------------------------------------

async function replaceSlotsForDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  slotsToInsert: Record<string, unknown>[],
) {
  await supabase.from('slots').delete().eq('event_id', eventId);
  const { error } = await supabase
    .from('slots')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .insert(slotsToInsert);
  if (error) throw error;
}

export async function updateDraftScheduledEvent(
  eventId: string,
  input: CreateScheduledEventInput,
): Promise<CreateEventResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dates = input.slots.map((s) => s.spot_date).filter(Boolean);
  const startDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const endDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
  const showSignups = input.show_signups ?? true;

  await supabase
    .from('events')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .update({
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      start_date: startDate ? `${startDate}T00:00:00Z` : null,
      end_date: endDate ? `${endDate}T23:59:59Z` : null,
      published: input.published,
      show_signups: showSignups,
      theme: { colorKey: input.colorKey, fontKey: input.fontKey },
    })
    .eq('id', eventId);

  const slotsToInsert = input.slots.map((s, index) => {
    const date = s.spot_date;
    const startTimeStr = s.start_time?.trim();
    const endTimeStr = s.end_time?.trim();
    return {
      event_id: eventId,
      role_name: buildAvailabilitySlotLabel({ spot_date: date, start_time: startTimeStr, end_time: endTimeStr }),
      role_description: s.role_name || null,
      start_time: date && startTimeStr ? toLiteralIso(date, startTimeStr) : date ? `${date}T00:00:00.000Z` : null,
      end_time: date && endTimeStr ? toLiteralIso(date, endTimeStr) : null,
      capacity: s.capacity,
      instructions: s.instructions || null,
      comment_label: normalizeCommentLabel(s.comment_label),
      comment_required: s.comment_required ?? false,
      comment_show_publicly: showSignups,
      sort_order: index,
    };
  });

  await replaceSlotsForDraft(supabase, eventId, slotsToInsert);
  return { id: eventId };
}

export async function updateDraftSimpleEvent(
  eventId: string,
  input: CreateSimpleEventInput,
): Promise<CreateEventResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dateVal = input.start_date?.trim();
  const showSignups = input.show_signups ?? true;

  await supabase
    .from('events')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .update({
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      start_date: dateVal ? `${dateVal}T00:00:00Z` : null,
      end_date: dateVal ? `${dateVal}T23:59:59Z` : null,
      published: input.published,
      show_signups: showSignups,
      theme: { colorKey: input.colorKey, fontKey: input.fontKey },
    })
    .eq('id', eventId);

  const slotsToInsert = input.slots.map((s, index) => ({
    event_id: eventId,
    role_name: s.role_name,
    role_description: s.role_description || null,
    start_time: null,
    end_time: null,
    capacity: s.capacity,
    instructions: null,
    comment_label: normalizeCommentLabel(s.comment_label),
    comment_required: s.comment_required ?? false,
    comment_show_publicly: showSignups,
    sort_order: index,
  }));

  await replaceSlotsForDraft(supabase, eventId, slotsToInsert);
  return { id: eventId };
}

export async function updateDraftAvailabilityEvent(
  eventId: string,
  input: CreateAvailabilityEventInput,
): Promise<CreateEventResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const datedSlots = input.slots.filter((s) => s.spot_date);
  const dates = datedSlots.map((s) => s.spot_date).filter(Boolean);
  const startDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const endDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
  const showSignups = input.show_signups ?? true;

  await supabase
    .from('events')
    // @ts-expect-error Supabase SSR createServerClient return type incompatibility with Database
    .update({
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      start_date: startDate ? `${startDate}T00:00:00Z` : null,
      end_date: endDate ? `${endDate}T23:59:59Z` : null,
      published: input.published,
      show_signups: showSignups,
      theme: { colorKey: input.colorKey, fontKey: input.fontKey },
    })
    .eq('id', eventId);

  const slotsToInsert = input.slots.map((s, index) => {
    const date = s.spot_date?.trim();
    const startTimeStr = s.start_time?.trim();
    const endTimeStr = s.end_time?.trim();
    return {
      event_id: eventId,
      role_name: buildAvailabilitySlotLabel({ spot_date: date ?? '', start_time: startTimeStr, end_time: endTimeStr }),
      role_description: s.instructions || null,
      start_time: date && startTimeStr ? toLiteralIso(date, startTimeStr) : date ? `${date}T00:00:00.000Z` : null,
      end_time: date && endTimeStr ? toLiteralIso(date, endTimeStr) : null,
      capacity: 9999,
      instructions: null,
      comment_label: normalizeCommentLabel(null),
      comment_required: false,
      comment_show_publicly: showSignups,
      sort_order: index,
    };
  });

  await replaceSlotsForDraft(supabase, eventId, slotsToInsert);
  return { id: eventId };
}
