/** Everything the server reads from the environment, checked once at start-up. */
export interface Config {
  /** Postgres connection string of the Supabase database (it includes the password). */
  databaseUrl: string;
  /** Where the web app is, for the links in emails, without a trailing "/" (for example https://les-project-group-5.vercel.app). */
  appBaseUrl: string;
  /** Whether to encrypt the database connection. Supabase requires it; the local Docker database has no SSL. */
  databaseSsl: boolean;
  /**
   * How to send emails over SMTP, or undefined when EMAIL_USER or EMAIL_PASS is not set.
   * Then emails are only written to the log, so the server still runs locally without the password.
   */
  smtp?: SmtpConfig;
}

/** The SMTP server and the email account that logs in to it to send emails. */
export interface SmtpConfig {
  host: string;
  port: number;
  /** Email address of the account (EMAIL_USER). */
  user: string;
  /** Its password (EMAIL_PASS). For Gmail this is an App Password, not the normal password. */
  pass: string;
  /** Sender shown in the email (EMAIL_FROM), e.g. "Instrument <you@gmail.com>". Defaults to EMAIL_USER. */
  from: string;
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
    databaseUrl: requireEnv('DATABASE_URL'),
    appBaseUrl: appBaseUrl.replace(/\/+$/, ''),
    // On unless turned off on purpose, so a missing variable can never send the password unencrypted to Supabase.
    databaseSsl: process.env.DATABASE_SSL !== 'false',
    smtp: readSmtpConfig(),
  };
}

/**
 * Both EMAIL_USER and EMAIL_PASS, or neither (emails go to the log).
 * Only one of them is a mistake: we stop at start-up, instead of silently sending no emails (e.g. on Vercel).
 * Exported only so env.test.ts can check these three cases.
 */
export function readSmtpConfig(): SmtpConfig | undefined {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user && !pass) return undefined;
  if (!user || !pass) {
    throw new Error(`Missing ${user ? 'EMAIL_PASS' : 'EMAIL_USER'}. Set both EMAIL_USER and EMAIL_PASS to send emails, or neither to only log them.`);
  }
  return {
    // Gmail by default; another provider only needs SMTP_HOST and SMTP_PORT in .env.
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    user,
    pass,
    from: process.env.EMAIL_FROM || user,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy it from the Supabase dashboard (Connect button) into packages/server/.env.`,
    );
  }
  return value;
}
