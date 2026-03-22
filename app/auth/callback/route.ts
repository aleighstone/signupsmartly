import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { ensureUserAndOrg } from '@/lib/ensure-user-org';

const LOG = '[auth/callback]';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';
  const redirectUrl = `${origin}${next}`;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.info(LOG, 'request', {
    hasCode: !!code,
    hasTokenHash: !!tokenHash,
    type: type ?? null,
    hasServiceKey,
  });

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email',
    });
    if (!error) {
      console.info(LOG, 'OTP verified, redirecting');
      return NextResponse.redirect(redirectUrl);
    }
    console.error(LOG, 'OTP verification failed', {
      message: error.message,
    });
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error(LOG, 'exchangeCodeForSession failed', {
        message: error.message,
        status: error.status,
      });
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    if (!data.user) {
      console.error(LOG, 'exchangeCodeForSession succeeded but no user');
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    const result = await ensureUserAndOrg(data.user);
    if (!result.orgId) {
      console.error(LOG, 'ensureUserAndOrg returned no org', { userId: result.userId });
      return NextResponse.redirect(`${origin}/login?error=no_org`);
    }
    console.info(LOG, 'OAuth success, redirecting to', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }

  console.error(LOG, 'no code or token_hash, redirecting to login');
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
