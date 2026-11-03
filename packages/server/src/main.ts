import { buildApp } from './app';
import { readConfig } from './config/env';
import { SupabaseDatabaseStatus } from './features/health/SupabaseDatabaseStatus';
import { createSupabaseClient } from './shared/supabase/createSupabaseClient';

// Composition root of the server: reads the configuration, creates the objects and starts listening.
// New features are wired here too: repositories → services → controllers (passed into buildApp).
// In development, Vite forwards every /api request from the browser to this port (see packages/web/vite.config.ts).
const PORT = 3000;

const config = readConfig();
const supabase = createSupabaseClient(config);

const app = buildApp({ logger: true, database: new SupabaseDatabaseStatus(supabase) });
await app.listen({ port: PORT, host: '127.0.0.1' });
