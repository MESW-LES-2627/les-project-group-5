import { checkPassword, isValidEmail, normalizeEmail, type PasswordProblem } from '@instrument/domain';
import type { EmailSender } from '../../shared/email/EmailSender';
import type { AccountEmails } from './AccountEmails';
import type { AccountRepository } from './AccountRepository';
import type { PasswordHasher } from './PasswordHasher';
import { createSecretToken } from './SecretToken';

/** How long a confirmation link works (US-E1-02). */
const CONFIRMATION_LINK_HOURS = 24;

/** Which fields were rejected, and why. */
export interface SignUpErrors {
  email?: 'invalid-format';
  password?: PasswordProblem;
}

/**
 * The result of a sign-up. "accepted" does not say whether an account was created:
 * on purpose, it is the same when the email already had an account.
 */
export type SignUpResult = { outcome: 'accepted' } | { outcome: 'rejected'; errors: SignUpErrors };

/** The account rules. Knows nothing about HTTP or the database: it gets those through interfaces. */
export class AccountService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly passwords: PasswordHasher,
    private readonly emailSender: EmailSender,
    private readonly emails: AccountEmails,
    // The clock is passed in, so tests can check the expiry time.
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** US-E1-01: creates an unconfirmed account and sends the confirmation email. */
  async signUp(emailText: string, password: string): Promise<SignUpResult> {
    const email = normalizeEmail(emailText);
    const errors: SignUpErrors = {};
    if (!isValidEmail(email)) errors.email = 'invalid-format';
    const passwordProblem = checkPassword(password);
    if (passwordProblem) errors.password = passwordProblem;
    if (errors.email || errors.password) return { outcome: 'rejected', errors };

    // Hash before knowing whether the email exists: the slow hash then happens in both cases,
    // so the response time doesn't reveal who has an account.
    const passwordHash = await this.passwords.hash(password);
    const confirmation = createSecretToken();
    const created = await this.accounts.createUnconfirmed({
      email,
      passwordHash,
      confirmationTokenHash: confirmation.hash,
      confirmationExpiresAt: new Date(this.now().getTime() + CONFIRMATION_LINK_HOURS * 60 * 60 * 1000),
    });

    await this.emailSender.send(
      created ? this.emails.confirmation(email, confirmation.token) : this.emails.signUpAttempt(email),
    );
    return { outcome: 'accepted' };
  }
}
