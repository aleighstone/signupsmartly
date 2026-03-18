import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Note: we intentionally do not throw at module load time so `next build` can succeed
// even if you haven't set SERVICE_ROLE_KEY in local dev yet.
// In production, set `SUPABASE_SERVICE_ROLE_KEY` for strict RLS support.
const keyToUse = serviceRoleKey ?? anonKey;
if (!serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is missing; falling back to anon key. Set it in server env for strict RLS.'
  );
}

// Use no-store so event/slot/signup data is never cached (keeps "still needed" accurate)
const noCacheFetch: typeof fetch = (url, init) =>
  fetch(url, { ...init, cache: 'no-store' });

export const serviceSupabase = createClient<Database>(
  supabaseUrl,
  keyToUse,
  {
    global: { fetch: noCacheFetch },
  }
);

