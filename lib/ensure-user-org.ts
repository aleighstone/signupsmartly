import { type User } from '@supabase/supabase-js';
import { serviceSupabase } from '@/lib/supabase-service';

const LOG = '[ensureUserAndOrg]';
const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Ensures the app users row and an organization exist for an authenticated user.
 * Uses service role to bypass RLS, which can fail for newly confirmed users
 * before their session is fully propagated.
 *
 * Call only after verifying the user is authenticated.
 */
export async function ensureUserAndOrg(authUser: User): Promise<{
  userId: string;
  orgId: string | null;
}> {
  const userId = authUser.id;
  const email = authUser.email!;
  const name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split('@')[0] ||
    'Organizer';

  console.info(LOG, 'start', {
    userId,
    email,
    hasServiceKey,
  });

  // Ensure users row exists (service role bypasses RLS)
  const { data: existingUser, error: selectUserError } = await serviceSupabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (selectUserError) {
    console.error(LOG, 'users select failed', {
      code: selectUserError.code,
      message: selectUserError.message,
      details: selectUserError.details,
    });
    return { userId, orgId: null };
  }

  if (!existingUser) {
    // @ts-expect-error Supabase Insert type inference
    const { error: userError } = await serviceSupabase.from('users').insert({
      id: userId,
      email,
      name,
    });
    if (userError && userError.code !== '23505') {
      // 23505 = unique violation, user may exist from sync-user race
      console.error(LOG, 'users insert failed', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
      });
      return { userId, orgId: null };
    }
    if (userError?.code === '23505') {
      console.info(LOG, 'users insert skipped (unique violation, continuing)');
    }
  }

  // Check for existing org membership
  const { data: membership, error: membershipError } = await serviceSupabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error(LOG, 'organization_members select failed', {
      code: membershipError.code,
      message: membershipError.message,
      details: membershipError.details,
    });
    return { userId, orgId: null };
  }

  const membershipRow = membership as { organization_id: string } | null;
  if (membershipRow?.organization_id) {
    console.info(LOG, 'existing membership', { orgId: membershipRow.organization_id });
    return { userId, orgId: membershipRow.organization_id };
  }

  // Create org and membership
  const { data: orgData, error: orgError } = await serviceSupabase
    .from('organizations')
    // @ts-expect-error Supabase Insert type inference
    .insert({
      name: `${name}'s Organization`,
      timezone: 'America/New_York',
    })
    .select('id')
    .single();

  if (orgError || !orgData) {
    console.error(LOG, 'organizations insert failed', {
      code: orgError?.code,
      message: orgError?.message,
      details: orgError?.details,
    });
    return { userId, orgId: null };
  }

  const org = orgData as { id: string };
  const { error: memberError } = await serviceSupabase
    .from('organization_members')
    // @ts-expect-error Supabase Insert type inference
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberError) {
    console.error(LOG, 'organization_members insert failed', {
      code: memberError.code,
      message: memberError.message,
      details: memberError.details,
    });
    return { userId, orgId: null };
  }

  console.info(LOG, 'success', { orgId: org.id });
  return { userId, orgId: org.id };
}
