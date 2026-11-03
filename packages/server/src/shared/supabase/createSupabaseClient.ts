import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Config } from '../../config/env';

/**
 * Creates the one Supabase client the server uses. main.ts passes it to every Supabase repository,
 * so all features share the same connection settings.
 */
export function createSupabaseClient(config: Config): SupabaseClient {
  // The server keeps no user session: it is not a browser, so there is nothing to store or refresh.
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
