import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseStatus } from './DatabaseStatus';

// Without a limit, a request to an unreachable host could hang the health check for a long time.
const TIMEOUT_MS = 3000;

/** Checks the Supabase database by sending it a tiny request through its REST API (PostgREST). */
export class SupabaseDatabaseStatus implements DatabaseStatus {
  constructor(private readonly client: SupabaseClient) {}

  async isOnline(): Promise<boolean> {
    try {
      // We have no tables yet, so we ask for one that doesn't exist, with `head` so no rows come back.
      // What matters is who answers:
      // - status 0: no HTTP answer at all (network error, wrong URL, timeout) → offline;
      // - 5xx: PostgREST answered but could not reach the database → offline;
      // - anything else (here 404 "table not found"): the database answered → online.
      const { status } = await this.client
        .from('health_check')
        .select('*', { head: true })
        .abortSignal(AbortSignal.timeout(TIMEOUT_MS));
      return status > 0 && status < 500;
    } catch {
      return false;
    }
  }
}
