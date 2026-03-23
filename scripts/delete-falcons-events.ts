/**
 * Delete all events for the Falcons org (slug: falconstrack).
 *
 * Usage:
 *   npx dotenv -e .env.local -- tsx scripts/delete-falcons-events.ts
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

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'falconstrack')
    .maybeSingle();

  if (orgErr || !org) {
    console.error('Falcons org not found (slug: falconstrack):', orgErr?.message ?? 'No org');
    process.exit(1);
  }

  const { data: events, error: listErr } = await supabase
    .from('events')
    .select('id, title')
    .eq('organization_id', org.id);

  if (listErr) {
    console.error('Failed to list events:', listErr);
    process.exit(1);
  }

  const count = events?.length ?? 0;
  if (count === 0) {
    console.log('No events to delete for Falcons org.');
    return;
  }

  console.log(`Deleting ${count} event(s) from ${org.name} (falconstrack):`);
  events?.forEach((e) => console.log(`  - ${e.title}`));

  const { error: delErr } = await supabase
    .from('events')
    .delete()
    .eq('organization_id', org.id);

  if (delErr) {
    console.error('Delete failed:', delErr);
    process.exit(1);
  }

  console.log('\nDone. All events deleted (slots and signups cascade).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
