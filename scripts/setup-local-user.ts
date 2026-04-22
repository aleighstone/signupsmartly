/**
 * One-time setup script for local development.
 *
 * Creates the users, organizations, and organization_members rows
 * needed to match the local Supabase auth account and the seed script.
 *
 * Run AFTER `supabase start` and BEFORE `npm run seed-demo`:
 *   npx dotenv -e .env.local -- tsx scripts/setup-local-user.ts
 *
 * Safe to re-run — uses upsert so it won't duplicate records.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const ORGANIZER_USER_ID   = 'bc5c1e83-970c-4cc2-b490-11d5888e31c8';
const ORGANIZATION_ID     = 'e19c419e-04d8-481b-b786-0e5bdb8462e1';
const ORGANIZER_EMAIL     = process.env.E2E_ORGANIZER_EMAIL ?? 'test@test.com';
const ORGANIZER_NAME      = 'Allison';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Setting up local user records...\n');

  // 1. Create organization
  const { error: orgError } = await supabase
    .from('organizations')
    .upsert({
      id: ORGANIZATION_ID,
      name: 'My Organization',
      timezone: 'America/Los_Angeles',
    }, { onConflict: 'id' });

  if (orgError) {
    console.error('❌ Failed to create organization:', orgError.message);
    process.exit(1);
  }
  console.log('✅ Organization ready:', ORGANIZATION_ID);

  // 2. Create user row (matches auth.users.id)
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: ORGANIZER_USER_ID,
      email: ORGANIZER_EMAIL,
      name: ORGANIZER_NAME,
    }, { onConflict: 'id' });

  if (userError) {
    console.error('❌ Failed to create user:', userError.message);
    process.exit(1);
  }
  console.log('✅ User ready:', ORGANIZER_USER_ID);

  // 3. Create organization_members row
  const { error: memberError } = await supabase
    .from('organization_members')
    .upsert({
      organization_id: ORGANIZATION_ID,
      user_id: ORGANIZER_USER_ID,
      role: 'owner',
    }, { onConflict: 'organization_id,user_id' });

  if (memberError) {
    console.error('❌ Failed to create membership:', memberError.message);
    process.exit(1);
  }
  console.log('✅ Membership ready: owner of org\n');

  console.log('All done! You can now run: npm run seed-demo');
}

main();
