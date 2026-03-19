import { type User } from '@supabase/supabase-js';
import { serviceSupabase } from '@/lib/supabase-service';

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
    authUser.user_metadata?.name ||
    authUser.email?.split('@')[0] ||
    'Organizer';

  // Ensure users row exists (service role bypasses RLS)
  const { data: existingUser } = await serviceSupabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingUser) {
    const { error: userError } = await serviceSupabase.from('users').insert({
      id: userId,
      email,
      name,
    });
    if (userError && userError.code !== '23505') {
      // 23505 = unique violation, user may exist from sync-user race
      console.error('ensureUserAndOrg: users insert failed', userError);
      return { userId, orgId: null };
    }
  }

  // Check for existing org membership
  const { data: membership } = await serviceSupabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .maybeSingle();

  if (membership?.organization_id) {
    return { userId, orgId: membership.organization_id };
  }

  // Create org and membership
  const { data: orgData, error: orgError } = await serviceSupabase
    .from('organizations')
    .insert({
      name: `${name}'s Organization`,
      timezone: 'America/New_York',
    })
    .select('id')
    .single();

  if (orgError || !orgData) {
    console.error('ensureUserAndOrg: organizations insert failed', orgError);
    return { userId, orgId: null };
  }

  const { error: memberError } = await serviceSupabase
    .from('organization_members')
    .insert({
      organization_id: orgData.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberError) {
    console.error('ensureUserAndOrg: organization_members insert failed', memberError);
    return { userId, orgId: null };
  }

  return { userId, orgId: orgData.id };
}
