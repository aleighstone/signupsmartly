'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const supabase = (await import('@/lib/supabase-browser')).createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted font-body">
            Sign in to manage your events
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

        <p className="text-center text-sm text-muted font-body">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-charcoal hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
