'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') ?? '/dashboard';

    const runAuth = async () => {
      const supabase = createClient();

      if (tokenHash && type) {
        const { error: authError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'signup' | 'email',
        });
        if (!authError) {
          router.replace(next);
          return;
        }
        setError(authError.message);
      } else if (code) {
        const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
        if (!authError) {
          router.replace(next);
          return;
        }
        setError(authError.message);
      } else {
        setError('Invalid confirmation link');
      }
    };

    runAuth();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xl font-semibold text-charcoal font-heading hover:opacity-90 transition-opacity"
          >
            <Image src="/smartly-icon.png" alt="" width={32} height={32} className="shrink-0" aria-hidden />
            SignupSmartly
          </Link>
          <div className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
            <p className="text-coral font-body mb-4">{error}</p>
            <Link href="/login" className="btn-primary w-full inline-block text-center">
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
            <Image src="/smartly-icon.png" alt="" width={32} height={32} className="shrink-0" aria-hidden />
            SignupSmartly
          </Link>
          <h1 className="mt-8 text-2xl font-semibold text-charcoal font-heading">
            Confirming your email…
          </h1>
          <p className="mt-2 text-sm text-muted font-body">
            Please wait while we sign you in.
          </p>
          <div className="mt-8 flex justify-center" aria-hidden>
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent"
              role="status"
              aria-label="Loading"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xl font-semibold text-charcoal font-heading hover:opacity-90 transition-opacity"
          >
            <Image src="/smartly-icon.png" alt="" width={32} height={32} className="shrink-0" aria-hidden />
            SignupSmartly
          </Link>
          <h1 className="mt-8 text-2xl font-semibold text-charcoal font-heading">
            Confirming your email…
          </h1>
          <p className="mt-2 text-sm text-muted font-body">
            Please wait while we sign you in.
          </p>
          <div className="mt-8 flex justify-center" aria-hidden>
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent"
              role="status"
              aria-label="Loading"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
