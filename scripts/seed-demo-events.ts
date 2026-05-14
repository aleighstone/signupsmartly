/**
 * Seed demo events for local development and E2E testing.
 *
 * Creates 7 events with slots and pre-filled signups using Will Ferrell movie
 * character names. Most dates track from today; availability polls pin to May/June 2026.
 *
 * Events created:
 *   1. Spring Track Meet        — single-date, many roles   → E2E_TEST_EVENT_ID
 *   2. Parent-Teacher Conf.     — single-date, appointment slots
 *   3. Baseball Snack Duty      — multi-date (spans weeks)  → E2E_TEST_MULTI_DATE_EVENT_ID
 *   4. Book Club                — simple list (no dates)
 *   5. Parents Dinner Poll      — availability (May 2026 Fri/Sat)
 *   6. Crystal's Mahjong Poll   — availability (June 2026 Wed/Thu)
 *   7. Playwright Stable Draft  — always a draft            → E2E_TEST_DRAFT_EVENT_ID
 *
 * At the end the script prints E2E IDs (and optional DEMO_POLL_* IDs for the new polls) for .env.local copy-paste.
 *
 * Usage:
 *   npm run seed-demo
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (in .env.local)
 *
 * Optional: SEED_ORGANIZATION_ID to force organizations.id (otherwise resolved via organization_members).
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { randomUUID } from 'crypto';
const ORGANIZER_EMAIL = process.env.E2E_ORGANIZER_EMAIL ?? 'allisonleighstone@gmail.com';

const TEST_EMAILS = [
  'allison.troup@gmail.com',
  'alliejunknextera@gmail.com',
  'stoney1252@gmail.com',
];

// Will Ferrell movie characters
const CHARACTERS = [
  { name: 'Ron Burgundy', email: 0 },
  { name: 'Brick Tamland', email: 1 },
  { name: 'Brennan Huff', email: 0 },
  { name: 'Dale Doback', email: 2 },
  { name: 'Ricky Bobby', email: 1 },
  { name: 'Cal Naughton Jr.', email: 0 },
  { name: 'Buddy', email: 2 },
  { name: 'Brian Fantana', email: 1 },
  { name: 'Champ Kind', email: 0 },
  { name: 'Derek Huff', email: 2 },
];

// ─── Date helpers ──────────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string for today + N days (UTC). */
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/** Returns an ISO timestamp for a given YYYY-MM-DD date and HH:MM time (stored as UTC). */
function ts(date: string, time: string): string {
  const [h, m] = time.split(':').map((x) => parseInt(x, 10) || 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date}T${pad(h)}:${pad(m)}:00.000Z`;
}

/** Mirrors production availability posts: reminders off + optional grouped responses. */
async function insertAvailabilitySeedSignup(
  supabase: ReturnType<typeof createClient<Database>>,
  slotId: string,
  name: string,
  email: string,
  source: 'volunteer' | 'organizer',
  responseGroupId: string | null
): Promise<void> {
  await supabase.from('signups').insert({
    slot_id: slotId,
    name,
    email,
    source,
    cancel_token: randomUUID(),
    reminder_opt_in: false,
    reminder_offset: '1_day',
    response_group_id: responseGroupId,
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Look up the organizer UUID from auth — avoids any hardcoded UUID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list auth users:', listError.message);
    console.error('Make sure you ran: npm run setup-local');
    process.exit(1);
  }
  const organizer = users.find((u) => u.email === ORGANIZER_EMAIL);
  if (!organizer) {
    console.error(`Organizer not found in auth.users with email: ${ORGANIZER_EMAIL}`);
    console.error('Run: npm run setup-local');
    process.exit(1);
  }
  const ORGANIZER_USER_ID = organizer.id;

  const orgFromEnv = process.env.SEED_ORGANIZATION_ID?.trim();
  let ORGANIZATION_ID;
  if (orgFromEnv) {
    ORGANIZATION_ID = orgFromEnv;
    console.log('Using SEED_ORGANIZATION_ID from environment.');
  } else {
    const { data: orgRows, error: orgMembershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', ORGANIZER_USER_ID)
      .limit(1);
    if (orgMembershipError) {
      console.error('Could not look up organization membership:', orgMembershipError.message);
      process.exit(1);
    }
    const oid = orgRows?.[0]?.organization_id;
    if (!oid) {
      console.error('No organization linked to this organizer:', ORGANIZER_EMAIL);
      console.error('Run: npm run setup-local');
      process.exit(1);
    }
    ORGANIZATION_ID = oid;
  }

  console.log('\nSeeding into organization:', ORGANIZATION_ID);

  let charIdx = 0;
  function nextSignup(source: 'volunteer' | 'organizer') {
    const c = CHARACTERS[charIdx % CHARACTERS.length];
    charIdx++;
    return { name: c.name, email: TEST_EMAILS[c.email], source };
  }

  console.log('Seeding demo events...\n');

  // ─── 1. Track Meet — single-date, 3 weeks from now ────────────────────────
  // This is E2E_TEST_EVENT_ID (single-date → time-hero visual hierarchy)
  const trackMeetDate = futureDate(21);
  const { data: e1, error: err1 } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Spring Track Meet #3 — Parent Volunteers',
      description:
        'We need parent volunteers to help run our spring meet! Please sign up for a shift. Arrive 10 minutes before your slot starts. Questions? Email falconsvolunteer@gmail',
      location: 'Crescenta Valley High School Track, 180 Campus Dr, La Crescenta CA',
      start_date: `${trackMeetDate}T00:00:00.000Z`,
      end_date: `${trackMeetDate}T23:59:59.000Z`,
      signup_type: 'scheduled',
      published: true,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (err1 || !e1) { console.error('Track Meet insert failed:', err1); process.exit(1); }

  const trackSlots = [
    { role_name: 'Setup Crew', start: '7:00', end: '8:30', cap: 4, instructions: 'Help set up tables, signage, and equipment before the meet begins' },
    { role_name: 'Registration & Check-In', start: '8:00', end: '9:30', cap: 3, instructions: 'Distribute race bibs and check in arriving athletes' },
    { role_name: 'Timer', start: '9:00', end: '12:00', cap: 6, instructions: "Each timer is assigned to a lane with a stopwatch — no experience needed, we'll train you" },
    { role_name: 'Finish Line Judge', start: '9:00', end: '12:00', cap: 4, instructions: 'Record finish order for sprint events and relay handoffs' },
    { role_name: 'Concessions Table', start: '9:00', end: '13:00', cap: 2, instructions: 'Run the snack and drink table for athletes and spectators' },
    { role_name: 'Cleanup Crew', start: '12:00', end: '13:30', cap: 4, instructions: 'Break down tables, collect equipment, and do a field sweep' },
  ];

  for (const s of trackSlots) {
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: e1.id,
        role_name: s.role_name,
        start_time: ts(trackMeetDate, s.start),
        end_time: ts(trackMeetDate, s.end),
        capacity: s.cap,
        instructions: s.instructions,
      })
      .select('id')
      .single();

    if (!slot) continue;

    const signups: { slot_id: string; name: string; email: string; source: 'volunteer' | 'organizer' }[] = [];
    if (s.role_name === 'Setup Crew') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot.id });
      signups.push({ ...nextSignup('organizer'), slot_id: slot.id });
    } else if (s.role_name === 'Registration & Check-In') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot.id });
    } else if (s.role_name === 'Timer') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot.id });
      signups.push({ ...nextSignup('volunteer'), slot_id: slot.id });
      signups.push({ ...nextSignup('organizer'), slot_id: slot.id });
    } else if (s.role_name === 'Finish Line Judge') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot.id });
      signups.push({ ...nextSignup('organizer'), slot_id: slot.id });
    } else if (s.role_name === 'Cleanup Crew') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot.id });
    }

    for (const sig of signups) {
      await supabase.from('signups').insert({
        slot_id: sig.slot_id,
        name: sig.name,
        email: sig.email,
        source: sig.source,
        cancel_token: randomUUID(),
        reminder_opt_in: true,
        reminder_offset: '1_day',
      });
    }
  }
  console.log('✓ Track Meet (Spring Track Meet #3) —', trackMeetDate);

  // ─── 2. Parent Teacher Conferences — single-date, 5 weeks from now ────────
  const confDate = futureDate(35);
  const { data: e2, error: err2 } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Spring Conferences — Ms. Chen, Room 14',
      description:
        'Sign up for a 15-minute conference slot. Please arrive a few minutes early. If you need to reschedule, email mchen@jeffersonelem.edu at least 24 hours in advance.',
      location: 'Jefferson Elementary School, 400 Oak Ave, Room 14',
      start_date: `${confDate}T00:00:00.000Z`,
      end_date: `${confDate}T23:59:59.000Z`,
      signup_type: 'scheduled',
      published: true,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (err2 || !e2) { console.error('Conferences insert failed:', err2); process.exit(1); }

  const confSlots = [
    { start: '15:00', end: '15:15' },
    { start: '15:15', end: '15:30' },
    { start: '15:30', end: '15:45' },
    { start: '15:45', end: '16:00' },
    { start: '16:15', end: '16:30' },
    { start: '16:30', end: '16:45' },
    { start: '18:00', end: '18:15' },
    { start: '18:15', end: '18:30' },
    { start: '18:30', end: '18:45' },
  ];

  for (let i = 0; i < confSlots.length; i++) {
    const s = confSlots[i];
    const desc = i >= 6 ? 'Evening slot — 15-minute individual conference' : '15-minute individual conference';
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: e2.id,
        role_name: 'Parent Conference',
        start_time: ts(confDate, s.start),
        end_time: ts(confDate, s.end),
        capacity: 1,
        instructions: desc,
      })
      .select('id')
      .single();

    if (!slot) continue;
    if ([0, 2, 4, 7].includes(i)) {
      const sig = nextSignup(i === 7 ? 'organizer' : 'volunteer');
      await supabase.from('signups').insert({
        slot_id: slot.id,
        name: sig.name,
        email: sig.email,
        source: sig.source,
        cancel_token: randomUUID(),
        reminder_opt_in: true,
        reminder_offset: '1_day',
      });
    }
  }
  console.log('✓ Parent Teacher Conferences —', confDate);

  // ─── 3. Baseball Snack Duty — multi-date, spans several weeks ─────────────
  // This is E2E_TEST_MULTI_DATE_EVENT_ID (multi-date → date-hero visual hierarchy)
  const baseballStart = futureDate(7);
  const baseballEnd = futureDate(84); // ~12 weeks
  const { data: e3, error: err3 } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Mustangs Baseball — Spring Snack Duty',
      description:
        'One family per game brings snacks for the whole team after the final out. Please bring enough for 15 kids plus 2 coaches. Arrive with snacks by warm-up time. Individual bagged snacks and drinks work great!',
      location: 'Riverside Park, Field 3',
      start_date: `${baseballStart}T00:00:00.000Z`,
      end_date: `${baseballEnd}T23:59:59.000Z`,
      signup_type: 'scheduled',
      published: true,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (err3 || !e3) { console.error('Baseball insert failed:', err3); process.exit(1); }

  const baseballGames = [
    { offset: 7,  label: 'Game 1 — Home',          start: '9:30',  end: '11:00' },
    { offset: 14, label: 'Game 2 — Away',           start: '9:30',  end: '11:00' },
    { offset: 21, label: 'Game 3 — Home',           start: '11:30', end: '13:00' },
    { offset: 35, label: 'Game 4 — Home',           start: '9:30',  end: '11:00' },
    { offset: 56, label: 'Game 5 — Home',           start: '11:30', end: '13:00' },
    { offset: 84, label: 'Game 6 — Last Game! 🎉', start: '9:30',  end: '11:00' },
  ];

  for (let i = 0; i < baseballGames.length; i++) {
    const g = baseballGames[i];
    const gameDate = futureDate(g.offset);
    const instructions = i === 5
      ? 'End of season! Feel free to go all out 🎉'
      : 'Post-game snacks for ~14 players';
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: e3.id,
        role_name: g.label,
        start_time: ts(gameDate, g.start),
        end_time: ts(gameDate, g.end),
        capacity: 1,
        instructions,
      })
      .select('id')
      .single();

    if (!slot) continue;
    // Fill games 1, 3, 6
    if ([0, 2, 5].includes(i)) {
      const sig = nextSignup(i === 2 ? 'organizer' : 'volunteer');
      await supabase.from('signups').insert({
        slot_id: slot.id,
        name: sig.name,
        email: sig.email,
        source: sig.source,
        cancel_token: randomUUID(),
        reminder_opt_in: true,
        reminder_offset: '1_day',
      });
    }
  }
  console.log('✓ Baseball Snack Duty (multi-date) —', baseballStart, 'to', baseballEnd);

  // ─── 4. Book Club — simple list (no dates) ────────────────────────────────
  const bookDate = futureDate(28);
  const { data: e4, error: err4 } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Read or Die Book Club — "River is Waiting"',
      description:
        'We\'re reading "River is Waiting" by Wally Lamb this month. Please sign up to bring something! Shera will handle the main dish. Any questions, text the group chat.',
      location: "Shera's house, 42 Elm Street",
      start_date: `${bookDate}T00:00:00.000Z`,
      end_date: `${bookDate}T23:59:59.000Z`,
      signup_type: 'simple',
      published: true,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (err4 || !e4) { console.error('Book Club insert failed:', err4); process.exit(1); }

  const bookItems = [
    { role_name: 'Red wine', cap: 2, desc: 'One bottle per signup — any variety you enjoy' },
    { role_name: 'White wine or rosé', cap: 2, desc: 'One bottle per signup' },
    { role_name: 'Sparkling water / NA option', cap: 1, desc: 'For the non-drinkers — a fun mocktail or sparkling juice works great' },
    { role_name: 'Savory appetizer', cap: 2, desc: 'Enough for 8 people — cheese, dips, bruschetta, etc.' },
    { role_name: 'Dessert', cap: 1, desc: 'Something sweet to share — store-bought totally fine!' },
    { role_name: 'Plates, napkins & cutlery', cap: 1, desc: 'Paper is fine' },
  ];

  for (const item of bookItems) {
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: e4.id,
        role_name: item.role_name,
        role_description: item.desc,
        start_time: null,
        end_time: null,
        capacity: item.cap,
        instructions: null,
      })
      .select('id')
      .single();

    if (!slot) continue;

    if (item.role_name === 'Red wine') {
      const sig = nextSignup('volunteer');
      await supabase.from('signups').insert({
        slot_id: slot.id, name: sig.name, email: sig.email, source: sig.source,
        cancel_token: randomUUID(), reminder_opt_in: true, reminder_offset: '1_day',
      });
    } else if (item.role_name === 'White wine or rosé') {
      const s1 = nextSignup('volunteer');
      const s2 = nextSignup('organizer');
      await supabase.from('signups').insert([
        { slot_id: slot.id, name: s1.name, email: s1.email, source: s1.source, cancel_token: randomUUID(), reminder_opt_in: true, reminder_offset: '1_day' },
        { slot_id: slot.id, name: s2.name, email: s2.email, source: s2.source, cancel_token: randomUUID(), reminder_opt_in: true, reminder_offset: '1_day' },
      ]);
    } else if (item.role_name === 'Dessert') {
      const sig = nextSignup('volunteer');
      await supabase.from('signups').insert({
        slot_id: slot.id, name: sig.name, email: sig.email, source: sig.source,
        cancel_token: randomUUID(), reminder_opt_in: true, reminder_offset: '1_day',
      });
    }
  }
  console.log('✓ Book Club (Read or Die)');

  // ─── 5. Parents Dinner availability poll — May 2026 (Fri/Sat) ─────────────
  const dinnerStart = '2026-05-01T00:00:00.000Z';
  const dinnerEnd = '2026-05-31T23:59:59.000Z';
  const { data: eParentsDinner, error: errParentsDinner } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'We Made It — End-of-Year Parents Dinner (Marg + Chips Poll)',
      description:
        "We survived the school year — caps off, backpacks stashed, permission slips shredded. Vote for every night you can join for margs + chips + victory laps at Salazar. We will lock the real date once the crowd votes with their thirsty hearts.",
      location: 'Salazar — patio energy, salted rims, salty chips',
      start_date: dinnerStart,
      end_date: dinnerEnd,
      signup_type: 'availability',
      published: true,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (errParentsDinner || !eParentsDinner) {
    console.error('Parents dinner poll insert failed:', errParentsDinner);
    process.exit(1);
  }

  const dinnerOptions = [
    {
      role_name: 'Saturday, May 2, 2026',
      start_time: '2026-05-02T00:00:00.000Z',
      end_time: null as string | null,
      notes: 'All-day-ish window — daytime hangouts or sunset chips',
    },
    {
      role_name: 'Friday, May 8, 2026, 6:00 PM – 9:00 PM',
      start_time: ts('2026-05-08', '18:00'),
      end_time: ts('2026-05-08', '21:00'),
      notes: 'Early birds bring limes.',
    },
    {
      role_name: 'Saturday, May 9, 2026, 6:30 PM – 9:30 PM',
      start_time: ts('2026-05-09', '18:30'),
      end_time: ts('2026-05-09', '21:30'),
      notes: 'Kid-energy night — high fives mandatory',
    },
    {
      role_name: 'Friday, May 15, 2026, 7:00 PM – 10:00 PM',
      start_time: ts('2026-05-15', '19:00'),
      end_time: ts('2026-05-15', '22:00'),
      notes: '"We survived grading" sparkling toast bracket',
    },
    {
      role_name: 'Saturday, May 16, 2026',
      start_time: '2026-05-16T00:00:00.000Z',
      end_time: null,
      notes: 'Flexible scheduling — brunch crew or dusk patio',
    },
    {
      role_name: 'Friday, May 22, 2026, 6:30 PM – 9:30 PM',
      start_time: ts('2026-05-22', '18:30'),
      end_time: ts('2026-05-22', '21:30'),
      notes: 'Almost-June glow — extra guac votes count double',
    },
    {
      role_name: 'Saturday, May 23, 2026, 7:00 PM – 10:00 PM',
      start_time: ts('2026-05-23', '19:00'),
      end_time: ts('2026-05-23', '22:00'),
      notes: 'Last weekend of May — go big on the chip basket',
    },
  ];

  const dinnerSlotIds: string[] = [];
  for (let i = 0; i < dinnerOptions.length; i++) {
    const opt = dinnerOptions[i]!;
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: eParentsDinner.id,
        role_name: opt.role_name,
        role_description: opt.notes,
        start_time: opt.start_time,
        end_time: opt.end_time,
        capacity: 9999,
        instructions: null,
        sort_order: i,
      })
      .select('id')
      .single();
    if (slot?.id) dinnerSlotIds.push(slot.id);
  }

  const rgDinnerRon = randomUUID();
  await insertAvailabilitySeedSignup(
    supabase,
    dinnerSlotIds[1]!,
    CHARACTERS[0]!.name,
    TEST_EMAILS[CHARACTERS[0]!.email]!,
    'volunteer',
    rgDinnerRon
  );
  await insertAvailabilitySeedSignup(
    supabase,
    dinnerSlotIds[3]!,
    CHARACTERS[0]!.name,
    TEST_EMAILS[CHARACTERS[0]!.email]!,
    'volunteer',
    rgDinnerRon
  );
  await insertAvailabilitySeedSignup(
    supabase,
    dinnerSlotIds[6]!,
    CHARACTERS[4]!.name,
    TEST_EMAILS[CHARACTERS[4]!.email]!,
    'organizer',
    randomUUID()
  );

  console.log('✓ Parents Dinner availability poll (May 2026)');

  // ─── 6. Crystal Mahjong availability poll — June 2026 (Wed/Thu) ─────────────
  const mjStart = '2026-06-01T00:00:00.000Z';
  const mjEnd = '2026-06-30T23:59:59.000Z';
  const { data: eMahjong, error: errMahjong } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: "Crystal's Philly Mahjong Mixer — clubhouse date poll",
      description:
        "Green dragons welcome. Crystal reserved the mahogany room at The Clubhouse for June — tap every Wednesday or Thursday you can shuffle in before sundown gossip starts. Bri is bringing kettle corn; fancy tea RSVP on the spreadsheet of doom.",
      location: 'The Clubhouse Philadelphia — mahogany parlor, Rittenhouse-adjacent (demo)',
      start_date: mjStart,
      end_date: mjEnd,
      signup_type: 'availability',
      published: true,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (errMahjong || !eMahjong) {
    console.error('Mahjong poll insert failed:', errMahjong);
    process.exit(1);
  }

  const mahjongOptions = [
    {
      role_name: 'Wednesday, June 3, 2026, 2:00 PM – 5:00 PM',
      start_time: ts('2026-06-03', '14:00'),
      end_time: ts('2026-06-03', '17:00'),
      notes: 'Daytime retirees + remote-work sneaks alike',
    },
    {
      role_name: 'Thursday, June 4, 2026, 6:30 PM – 9:00 PM',
      start_time: ts('2026-06-04', '18:30'),
      end_time: ts('2026-06-04', '21:00'),
      notes: 'Tea service + petty plays only',
    },
    {
      role_name: 'Wednesday, June 10, 2026',
      start_time: '2026-06-10T00:00:00.000Z',
      end_time: null as string | null,
      notes: 'Floating midday/evening — host will DM thread',
    },
    {
      role_name: 'Thursday, June 11, 2026, 6:00 PM – 8:30 PM',
      start_time: ts('2026-06-11', '18:00'),
      end_time: ts('2026-06-11', '20:30'),
      notes: '"Soft launch" breezy windows open',
    },
    {
      role_name: 'Wednesday, June 17, 2026, 7:00 PM – 9:30 PM',
      start_time: ts('2026-06-17', '19:00'),
      end_time: ts('2026-06-17', '21:30'),
      notes: 'Mid-month momentum match',
    },
    {
      role_name: 'Thursday, June 25, 2026',
      start_time: '2026-06-25T00:00:00.000Z',
      end_time: null,
      notes: 'Finale vibes — trophies if you remembered your own rack',
    },
  ];

  const mjSlotIds: string[] = [];
  for (let i = 0; i < mahjongOptions.length; i++) {
    const opt = mahjongOptions[i]!;
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: eMahjong.id,
        role_name: opt.role_name,
        role_description: opt.notes,
        start_time: opt.start_time,
        end_time: opt.end_time,
        capacity: 9999,
        instructions: null,
        sort_order: i,
      })
      .select('id')
      .single();
    if (slot?.id) mjSlotIds.push(slot.id);
  }

  const rgMjBuddy = randomUUID();
  await insertAvailabilitySeedSignup(
    supabase,
    mjSlotIds[0]!,
    CHARACTERS[6]!.name,
    TEST_EMAILS[CHARACTERS[6]!.email]!,
    'volunteer',
    rgMjBuddy
  );
  await insertAvailabilitySeedSignup(
    supabase,
    mjSlotIds[2]!,
    CHARACTERS[6]!.name,
    TEST_EMAILS[CHARACTERS[6]!.email]!,
    'volunteer',
    rgMjBuddy
  );
  await insertAvailabilitySeedSignup(
    supabase,
    mjSlotIds[4]!,
    CHARACTERS[8]!.name,
    TEST_EMAILS[CHARACTERS[8]!.email]!,
    'volunteer',
    randomUUID()
  );

  console.log('✓ Crystal Mahjong availability poll (June 2026)');

  // ─── 7. Playwright Stable Draft — always unpublished, for E2E tests ───────
  // This is E2E_TEST_DRAFT_EVENT_ID — a permanent draft that never gets published.
  // Tests that check "draft 404" and "Draft pill on dashboard" target this event.
  const draftDate = futureDate(60);
  const { data: e5, error: err5 } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Playwright Stable Draft — do not publish',
      description: 'This event exists only to support E2E tests. Do not publish it.',
      location: 'Test Location',
      start_date: `${draftDate}T00:00:00.000Z`,
      end_date: `${draftDate}T23:59:59.000Z`,
      signup_type: 'simple',
      published: false,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (err5 || !e5) { console.error('Stable Draft insert failed:', err5); process.exit(1); }

  // One slot so the edit page has something to render
  await supabase.from('slots').insert({
    event_id: e5.id,
    role_name: 'Placeholder item',
    role_description: 'Exists only for test scaffolding',
    start_time: null,
    end_time: null,
    capacity: 1,
    instructions: null,
  });
  console.log('✓ Playwright Stable Draft');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('Done! Copy these into your .env.local:\n');
  console.log(`E2E_TEST_EVENT_ID=${e1.id}`);
  console.log(`E2E_TEST_MULTI_DATE_EVENT_ID=${e3.id}`);
  console.log(`E2E_TEST_DRAFT_EVENT_ID=${e5.id}`);
  console.log(`DEMO_POLL_PARENTS_DINNER_ID=${eParentsDinner.id}`);
  console.log(`DEMO_POLL_MAHJONG_ID=${eMahjong.id}`);
  console.log('─────────────────────────────────────────────────────────────\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
