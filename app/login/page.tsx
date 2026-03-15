'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';
import { usePostHog } from '@posthog/react';

export default function LoginPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      const user = signInData.user;
      if (user && posthog) {
        posthog.identify(user.id, { email: user.email ?? undefined });
        posthog.capture('organizer_logged_in');
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
          <Link href="/" className="inline-flex items-center justify-center gap-2 text-xl font-semibold text-charcoal font-heading hover:opacity-90 transition-opacity">
            <Image src="/smartly-icon.png" alt="" width={32} height={32} className="shrink-0" aria-hidden />
            SignupSmartly
          </Link>
          <h1 className="mt-5 text-2xl font-semibold text-charcoal font-heading">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted font-body">
            Sign in to manage your events
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
          className="flex flex-col gap-5 rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft"
        >
          {error && (
            <p className="text-sm text-white rounded-xl bg-coral p-3 font-body">
              {error}
            </p>
          )}
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

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted font-body">
            Forgot password?{' '}
            <Link href="/login/request-link" className="font-medium text-charcoal hover:underline">
              Request a sign in link
            </Link>
          </p>
          <p className="text-sm text-muted font-body">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-charcoal hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
