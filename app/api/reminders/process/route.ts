import { NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';
import {
  sendSignupReminder,
  sendOrganizerDigest,
  sendFounderNewEventsDigest,
} from '@/lib/email';
import { reportProductionError } from '@/lib/error-reporter';
import { effectiveNotificationPreference } from '@/lib/notifications';
import type { Event, Slot, Signup } from '@/types/database';

const BATCH_SIZE = 50;

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/Bearer\s+/i, '').trim();
    if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: rows, error } = await supabase
      .from('signups')
      .select(
        `
        *,
        slots (
          *,
          event:events (
            *,
            organization:organizations (*)
          )
        )
      `
      )
      .eq('cancelled', false)
      .eq('reminder_opt_in', true)
      .is('reminder_sent_at', null)
      .limit(BATCH_SIZE);

    if (error) throw error;

    let processed = 0;

    if (rows && rows.length > 0) {
      for (const row of rows) {
        // Narrow types
        const signup = row as Signup & {
          slots?: {
            id: string;
            start_time: string | null;
            end_time: string | null;
            event?: Event & {
              organization?: { timezone?: string | null } | null;
            } | null;
          };
        };

        const slotData = signup.slots;
        const slot = (Array.isArray(slotData) ? slotData[0] : slotData) as
          | (Slot & {
              event?: Event & {
                organization?: { timezone?: string | null } | null;
              };
            })
          | undefined;

        if (!slot || !slot.event) {
          // Tombstone so we don't retry forever
          await markReminderSent(signup.id);
          continue;
        }

        const event = slot.event as Event & {
          archived: boolean;
          organization?: { timezone?: string | null } | null;
        };

        // Edge: simple list without date → skip and tombstone
        if (event.signup_type === 'simple' && !event.start_date) {
          await markReminderSent(signup.id);
          continue;
        }

        if (event.archived) {
          await markReminderSent(signup.id);
          continue;
        }

        const timezone = event.organization?.timezone || 'America/New_York';
        const sendAt = computeSendTime({
          signup,
          slot,
          event,
          timezone,
        });

        if (!sendAt) {
          await markReminderSent(signup.id);
          continue;
        }

        // Skip and tombstone if the reminder window has passed by more than 24 hours
        if (sendAt.getTime() < twentyFourHoursAgo.getTime()) {
          await markReminderSent(signup.id);
          continue;
        }

        // Daily cron: send any reminders whose target time has passed within the last 24 hours
        if (sendAt.getTime() <= now.getTime()) {
          try {
            await sendSignupReminder({
              signup,
              slot: slot as Slot,
              event: event as Event,
            });
            await markReminderSent(signup.id);
            processed += 1;
          } catch (err) {
            console.error('Failed to send reminder for signup', signup.id, err);
            // Do not mark reminder_sent_at so it can retry
          }
        }
      }
    }

    // --- Organizer digest passes ---
    const digestProcessed = await runOrganizerDigests(now);
    const founderDigest = await runFounderNewEventsDigest(now);
    return NextResponse.json({
      processed,
      digestProcessed,
      founderDigest,
    });
  } catch (err) {
    console.error('Reminder processing error:', err);
    await reportProductionError({ error: err, request, status: 500, extra: { handler: 'reminders/process' } }).catch(() => {});
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

function computeSendTime(params: {
  signup: Signup;
  slot: Slot;
  event: Event;
  timezone: string;
}): Date | null {
  const { slot, event, signup, timezone } = params;
  const offset = signup.reminder_offset || '1_day';

  // Base date: slot start_time if present, else event start_date
  if (!event.start_date && !slot.start_time) {
    return null;
  }

  const orgTz = timezone || 'America/New_York';

  const getDateInTz = (iso: string) =>
    new Date(
      new Intl.DateTimeFormat('en-US', {
        timeZone: orgTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(iso))
    );

  if (offset === '1_week') {
    const baseIso = slot.start_time || event.start_date!;
    const base = getDateInTz(baseIso);
    return new Date(base.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (offset === '3_days') {
    const baseIso = slot.start_time || event.start_date!;
    const base = getDateInTz(baseIso);
    return new Date(base.getTime() - 3 * 24 * 60 * 60 * 1000);
  }

  if (offset === '1_day') {
    const baseIso = slot.start_time || event.start_date!;
    const base = getDateInTz(baseIso);
    return new Date(base.getTime() - 24 * 60 * 60 * 1000);
  }

  if (offset === '1_hour') {
    const baseIso = slot.start_time || event.start_date!;
    const base = getDateInTz(baseIso);
    return new Date(base.getTime() - 60 * 60 * 1000);
  }

  if (offset === 'morning_of') {
    const dateIso = slot.start_time || event.start_date!;
    const date = new Date(dateIso);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: orgTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((p) => p.type === 'year')?.value);
    const month = Number(parts.find((p) => p.type === 'month')?.value) - 1;
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    return new Date(Date.UTC(year, month, day, 8, 0, 0));
  }

  return null;
}

async function markReminderSent(signupId: string) {
  await supabase
    .from('signups')
    // @ts-expect-error Supabase Update type inference
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', signupId);
}

type DigestRow = {
  id: string;
  user_id: string;
  event_id: string;
  signup_id: string;
  created_at: string;
  digest_sent_at: string | null;
  signups: { id: string; cancelled: boolean; name: string; email: string | null; comment: string | null } | null;
  events: {
    id: string;
    title: string;
    signup_type: 'scheduled' | 'simple';
    start_date: string | null;
    location: string | null;
    notification_override: 'instant' | 'daily' | 'weekly' | 'never' | null;
  } | null;
  slots: { id: string; role_name: string; start_time: string | null; end_time: string | null } | null;
  users: { email: string; notification_preference: 'instant' | 'daily' | 'weekly' | 'never' } | null;
};

async function runOrganizerDigests(now: Date): Promise<number> {
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const isMonday = now.getUTCDay() === 1;

  let digestProcessed = 0;

  // Pass 1: Daily digests
  const { data: dailyRows } = await supabase
    .from('organizer_notification_digest')
    .select(
      `
      id, user_id, event_id, signup_id, created_at, digest_sent_at,
      signups (id, cancelled, name, email, comment),
      events (id, title, signup_type, start_date, location, notification_override),
      slots (id, role_name, start_time, end_time),
      users (email, notification_preference)
    `
    )
    .is('digest_sent_at', null)
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .limit(200);

  const dailyByUser = groupAndFilterDigestRows(
    (dailyRows || []) as DigestRow[],
    'daily'
  );

  for (const [, eventsMap] of Array.from(dailyByUser.entries())) {
    const firstRow = Array.from(eventsMap.values()).flat()[0];
    const organizerEmail = (firstRow as DigestRow).users?.email;
    if (!organizerEmail) continue;

    const signupsByEvent = new Map<string, { signup: Signup; slot: Slot; event: Event }[]>();
    const digestIds: string[] = [];

    for (const [eventId, rows] of Array.from(eventsMap.entries())) {
      const signupRows = rows
        .filter((r) => r.signups && !r.signups.cancelled && r.slots && r.events)
        .map((r) => ({
          signup: { ...r.signups!, cancel_token: '', created_at: '', reminder_opt_in: true, reminder_offset: '1_day' as const, reminder_sent_at: null, slot_id: r.slots!.id, cancelled: false, source: 'volunteer' as const },
          slot: r.slots as unknown as Slot,
          event: r.events as unknown as Event,
          digestId: r.id,
        }));
      if (signupRows.length === 0) continue;
      signupsByEvent.set(eventId, signupRows.map((s) => ({ signup: s.signup, slot: s.slot, event: s.event })));
      digestIds.push(...signupRows.map((s) => s.digestId));
    }

    if (signupsByEvent.size === 0) continue;

    try {
      await sendOrganizerDigest({
        organizerEmail,
        signupsByEvent,
        isWeekly: false,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('organizer_notification_digest')
        .update({ digest_sent_at: now.toISOString() })
        .in('id', digestIds);
      digestProcessed += 1;
    } catch (err) {
      console.error('Failed to send daily digest to', organizerEmail, err);
    }
  }

  // Pass 2: Weekly digests (Mondays only)
  if (isMonday) {
    const { data: weeklyRows } = await supabase
      .from('organizer_notification_digest')
      .select(
        `
        id, user_id, event_id, signup_id, created_at, digest_sent_at,
        signups (id, cancelled, name, email, comment),
        events (id, title, signup_type, start_date, location, notification_override),
        slots (id, role_name, start_time, end_time),
        users (email, notification_preference)
      `
      )
      .is('digest_sent_at', null)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(200);

    const weeklyByUser = groupAndFilterDigestRows(
      (weeklyRows || []) as DigestRow[],
      'weekly'
    );

    for (const [, eventsMap] of Array.from(weeklyByUser.entries())) {
      const firstRow = Array.from(eventsMap.values()).flat()[0];
      const organizerEmail = (firstRow as DigestRow).users?.email;
      if (!organizerEmail) continue;

      const signupsByEvent = new Map<string, { signup: Signup; slot: Slot; event: Event }[]>();
      const digestIds: string[] = [];

      for (const [eventId, rows] of Array.from(eventsMap.entries())) {
        const signupRows = rows
          .filter((r) => r.signups && !r.signups.cancelled && r.slots && r.events)
          .map((r) => ({
            signup: { ...r.signups!, cancel_token: '', created_at: '', reminder_opt_in: true, reminder_offset: '1_day' as const, reminder_sent_at: null, slot_id: r.slots!.id, cancelled: false, source: 'volunteer' as const },
            slot: r.slots as unknown as Slot,
            event: r.events as unknown as Event,
            digestId: r.id,
          }));
        if (signupRows.length === 0) continue;
        signupsByEvent.set(eventId, signupRows.map((s) => ({ signup: s.signup, slot: s.slot, event: s.event })));
        digestIds.push(...signupRows.map((s) => s.digestId));
      }

      if (signupsByEvent.size === 0) continue;

      try {
        await sendOrganizerDigest({
          organizerEmail,
          signupsByEvent,
          isWeekly: true,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('organizer_notification_digest')
          .update({ digest_sent_at: now.toISOString() })
          .in('id', digestIds);
        digestProcessed += 1;
      } catch (err) {
        console.error('Failed to send weekly digest to', organizerEmail, err);
      }
    }
  }

  return digestProcessed;
}

async function runFounderNewEventsDigest(now: Date): Promise<{
  sent: boolean;
  count: number;
}> {
  const to = process.env.FOUNDER_DIGEST_EMAIL?.trim();
  if (!to) {
    return { sent: false, count: 0 };
  }

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      signup_type,
      created_at,
      users!events_created_by_fkey ( email, name )
    `
    )
    .eq('published', true)
    .eq('archived', false)
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .not('created_by', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  type FounderEventRow = {
    id: string;
    title: string;
    signup_type: string;
    created_at: string;
    users:
      | { email: string; name: string }
      | { email: string; name: string }[]
      | null;
  };

  const events: {
    id: string;
    title: string;
    signupType: 'scheduled' | 'simple';
    creatorEmail: string;
    creatorName: string | null;
  }[] = [];

  for (const row of (data || []) as FounderEventRow[]) {
    const u = row.users;
    const user = Array.isArray(u) ? u[0] : u;
    if (!user?.email) continue;
    const st = row.signup_type === 'simple' ? 'simple' : 'scheduled';
    events.push({
      id: row.id,
      title: row.title,
      signupType: st,
      creatorEmail: user.email,
      creatorName: user.name ?? null,
    });
  }

  if (events.length === 0) {
    return { sent: false, count: 0 };
  }

  await sendFounderNewEventsDigest({ to, events });
  return { sent: true, count: events.length };
}

function groupAndFilterDigestRows(
  rows: DigestRow[],
  targetPref: 'daily' | 'weekly'
): Map<string, Map<string, DigestRow[]>> {
  const byUser = new Map<string, Map<string, DigestRow[]>>();

  for (const row of rows) {
    if (!row.users || !row.events) continue;
    const userPref = row.users.notification_preference ?? 'daily';
    const eventOverride = row.events.notification_override;
    const effective = effectiveNotificationPreference(userPref, eventOverride);

    if (effective === 'never') continue;
    if (eventOverride === 'never') continue;
    if (effective !== targetPref) continue;
    if (row.signups?.cancelled) continue;

    let userMap = byUser.get(row.user_id);
    if (!userMap) {
      userMap = new Map();
      byUser.set(row.user_id, userMap);
    }
    let eventList = userMap.get(row.event_id);
    if (!eventList) {
      eventList = [];
      userMap.set(row.event_id, eventList);
    }
    eventList.push(row);
  }

  return byUser;
}

