import { checkPassword, isValidEmail, normalizeEmail, type PasswordProblem } from '@instrument/domain';
import type { EmailSender } from '../../shared/email/EmailSender';
import type { AccountEmails } from './AccountEmails';
import type { AccountRepository } from './AccountRepository';
import type { PasswordHasher } from './PasswordHasher';
import { createSecretToken, hashToken, isWellFormedToken } from './SecretToken';

/** How long a confirmation link works (US-E1-02). */
const CONFIRMATION_LINK_HOURS = 24;
const CONFIRMATION_LINK_MS = CONFIRMATION_LINK_HOURS * 60 * 60 * 1000;

/** At most one new confirmation email per account in this time (US-E1-03). */
const RESEND_INTERVAL_MS = 60 * 1000;

/** How long a password reset link works (US-E1-06). */
const PASSWORD_RESET_LINK_MS = 30 * 60 * 1000;

/** At most one password reset email per account in this time (US-E1-06). */
const PASSWORD_RESET_INTERVAL_MS = 60 * 1000;

/**
 * Asking for a new confirmation email always takes at least this long. Sending an email takes a second or two,
 * so without it, a fast answer would tell that the email has no unconfirmed account (US-E2-02).
 */
export const RESEND_MIN_DURATION_MS = 3000;

/** Asking for a password reset also takes a minimum time to avoid revealing whether an account exists. */
export const PASSWORD_RESET_MIN_DURATION_MS = 3000;

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

/**
 * The result of opening a confirmation link (US-E1-02). "invalid" covers a link that was already used,
 * was replaced by a newer one, or is malformed: the page shows one message for all of them.
 */
export type ConfirmEmailResult = 'confirmed' | 'expired' | 'invalid';

/**
 * The result of asking for a new confirmation email (US-E1-03). "accepted" is the same whether or not
 * an email was sent, so it doesn't say whether the account exists or is confirmed.
 */
export type ResendConfirmationResult = 'accepted' | 'invalid-email';

/** The result of asking for a password reset; it does not reveal whether the account exists. */
export type PasswordResetRequestResult = 'accepted';

/** The result of using a password reset link. */
export type PasswordResetResult =
  | { outcome: 'changed' }
  | { outcome: 'invalid-link' }
  | { outcome: 'rejected'; errors: { password: PasswordProblem } };

/** The account rules. Knows nothing about HTTP or the database: it gets those through interfaces. */
export class AccountService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly passwords: PasswordHasher,
    private readonly emailSender: EmailSender,
    private readonly emails: AccountEmails,
    // The clock is passed in, so tests can check the expiry time.
    private readonly now: () => Date = () => new Date(),
    // Waiting is passed in too, so tests don't really wait for the minimum duration of a resend.
    private readonly wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
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
      confirmationExpiresAt: new Date(this.now().getTime() + CONFIRMATION_LINK_MS),
    });

    await this.emailSender.send(
      created ? this.emails.confirmation(email, confirmation.token) : this.emails.signUpAttempt(email),
    );
    return { outcome: 'accepted' };
  }

  /** US-E1-02: uses the token of a confirmation link to activate the account. */
  async confirmEmail(token: string): Promise<ConfirmEmailResult> {
    // A malformed token can't be in the database: answer without asking it.
    if (!isWellFormedToken(token)) return 'invalid';
    const tokenHash = hashToken(token);
    const stored = await this.accounts.findConfirmationToken(tokenHash);
    if (!stored) return 'invalid';
    // An expired token stays in the database, so the page can say "expired" instead of "invalid".
    // It is replaced when a new link is sent (US-E1-03).
    const now = this.now();
    if (stored.expiresAt.getTime() <= now.getTime()) return 'expired';
    return (await this.accounts.confirmEmail(tokenHash, now)) ? 'confirmed' : 'invalid';
  }

  /**
   * US-E1-03: sends a new confirmation link if the email has an unconfirmed account.
   * The new link replaces the old one, and at most one email per account is sent each minute.
   * The answer and its timing are the same in every case (US-E2-02).
   */
  async resendConfirmation(emailText: string): Promise<ResendConfirmationResult> {
    const email = normalizeEmail(emailText);
    // A malformed email can't have an account, so this answer reveals nothing.
    if (!isValidEmail(email)) return 'invalid-email';

    const startedAt = this.now().getTime();
    const confirmation = createSecretToken();
    const expiresAt = new Date(startedAt + CONFIRMATION_LINK_MS);
    const replaced = await this.accounts.replaceConfirmationToken({
      email,
      tokenHash: confirmation.hash,
      expiresAt,
      // Every link lasts the same time, so a token sent a minute ago expires a minute before the new one.
      replaceIfExpiresBy: new Date(expiresAt.getTime() - RESEND_INTERVAL_MS),
    });
    if (replaced) await this.emailSender.send(this.emails.confirmation(email, confirmation.token));

    // Answer only after the minimum duration, whether or not an email was sent.
    const elapsed = this.now().getTime() - startedAt;
    if (elapsed < RESEND_MIN_DURATION_MS) await this.wait(RESEND_MIN_DURATION_MS - elapsed);
    return 'accepted';
  }

  /**
   * Sends a reset link for an account whether or not its email is confirmed.
   * Unknown and malformed emails, and requests inside the one-minute limit, get the same answer.
   */
  async requestPasswordReset(emailText: string): Promise<PasswordResetRequestResult> {
    const startedAt = this.now();
    const email = normalizeEmail(emailText);
    if (isValidEmail(email)) {
      const reset = createSecretToken();
      const created = await this.accounts.replacePasswordResetToken({
        email,
        tokenHash: reset.hash,
        expiresAt: new Date(startedAt.getTime() + PASSWORD_RESET_LINK_MS),
        createdAt: startedAt,
        replaceIfCreatedAtOrBefore: new Date(startedAt.getTime() - PASSWORD_RESET_INTERVAL_MS),
      });
      if (created) await this.emailSender.send(this.emails.passwordReset(email, reset.token));
    }

    // Make known-account, unknown-account and malformed-email requests take a comparable time.
    const elapsed = this.now().getTime() - startedAt.getTime();
    if (elapsed < PASSWORD_RESET_MIN_DURATION_MS) await this.wait(PASSWORD_RESET_MIN_DURATION_MS - elapsed);
    return 'accepted';
  }

  /** Changes the password only when the link is well-formed, unused and unexpired. */
  async resetPassword(token: string, password: string): Promise<PasswordResetResult> {
    const passwordProblem = checkPassword(password);
    if (passwordProblem) return { outcome: 'rejected', errors: { password: passwordProblem } };
    if (!isWellFormedToken(token)) return { outcome: 'invalid-link' };

    const changedAt = this.now();
    const passwordHash = await this.passwords.hash(password);
    const changed = await this.accounts.completePasswordReset({
      tokenHash: hashToken(token),
      passwordHash,
      changedAt,
    });
    return changed ? { outcome: 'changed' } : { outcome: 'invalid-link' };
  }
}
