'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';
import { usePostHog } from '@posthog/react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginBetaPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setIsLoading(false);
    } else if (posthog) {
      posthog.capture('organizer_logged_in', { method: 'google' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const user = signInData.user;
      if (user && posthog) {
        posthog.identify(user.id, { email: user.email ?? undefined });
        posthog.capture('organizer_logged_in', { method: 'email' });
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xl font-semibold text-charcoal font-heading hover:opacity-90 transition-opacity"
          >
            <Image
              src="/smartly-icon.png"
              alt=""
              width={32}
              height={32}
              className="shrink-0"
              aria-hidden
            />
            SignupSmartly
          </Link>
          <h1 className="mt-5 text-2xl font-semibold text-charcoal font-heading">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted font-body">
            Sign in to manage your events
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
          {error && (
            <p className="text-sm text-white rounded-xl bg-coral p-3 font-body">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-charcoal/20 bg-surface px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 disabled:opacity-60 transition-colors font-body"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-charcoal/20" aria-hidden />
            <span className="text-xs text-muted font-body">or</span>
            <span className="h-px flex-1 bg-charcoal/20" aria-hidden />
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault();
                e.currentTarget.closest('form')?.requestSubmit();
              }
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-charcoal font-body"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-charcoal font-body"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted font-body">
            Forgot password?{' '}
            <Link
              href="/login/request-link"
              className="font-medium text-charcoal hover:underline"
            >
              Request a sign in link
            </Link>
          </p>
          <p className="text-sm text-muted font-body">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup-beta"
              className="font-medium text-charcoal hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
