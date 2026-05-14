/**
 * Sets up the local development user and organization after a `supabase db reset`.
 *
 * Uses the Supabase admin API to create the auth user (which handles all internal
 * auth schema requirements correctly), then creates the matching public schema rows.
 *
 * The auth user UUID is looked up dynamically from the email — no hardcoded UUID needed.
 * The resolved UUID is printed at the end so seed-demo-events.ts can use it.
 *
 * Full reset workflow:
 *   supabase db reset
 *   npm run setup-local      ← run this; it prints the organizer UUID
 *   npm run seed-demo        ← uses the same email lookup; prints event IDs for .env.local
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const ORGANIZATION_ID  = 'e19c419e-04d8-481b-b786-0e5bdb8462e1';
const ORGANIZER_EMAIL  = process.env.E2E_ORGANIZER_EMAIL  ?? 'allisonleighstone@gmail.com';
const ORGANIZER_PASSWORD = process.env.E2E_ORGANIZER_PASSWORD ?? 'Events123!';
const ORGANIZER_NAME   = 'Allison';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('Setting up local development user...\n');

  // 1. Create auth user via admin API — handles all auth schema internals correctly.
  //    If the user already exists (safe to re-run), we skip creation and look them up.
  let organizerUserId: string;

  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email: ORGANIZER_EMAIL,
      password: ORGANIZER_PASSWORD,
      email_confirm: true,
    });

  if (createError) {
    const dupMsg = createError.message?.toLowerCase() ?? '';
    const isDuplicateEmail =
      dupMsg.includes('already been registered') ||
      dupMsg.includes('already registered') ||
      dupMsg.includes('email address has already') ||
      dupMsg.includes('user already registered') ||
      dupMsg.includes('already exists');

    if (isDuplicateEmail) {
      // User exists — look them up by email
      console.log('Auth user already exists — looking up existing user...');
      const { data: { users }, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('❌ Could not list auth users:', listError.message);
        process.exit(1);
      }
      const existing = users.find((u) => u.email === ORGANIZER_EMAIL);
      if (!existing) {
        console.error('❌ Could not find existing auth user with email:', ORGANIZER_EMAIL);
        process.exit(1);
      }
      organizerUserId = existing.id;
    } else {
      console.error('❌ Failed to create auth user:', createError.message);
      process.exit(1);
    }
  } else {
    organizerUserId = createData.user.id;
    console.log('✅ Auth user created');
  }

  console.log('   UUID:', organizerUserId);
  console.log('   Email:', ORGANIZER_EMAIL);

  // 2. Organization
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
  console.log('✅ Organization ready');

  // 3. Public user profile
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: organizerUserId,
      email: ORGANIZER_EMAIL,
      name: ORGANIZER_NAME,
    }, { onConflict: 'id' });

  if (userError) {
    console.error('❌ Failed to create user profile:', userError.message);
    process.exit(1);
  }
  console.log('✅ User profile ready');

  // 4. Org membership
  const { error: memberError } = await supabase
    .from('organization_members')
    .upsert({
      organization_id: ORGANIZATION_ID,
      user_id: organizerUserId,
      role: 'owner',
    }, { onConflict: 'organization_id,user_id' });

  if (memberError) {
    console.error('❌ Failed to create membership:', memberError.message);
    process.exit(1);
  }
  console.log('✅ Membership ready: owner of org\n');

  console.log('All done! Now run: npm run seed-demo');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
