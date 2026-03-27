import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { AuthError } from '@supabase/supabase-js';
import { ensureUserAndOrg } from '@/lib/ensure-user-org';

const LOG = '[auth/callback]';

/** Maps Supabase auth errors to login query params for clearer UX + analytics. */
function loginErrorParamFromAuthError(err: AuthError): string {
  const msg = err.message.toLowerCase();
  const code = String((err as { code?: string }).code ?? '').toLowerCase();
  if (
    code === 'otp_expired' ||
    msg.includes('otp_expired') ||
    msg.includes('expired') ||
    msg.includes('invalid or has expired') ||
    msg.includes('already been used')
  ) {
    return 'link_expired';
  }
  return 'auth';
}

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
    const errParam = loginErrorParamFromAuthError(error);
    console.error(LOG, 'OTP verification failed', {
      message: error.message,
      loginError: errParam,
    });
    return NextResponse.redirect(`${origin}/login?error=${errParam}`);
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errParam = loginErrorParamFromAuthError(error);
      console.error(LOG, 'exchangeCodeForSession failed', {
        message: error.message,
        status: error.status,
        loginError: errParam,
      });
      return NextResponse.redirect(`${origin}/login?error=${errParam}`);
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
