/** Everything the server reads from the environment, checked once at start-up. */
export interface Config {
  /** Postgres connection string of the Supabase database (it includes the password). */
  databaseUrl: string;
  /** Where the web app is, for the links in emails, without a trailing "/" (for example https://les-project-group-5.vercel.app). */
  appBaseUrl: string;
}

/**
 * Reads the configuration from packages/server/.env (loaded by Node's --env-file-if-exists flag in package.json),
 * or from the Vercel project's environment variables when deployed.
 * Fails at start-up with a clear message, instead of failing later on the first request.
 *
 * @param defaultAppBaseUrl used when APP_BASE_URL is not set: main.ts passes the local address,
 *   vercel.ts passes the address of the current Vercel deploy.
 */
export function readConfig(defaultAppBaseUrl?: string): Config {
  const appBaseUrl = process.env.APP_BASE_URL || defaultAppBaseUrl;
  if (!appBaseUrl) throw new Error('Missing APP_BASE_URL: the address of the web app, used for the links in emails.');
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    appBaseUrl: appBaseUrl.replace(/\/+$/, ''),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(
      `Missing ${name}. Copy it from the Supabase dashboard (Connect button) into packages/server/.env.`,
    );
  return value;
}
