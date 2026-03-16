import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendSignupReminder } from '@/lib/email';
import type { Event, Slot, Signup } from '@/types/database';

const BATCH_SIZE = 50;

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
    if (!rows || rows.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;

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
        organization?: { timezone?: string | null } | null;
      };

      // Edge: simple list without date → skip and tombstone
      if (event.signup_type === 'simple' && !event.start_date) {
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

    return NextResponse.json({ processed });
  } catch (err) {
    console.error('Reminder processing error:', err);
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

  if (offset === '1_day') {
    const baseIso = slot.start_time || event.start_date!;
    const base = getDateInTz(baseIso);
    return new Date(base.getTime() - 24 * 60 * 60 * 1000);
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

