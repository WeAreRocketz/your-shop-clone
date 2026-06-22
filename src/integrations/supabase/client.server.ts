// Server-side Supabase admin client (service role key — BYPASSES RLS).
// Use only in trusted server functions / server routes. Never import from
// client-reachable modules without `await import(...)` inside the handler.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, assertSupabaseConfig } from './config';

function createSupabaseAdminClient() {
  assertSupabaseConfig();
  const SERVICE_ROLE_KEY = process.env.APP_SUPABASE_SERVICE_ROLE_KEY;

  if (!SERVICE_ROLE_KEY) {
    const message =
      'Missing APP_SUPABASE_SERVICE_ROLE_KEY. Add it as a Lovable secret with your Supabase service role key.';
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy(
  {} as ReturnType<typeof createSupabaseAdminClient>,
  {
    get(_, prop, receiver) {
      if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
      return Reflect.get(_supabaseAdmin, prop, receiver);
    },
  },
);
