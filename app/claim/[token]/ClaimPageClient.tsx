'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

type ClaimPageClientProps = {
  token: string;
  recipientEmail: string;
  recipientHasAccount: boolean;
};

export function ClaimPageClient({
  token,
  recipientEmail,
  recipientHasAccount,
}: ClaimPageClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionEmail(data.user?.email?.toLowerCase() ?? null);
    });
  }, [supabase]);

  const recipientLower = recipientEmail.toLowerCase();
  const isLoggedIn = !!sessionEmail;
  const emailMatches = sessionEmail === recipientLower;

  const finalizeClaim = async (body?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Unable to claim signup');
      router.push(json.redirectTo || '/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to claim signup');
    } finally {
      setLoading(false);
    }
  };

  const handleExistingAccountSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: recipientLower,
        password,
      });
      if (signInError) throw signInError;
      await finalizeClaim();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
      setLoading(false);
    }
  };

  const handleCreateAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    await finalizeClaim({ name, password });
  };

  return (
    <div className="mt-6 rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
      {error && <p className="mb-4 rounded-lg bg-coral/10 px-3 py-2 text-sm text-charcoal">{error}</p>}

      {isLoggedIn ? (
        emailMatches ? (
          <div className="space-y-4">
            <p className="text-sm text-muted font-body">
              Signed in as <span className="font-medium text-charcoal">{sessionEmail}</span>
            </p>
            <button
              type="button"
              onClick={() => finalizeClaim()}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Claiming...' : 'Claim signup'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-coral font-body">
            This invitation was sent to a different email address.
          </p>
        )
      ) : recipientHasAccount ? (
        <form className="space-y-4" onSubmit={handleExistingAccountSignIn}>
          <p className="text-sm text-muted font-body">
            Sign in to claim this signup.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal font-body">Email</label>
            <input
              value={recipientLower}
              readOnly
              className="w-full rounded-xl border border-charcoal/20 bg-charcoal/5 px-3 py-2.5 text-charcoal font-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal font-body">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in & claim signup'}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleCreateAndClaim}>
          <p className="text-sm text-muted font-body">
            Create your free SignupSmartly account to claim this signup.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal font-body">Email</label>
            <input
              value={recipientLower}
              readOnly
              className="w-full rounded-xl border border-charcoal/20 bg-charcoal/5 px-3 py-2.5 text-charcoal font-body"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal font-body">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal font-body">Password</label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account & claim signup'}
          </button>
        </form>
      )}
    </div>
  );
}
