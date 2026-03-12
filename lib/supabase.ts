import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Use no-store so event/slot/signup data is never cached (keeps "still needed" accurate)
const noCacheFetch: typeof fetch = (url, init) =>
  fetch(url, { ...init, cache: 'no-store' });

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: noCacheFetch },
});

export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { fetch: noCacheFetch },
  });
}
