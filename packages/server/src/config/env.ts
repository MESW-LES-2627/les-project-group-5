/** Everything the server reads from the environment, checked once at start-up. */
export interface Config {
  /** Postgres connection string of the Supabase database (it includes the password). */
  databaseUrl: string;
}

/**
 * Reads the configuration from packages/server/.env (loaded by Node's --env-file-if-exists flag in package.json),
 * or from the Vercel project's environment variables when deployed.
 * Fails at start-up with a clear message, instead of failing later on the first request.
 */
export function readConfig(): Config {
  return {
    databaseUrl: requireEnv('DATABASE_URL'),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Copy it from the Supabase dashboard (Connect button) into packages/server/.env.`);
  return value;
}