/** What is needed to create an account that still has to confirm its email. */
export interface NewAccount {
  /** Already normalized (see normalizeEmail in the domain). */
  email: string;
  passwordHash: string;
  /** Hash of the token in the confirmation link. */
  confirmationTokenHash: string;
  confirmationExpiresAt: Date;
}

/**
 * Stores accounts. The service depends on this interface, so its tests use an in-memory fake
 * and need no database (see PostgresAccountRepository for the real one).
 */
export interface AccountRepository {
  /**
   * Creates the account and its confirmation token together: either both are saved or neither.
   * Returns false, and saves nothing, if the email already has an account.
   */
  createUnconfirmed(account: NewAccount): Promise<boolean>;
}
