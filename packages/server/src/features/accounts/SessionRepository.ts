/** What login needs to know about an account. */
export interface AccountForLogin {
  userId: string;
  passwordHash: string;
  emailConfirmed: boolean;
}

/** The user of a valid session. */
export interface SessionUser {
  userId: string;
  email: string;
}

/**
 * Stores sessions (one per logged-in device) and reads the accounts they belong to.
 * The service depends on this interface, so its tests use an in-memory fake (see PostgresSessionRepository).
 */
export interface SessionRepository {
  /** The account with this (normalized) email, or null if there is none. */
  findAccountForLogin(email: string): Promise<AccountForLogin | null>;

  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;

  /** The user of the session, or null if the session doesn't exist or expired before `now`. */
  findSessionUser(tokenHash: string, now: Date): Promise<SessionUser | null>;

  /** Deletes this session only; the user's sessions on other devices stay (US-E1-05). */
  deleteSession(tokenHash: string): Promise<void>;
}
