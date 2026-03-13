'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import posthog from 'posthog-js';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      posthog.reset();
      router.push('/');
      router.refresh();
    };
    signOut();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand">
      <p className="text-muted font-body">Signing out…</p>
    </div>
  );
}
