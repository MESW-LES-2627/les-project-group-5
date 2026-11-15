import type { Email, EmailSender } from '../../shared/email/EmailSender';
import type { AccountRepository, NewAccount, StoredConfirmationToken } from './AccountRepository';
import { AccountEmails } from './AccountEmails';
import { AccountService } from './AccountService';
import type { PasswordHasher } from './PasswordHasher';

// Fakes used by the account tests, so they need no database, no slow hashing and send no email.

/** An account kept by the in-memory repository. */
export interface StoredAccount extends NewAccount {
  id: string;
  emailConfirmedAt: Date | null;
}

/** Keeps accounts in memory, with the same rules as the database: one account per email, one token per account. */
export class InMemoryAccountRepository implements AccountRepository {
  readonly accounts: StoredAccount[] = [];
  /** Confirmation tokens still usable, by hash. */
  readonly confirmationTokens = new Map<string, StoredConfirmationToken>();

  async createUnconfirmed(account: NewAccount): Promise<boolean> {
    if (this.accounts.some((existing) => existing.email === account.email)) return false;
    const id = `user-${this.accounts.length + 1}`;
    this.accounts.push({ ...account, id, emailConfirmedAt: null });
    this.confirmationTokens.set(account.confirmationTokenHash, { userId: id, expiresAt: account.confirmationExpiresAt });
    return true;
  }

  async findConfirmationToken(tokenHash: string): Promise<StoredConfirmationToken | null> {
    return this.confirmationTokens.get(tokenHash) ?? null;
  }

  async confirmEmail(tokenHash: string, confirmedAt: Date): Promise<boolean> {
    const token = this.confirmationTokens.get(tokenHash);
    if (!token) return false;
    this.confirmationTokens.delete(tokenHash);
    const account = this.accounts.find((existing) => existing.id === token.userId);
    if (account && !account.emailConfirmedAt) account.emailConfirmedAt = confirmedAt;
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
