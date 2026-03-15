'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';

export default function RequestSignInLinkPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (otpError) throw otpError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
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
            <h1 className="mt-4 text-2xl font-semibold text-charcoal font-heading">
              Check your email
            </h1>
            <p className="mt-4 text-sm text-muted font-body">
              If an account exists for {email}, we&apos;ve sent you a sign in link.
            </p>
          </div>
          <div className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
            <Link
              href="/login"
              className="btn-primary w-full flex items-center justify-center"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
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
          <h1 className="mt-4 text-2xl font-semibold text-charcoal font-heading">
            Request sign in link
          </h1>
          <p className="mt-1 text-sm text-muted font-body">
            Enter your email and we&apos;ll send you a link to sign in.
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
          >
            {isLoading ? 'Sending link…' : 'Send sign in link'}
          </button>
        </form>

        <p className="text-center text-sm text-muted font-body">
          <Link href="/login" className="font-medium text-charcoal hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
