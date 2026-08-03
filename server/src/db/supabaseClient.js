import { createClient } from '@supabase/supabase-js';

let cachedClient;

/**
 * True when Supabase credentials are present. Until then the app falls back to
 * local SQLite so development keeps working with no extra setup.
 */
export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Service-role client. This key bypasses row level security, so it must only
 * ever be used on the server — never sent to the browser.
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }

  if (!cachedClient) {
    cachedClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  return cachedClient;
}
