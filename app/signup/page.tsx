'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';
import { usePostHog } from '@posthog/react';

export default function SignUpPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [name, setName] = useState('');
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
      const { data, error: signUpError } =
        await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (signUpError) throw signUpError;
      if (data.user) {
        if (posthog) {
          posthog.identify(data.user.id, { email: data.user.email ?? undefined });
          posthog.capture('organizer_signed_up', { email: data.user.email ?? undefined });
        }
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name: name || data.user.email?.split('@')[0] || 'Organizer',
          }),
        });
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 text-xl font-semibold text-charcoal font-heading hover:opacity-90 transition-opacity">
            <Image src="/smartly-icon.png" alt="" width={32} height={32} className="shrink-0" aria-hidden />
            SignupSmartly
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-charcoal font-heading">
            Create account
          </h1>
          <p className="mt-1 text-sm text-muted font-body">
            Create an account to organize volunteer events
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-charcoal/10 bg-surface p-6 space-y-4 shadow-soft"
        >
          {error && (
            <p className="text-sm text-white rounded-xl bg-coral p-3 font-body">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-charcoal mb-1 font-body"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-charcoal mb-1 font-body"
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
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-charcoal mb-1 font-body"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted font-body">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-charcoal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
