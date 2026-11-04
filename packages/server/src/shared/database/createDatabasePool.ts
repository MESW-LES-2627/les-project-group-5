import pg from 'pg';
import type { Config } from '../../config/env';

// Without a limit, connecting to an unreachable host or a stuck query could hang a request for a long time.
const TIMEOUT_MS = 3000;

/**
 * Creates the one Postgres connection pool the server uses. main.ts passes it to every Postgres repository,
 * so all features share the same connections and settings. We write the SQL by hand: no ORM, no query builder.
 */
export function createDatabasePool(config: Config): pg.Pool {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    // Few connections: on Vercel every function instance has its own pool, and Supabase limits connections.
    max: 5,
    connectionTimeoutMillis: TIMEOUT_MS,
    query_timeout: TIMEOUT_MS,
    // Supabase requires an encrypted connection. Its certificate is signed by Supabase's own authority,
    // which Node does not know, so we encrypt without checking who signed it.
    ssl: { rejectUnauthorized: false },
  });
  // A connection that breaks while unused emits 'error'. Without a listener, Node would stop the whole server.
  pool.on('error', (error) => console.error('Database connection error:', error.message));
  return pool;
}
