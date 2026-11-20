/** What is needed to create an account that still has to confirm its email. */
export interface NewAccount {
  /** Already normalized (see normalizeEmail in the domain). */
  email: string;
  passwordHash: string;
  /** Hash of the token in the confirmation link. */
  confirmationTokenHash: string;
  confirmationExpiresAt: Date;
}

/** A confirmation token found in the database. */
export interface StoredConfirmationToken {
  userId: string;
  expiresAt: Date;
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

  /** Finds a confirmation token by its hash, or null if there is none (never sent, already used or replaced). */
  findConfirmationToken(tokenHash: string): Promise<StoredConfirmationToken | null>;

  /**
   * Uses the token: deletes it and marks the account's email as confirmed, together.
   * Returns false, and changes nothing, if the token no longer exists (for example a double click used it first).
   */
  confirmEmail(tokenHash: string, confirmedAt: Date): Promise<boolean>;
}
