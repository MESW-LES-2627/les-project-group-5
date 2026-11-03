import { createClient } from '@supabase/supabase-js';
import { buildApp } from './app';
import { SupabaseDatabaseStatus } from './database/SupabaseDatabaseStatus';

// Composition root of the server: reads the configuration, creates the objects and starts listening.
// In development, Vite forwards every /api request from the browser to this port (see packages/web/vite.config.ts).
const PORT = 3000;

// Values come from packages/server/.env (loaded by Node's --env-file-if-exists flag in package.json).
const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_SECRET_KEY');

// The server keeps no user session: it is not a browser, so there is nothing to store or refresh.
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = buildApp({ logger: true, database: new SupabaseDatabaseStatus(supabase) });
await app.listen({ port: PORT, host: '127.0.0.1' });

/** Stops at start-up with a clear message, instead of failing later on the first request. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Copy it from the Supabase dashboard into packages/server/.env.`);
  return value;
}
