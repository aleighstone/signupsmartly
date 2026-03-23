/**
 * Seed demo events for screenshots.
 *
 * Creates 4 events with slots and pre-filled signups using Will Ferrell movie
 * character names. Uses test emails and mix of organizer/volunteer signups.
 *
 * Usage:
 *   npx dotenv -e .env.local -- tsx scripts/seed-demo-events.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { randomUUID } from 'crypto';

const ORGANIZATION_ID = 'e19c419e-04d8-481b-b786-0e5bdb8462e1';
const ORGANIZER_USER_ID = '8505859f-4555-45a5-8550-16318e8ed7d3';

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

function ts(date: string, time: string): string {
  const [h, m] = time.split(':').map((x) => parseInt(x, 10) || 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date}T${pad(h)}:${pad(m)}:00.000Z`;
}

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

  let charIdx = 0;
  function nextSignup(source: 'volunteer' | 'organizer') {
    const c = CHARACTERS[charIdx % CHARACTERS.length];
    charIdx++;
    const email = TEST_EMAILS[c.email];
    return { name: c.name, email, source };
  }

  console.log('Seeding demo events...\n');

  // ─── 1. Track Meet ─────────────────────────────────────────────────────
  const trackMeetDate = '2026-04-11';
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

  if (err1) {
    console.error('Track Meet insert failed:', err1);
    process.exit(1);
  }

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
        event_id: e1!.id,
        role_name: s.role_name,
        start_time: ts(trackMeetDate, s.start),
        end_time: ts(trackMeetDate, s.end),
        capacity: s.cap,
        instructions: s.instructions,
      })
      .select('id')
      .single();

    // Pre-fill some signups: Setup 2/4, Registration 1/3, Timer 3/6, Finish 2/4, Concessions 0, Cleanup 1/4
    const signups: { slot_id: string; name: string; email: string; source: 'volunteer' | 'organizer' }[] = [];
    if (s.role_name === 'Setup Crew') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot!.id, email: TEST_EMAILS[0] });
      signups.push({ ...nextSignup('organizer'), slot_id: slot!.id, email: TEST_EMAILS[1] });
    } else if (s.role_name === 'Registration & Check-In') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot!.id, email: TEST_EMAILS[2] });
    } else if (s.role_name === 'Timer') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot!.id, email: TEST_EMAILS[0] });
      signups.push({ ...nextSignup('volunteer'), slot_id: slot!.id, email: TEST_EMAILS[1] });
      signups.push({ ...nextSignup('organizer'), slot_id: slot!.id, email: TEST_EMAILS[2] });
    } else if (s.role_name === 'Finish Line Judge') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot!.id, email: TEST_EMAILS[0] });
      signups.push({ ...nextSignup('organizer'), slot_id: slot!.id, email: TEST_EMAILS[1] });
    } else if (s.role_name === 'Cleanup Crew') {
      signups.push({ ...nextSignup('volunteer'), slot_id: slot!.id, email: TEST_EMAILS[2] });
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
  console.log('✓ Track Meet (Spring Track Meet #3)');

  // ─── 2. Parent Teacher Conferences ─────────────────────────────────────
  const confDate = '2026-04-30';
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

  if (err2) {
    console.error('Conferences insert failed:', err2);
    process.exit(1);
  }

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
    const desc =
      i >= 6
        ? 'Evening slot — 15-minute individual conference'
        : '15-minute individual conference';
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: e2!.id,
        role_name: 'Parent Conference',
        start_time: ts(confDate, s.start),
        end_time: ts(confDate, s.end),
        capacity: 1,
        instructions: desc,
      })
      .select('id')
      .single();

    // Fill slots 0, 2, 4, 7 for variety
    if ([0, 2, 4, 7].includes(i)) {
      const sig = nextSignup(i === 7 ? 'organizer' : 'volunteer');
      await supabase.from('signups').insert({
        slot_id: slot!.id,
        name: sig.name,
        email: sig.email,
        source: sig.source,
        cancel_token: randomUUID(),
        reminder_opt_in: true,
        reminder_offset: '1_day',
      });
    }
  }
  console.log('✓ Parent Teacher Conferences');

  // ─── 3. Baseball Snack Duty ────────────────────────────────────────────
  const { data: e3, error: err3 } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Mustangs Baseball — Spring Snack Duty',
      description:
        'One family per game brings snacks for the whole team after the final out. Please bring enough for 15 kids plus 2 coaches. Arrive with snacks by warm-up time. Individual bagged snacks and drinks work great!',
      location: 'Riverside Park, Field 3',
      start_date: '2026-04-05T00:00:00.000Z',
      end_date: '2026-05-31T23:59:59.000Z',
      signup_type: 'scheduled',
      published: true,
      created_by: ORGANIZER_USER_ID,
    })
    .select('id')
    .single();

  if (err3) {
    console.error('Baseball insert failed:', err3);
    process.exit(1);
  }

  const baseballSlots = [
    { date: '2026-04-05', name: 'April 5 Home Game', start: '9:30', end: '11:00' },
    { date: '2026-04-12', name: 'April 12 Away Game', start: '9:30', end: '11:00' },
    { date: '2026-04-19', name: 'April 19 Home Game', start: '11:30', end: '13:00' },
    { date: '2026-05-03', name: 'May 3 Home Game', start: '9:30', end: '11:00' },
    { date: '2026-05-17', name: 'May 17 Home Game', start: '11:30', end: '13:00' },
    { date: '2026-05-31', name: 'May 31 — Last Game of Season!', start: '9:30', end: '11:00' },
  ];

  for (let i = 0; i < baseballSlots.length; i++) {
    const s = baseballSlots[i];
    const instructions =
      i === 5
        ? 'End of season! Feel free to go all out 🎉'
        : 'Post-game snacks for ~14 players';
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: e3!.id,
        role_name: s.name,
        start_time: ts(s.date, s.start),
        end_time: ts(s.date, s.end),
        capacity: 1,
        instructions,
      })
      .select('id')
      .single();

    // Fill April 5, April 19, May 31
    if ([0, 2, 5].includes(i)) {
      const sig = nextSignup(i === 2 ? 'organizer' : 'volunteer');
      await supabase.from('signups').insert({
        slot_id: slot!.id,
        name: sig.name,
        email: sig.email,
        source: sig.source,
        cancel_token: randomUUID(),
        reminder_opt_in: true,
        reminder_offset: '1_day',
      });
    }
  }
  console.log('✓ Baseball Snack Duty');

  // ─── 4. Book Club (Simple List) ────────────────────────────────────────
  const bookDate = '2026-05-03';
  const { data: e4, error: err4 } = await supabase
    .from('events')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Read or Die Book Club (March) — "River is Waiting"',
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

  if (err4) {
    console.error('Book Club insert failed:', err4);
    process.exit(1);
  }

  const bookItems = [
    { role_name: 'Red wine', cap: 2, desc: 'One bottle per signup — any variety you enjoy' },
    { role_name: 'White wine or rosé', cap: 2, desc: 'One bottle per signup' },
    { role_name: 'Sparkling water / NA option', cap: 1, desc: 'For the non-drinkers — a fun mocktail or sparkling juice works great' },
    { role_name: 'Savory appetizer', cap: 2, desc: 'Enough for 8 people — cheese, dips, bruschetta, etc.' },
    { role_name: 'Dessert', cap: 1, desc: 'Something sweet to share — store-bought totally fine!' },
    { role_name: 'Plates, napkins & cutlery', cap: 1, desc: 'Paper is fine' },
  ];

  for (let i = 0; i < bookItems.length; i++) {
    const item = bookItems[i];
    const { data: slot } = await supabase
      .from('slots')
      .insert({
        event_id: e4!.id,
        role_name: item.role_name,
        role_description: item.desc,
        start_time: null,
        end_time: null,
        capacity: item.cap,
        instructions: null,
      })
      .select('id')
      .single();

    // Fill: Red wine 1/2, White wine 2/2, Dessert 1/1
    if (item.role_name === 'Red wine') {
      const sig = nextSignup('volunteer');
      await supabase.from('signups').insert({
        slot_id: slot!.id,
        name: sig.name,
        email: sig.email,
        source: sig.source,
        cancel_token: randomUUID(),
        reminder_opt_in: true,
        reminder_offset: '1_day',
      });
    } else if (item.role_name === 'White wine or rosé') {
      const s1 = nextSignup('volunteer');
      const s2 = nextSignup('organizer');
      await supabase.from('signups').insert([
        { slot_id: slot!.id, name: s1.name, email: s1.email, source: s1.source, cancel_token: randomUUID(), reminder_opt_in: true, reminder_offset: '1_day' },
        { slot_id: slot!.id, name: s2.name, email: s2.email, source: s2.source, cancel_token: randomUUID(), reminder_opt_in: true, reminder_offset: '1_day' },
      ]);
    } else if (item.role_name === 'Dessert') {
      const sig = nextSignup('volunteer');
      await supabase.from('signups').insert({
        slot_id: slot!.id,
        name: sig.name,
        email: sig.email,
        source: sig.source,
        cancel_token: randomUUID(),
        reminder_opt_in: true,
        reminder_offset: '1_day',
      });
    }
  }
  console.log('✓ Book Club (Read or Die)');

  console.log('\nDone. View events at: https://www.signupsmartly.com/dashboard');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
