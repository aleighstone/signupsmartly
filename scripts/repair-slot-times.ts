/**
 * Repair slot times for events affected by the timezone bug.
 *
 * The bug: Old code stored times as UTC instants (browser local → UTC). The app
 * displayed them in org timezone, causing confusion when organizer and org tz differed.
 *
 * The fix: Convert stored values to "literal" format — take what would have displayed
 * in the org's timezone and re-store it so the new display logic shows the same time.
 *
 * Usage:
 *   npm run repair-slots -- [--dry-run] <event-id | slot-id | signup-id>
 *
 * Loads .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const id = args.find((a) => !a.startsWith('--'));
if (!id) {
  console.error('Usage: npx tsx scripts/repair-slot-times.ts [--dry-run] <event-id | slot-id | signup-id>');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function toLiteralIso(isoString: string, timezone: string): string {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const pad = (s: string) => s.padStart(2, '0');
  const year = get('year');
  const month = pad(get('month'));
  const day = pad(get('day'));
  const hour = pad(get('hour'));
  const minute = pad(get('minute'));
  return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
}

async function main() {
  // Resolve ID to event
  let eventId: string | null = null;
  let orgId: string | null = null;

  const { data: eventById } = await supabase.from('events').select('id, organization_id').eq('id', id).single();
  if (eventById) {
    eventId = eventById.id;
    orgId = eventById.organization_id;
  }

  if (!eventId) {
    const { data: slotRow } = await supabase.from('slots').select('event_id').eq('id', id).single();
    if (slotRow) {
      const { data: ev } = await supabase.from('events').select('id, organization_id').eq('id', slotRow.event_id).single();
      if (ev) {
        eventId = ev.id;
        orgId = ev.organization_id;
      }
    }
  }

  if (!eventId) {
    const { data: signupRow } = await supabase.from('signups').select('slot_id').eq('id', id).single();
    if (signupRow) {
      const { data: slotRow } = await supabase.from('slots').select('event_id').eq('id', signupRow.slot_id).single();
      if (slotRow) {
        const { data: ev } = await supabase.from('events').select('id, organization_id').eq('id', slotRow.event_id).single();
        if (ev) {
          eventId = ev.id;
          orgId = ev.organization_id;
        }
      }
    }
  }

  if (!eventId || !orgId) {
    console.error('Could not find event, slot, or signup with id:', id);
    process.exit(1);
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('timezone, name')
    .eq('id', orgId)
    .single();

  const timezone = (org?.timezone as string) || 'America/New_York';

  const { data: slots } = await supabase
    .from('slots')
    .select('id, role_name, start_time, end_time')
    .eq('event_id', eventId);

  if (!slots?.length) {
    console.log('No slots found for this event.');
    return;
  }

  const withTimes = slots.filter((s) => s.start_time != null);
  if (withTimes.length === 0) {
    console.log('No slots with start_time to repair.');
    return;
  }

  if (dryRun) console.log('DRY RUN (no changes will be made)\n');
  console.log(`Repairing ${withTimes.length} slot(s) for org "${org?.name ?? 'Unknown'}" (timezone: ${timezone})\n`);

  for (const slot of withTimes) {
    const newStart = toLiteralIso(slot.start_time!, timezone);
    const newEnd = slot.end_time ? toLiteralIso(slot.end_time, timezone) : null;
    const changed =
      slot.start_time !== newStart || (slot.end_time ?? null) !== newEnd;
    if (changed) {
      console.log(`  ${slot.role_name}:`);
      console.log(`    start: ${slot.start_time} → ${newStart}`);
      if (slot.end_time) console.log(`    end:   ${slot.end_time} → ${newEnd}`);
      if (!dryRun) {
        const { error } = await supabase
          .from('slots')
          .update({
            start_time: newStart,
            end_time: newEnd,
          })
          .eq('id', slot.id);
        if (error) {
          console.error(`    ERROR: ${error.message}`);
        } else {
          console.log(`    ✓ Updated`);
        }
      } else {
        console.log(`    (would update)`);
      }
    } else {
      console.log(`  ${slot.role_name}: no change needed`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
