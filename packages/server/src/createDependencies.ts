import type { AppDependencies } from './app';
import type { Config } from './config/env';
import { AccountEmails } from './features/accounts/AccountEmails';
import { AccountService } from './features/accounts/AccountService';
import { PostgresAccountRepository } from './features/accounts/PostgresAccountRepository';
import { ScryptPasswordHasher } from './features/accounts/ScryptPasswordHasher';
import { PostgresDatabaseStatus } from './features/health/PostgresDatabaseStatus';
import { createDatabasePool } from './shared/database/createDatabasePool';
import { ConsoleEmailSender } from './shared/email/ConsoleEmailSender';

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
  const accounts = new AccountService(
    new PostgresAccountRepository(pool),
    new ScryptPasswordHasher(),
    // Emails are only written to the log until a real provider is chosen (#52).
    new ConsoleEmailSender(),
    new AccountEmails(config.appBaseUrl),
  );
  return {
    dependencies: { database: new PostgresDatabaseStatus(pool), accounts },
    closeDatabase: () => pool.end(),
  };
}
