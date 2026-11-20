import type { AppDependencies } from './app';
import type { Config } from './config/env';
import { AccountEmails } from './features/accounts/AccountEmails';
import { AccountService } from './features/accounts/AccountService';
import { PostgresAccountRepository } from './features/accounts/PostgresAccountRepository';
import { PostgresSessionRepository } from './features/accounts/PostgresSessionRepository';
import { ScryptPasswordHasher } from './features/accounts/ScryptPasswordHasher';
import { SessionService } from './features/accounts/SessionService';
import { PostgresDatabaseStatus } from './features/health/PostgresDatabaseStatus';
import { createDatabasePool } from './shared/database/createDatabasePool';
import { ConsoleEmailSender } from './shared/email/ConsoleEmailSender';
import type { EmailSender } from './shared/email/EmailSender';
import { SmtpEmailSender } from './shared/email/SmtpEmailSender';

/**
 * Creates the real objects and connects them: repositories → services → (controllers, in buildApp).
 * Shared by both composition roots (main.ts for development, vercel.ts when deployed), so they can't drift apart.
 * Returns a function that closes the database connections when the server stops.
 */
export function createDependencies(config: Config): {
  dependencies: Omit<AppDependencies, 'logger'>;
  closeDatabase: () => Promise<void>;
} {
  const pool = createDatabasePool(config);
  const passwords = new ScryptPasswordHasher();
  const accounts = new AccountService(
    new PostgresAccountRepository(pool),
    passwords,
    createEmailSender(config),
    new AccountEmails(config.appBaseUrl),
  );
  return {
    dependencies: {
      database: new PostgresDatabaseStatus(pool),
      accounts,
      sessions: new SessionService(new PostgresSessionRepository(pool), passwords),
      secureCookies: config.appBaseUrl.startsWith('https://'),
    },
    closeDatabase: () => pool.end(),
  };
}

/** Sends real emails when an email account is configured; otherwise only writes them to the log (local development). */
function createEmailSender(config: Config): EmailSender {
  if (config.smtp) return new SmtpEmailSender(config.smtp);
  return new ConsoleEmailSender();
}
