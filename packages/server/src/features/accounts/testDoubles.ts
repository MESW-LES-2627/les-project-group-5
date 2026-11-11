import type { Email, EmailSender } from '../../shared/email/EmailSender';
import type { AccountRepository, NewAccount } from './AccountRepository';
import { AccountEmails } from './AccountEmails';
import { AccountService } from './AccountService';
import type { PasswordHasher } from './PasswordHasher';

// Fakes used by the account tests, so they need no database, no slow hashing and send no email.

/** Keeps accounts in memory, with the same "one account per email" rule as the database. */
export class InMemoryAccountRepository implements AccountRepository {
  readonly accounts: NewAccount[] = [];

  async createUnconfirmed(account: NewAccount): Promise<boolean> {
    if (this.accounts.some((existing) => existing.email === account.email)) return false;
    this.accounts.push(account);
    return true;
  }
}

/** A fast, readable stand-in for the real hash. Never use it outside tests. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    return storedHash === `hashed:${password}`;
  }
}

/** Remembers the emails instead of sending them. */
export class RecordingEmailSender implements EmailSender {
  readonly sent: Email[] = [];

  async send(email: Email): Promise<void> {
    this.sent.push(email);
  }
}

/** An account service built only from fakes, for tests of other routes that just need buildApp to work. */
export function fakeAccountService(): AccountService {
  return new AccountService(
    new InMemoryAccountRepository(),
    new FakePasswordHasher(),
    new RecordingEmailSender(),
    new AccountEmails('https://app.example'),
  );
}
