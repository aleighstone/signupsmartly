/**
 * Deletes test-generated events that accumulate from Playwright runs.
 *
 * Targets events whose titles start with "Playwright" (e.g. "Playwright Draft Test")
 * and also the stable draft seeded by seed-demo-events.ts so you can re-seed cleanly.
 *
 * Cascade: slots and signups are deleted automatically via foreign key cascade.
 *
 * Usage:
 *   npm run clean-test-data
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (in .env.local)
 *
 * Run this after test sessions to keep the local DB tidy.
 * Then re-run `npm run seed-demo` and update .env.local with the new IDs.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

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

  // Fetch matching events first so we can report what we're deleting
  const { data: events, error: fetchError } = await supabase
    .from('events')
    .select('id, title, published')
    .ilike('title', 'Playwright%');

  if (fetchError) {
    console.error('Failed to fetch test events:', fetchError.message);
    process.exit(1);
  }

  if (!events || events.length === 0) {
    console.log('No Playwright test events found — nothing to clean up.');
    return;
  }

  console.log(`Found ${events.length} test event(s) to delete:\n`);
  for (const e of events) {
    console.log(`  [${e.published ? 'published' : 'draft   '}] ${e.title}  (${e.id})`);
  }

  const ids = events.map((e) => e.id);

  // Delete events — slots/signups cascade automatically
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('\nDelete failed:', deleteError.message);
    process.exit(1);
  }

  console.log(`\n✓ Deleted ${ids.length} event(s) and their slots/signups.`);
  console.log('\nNext steps:');
  console.log('  npm run seed-demo          # re-seed fresh demo data');
  console.log('  # copy the printed IDs into .env.local');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
