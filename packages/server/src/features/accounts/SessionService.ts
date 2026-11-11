import { normalizeEmail } from '@instrument/domain';
import type { PasswordHasher } from './PasswordHasher';
import { createSecretToken, hashToken, isWellFormedToken } from './SecretToken';
import type { SessionRepository, SessionUser } from './SessionRepository';

/** How long a session lasts. After that, the person has to log in again. */
export const SESSION_DAYS = 30;

/**
 * The result of a login. "invalid" is the same for a wrong password and for an email with no account,
 * so nobody can find out who has an account (US-E1-04).
 */
export type LogInResult =
  | { outcome: 'logged-in'; token: string; expiresAt: Date; email: string }
  | { outcome: 'invalid' }
  | { outcome: 'not-confirmed' };

/** Logging in and out. Knows nothing about HTTP or cookies: the controller turns the token into a cookie. */
export class SessionService {
  /**
   * A hash of a password nobody knows. When the email has no account, we still check the password against it,
   * so that answer takes as long as a wrong password for a real account.
   */
  private readonly unknownAccountHash: Promise<string>;

  constructor(
    private readonly sessions: SessionRepository,
    private readonly passwords: PasswordHasher,
    // The clock is passed in, so tests can check when sessions expire.
    private readonly now: () => Date = () => new Date(),
  ) {
    this.unknownAccountHash = passwords.hash(createSecretToken().token);
  }

  /** US-E1-04: checks the email and password and, if they are right, starts a session. */
  async logIn(emailText: string, password: string): Promise<LogInResult> {
    const account = await this.sessions.findAccountForLogin(normalizeEmail(emailText));
    const passwordMatches = await this.passwords.verify(password, account?.passwordHash ?? (await this.unknownAccountHash));
    if (!account || !passwordMatches) return { outcome: 'invalid' };
    // Only after the right password: otherwise this answer would tell a stranger that the account exists.
    if (!account.emailConfirmed) return { outcome: 'not-confirmed' };

    const session = createSecretToken();
    const expiresAt = new Date(this.now().getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await this.sessions.createSession(account.userId, session.hash, expiresAt);
    return { outcome: 'logged-in', token: session.token, expiresAt, email: normalizeEmail(emailText) };
  }

  /** The user of a session token, or null if there is no valid session. */
  async currentUser(token: string | undefined): Promise<SessionUser | null> {
    if (!token || !isWellFormedToken(token)) return null;
    return this.sessions.findSessionUser(hashToken(token), this.now());
  }

  /** US-E1-05: ends this session only. Does nothing if there is no session. */
  async logOut(token: string | undefined): Promise<void> {
    if (!token || !isWellFormedToken(token)) return;
    await this.sessions.deleteSession(hashToken(token));
  }
}
