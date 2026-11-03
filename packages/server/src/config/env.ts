/** Everything the server reads from the environment, checked once at start-up. */
export interface Config {
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * Reads the configuration from packages/server/.env (loaded by Node's --env-file-if-exists flag in package.json).
 * Fails at start-up with a clear message, instead of failing later on the first request.
 */
export function readConfig(): Config {
  return {
    supabaseUrl: requireEnv('SUPABASE_URL'),
    supabaseKey: requireEnv('SUPABASE_SECRET_KEY'),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Copy it from the Supabase dashboard into packages/server/.env.`);
  return value;
}
