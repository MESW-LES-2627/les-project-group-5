/** What is needed to create an account that still has to confirm its email. */
export interface NewAccount {
  /** Already normalized (see normalizeEmail in the domain). */
  email: string;
  passwordHash: string;
  /** Hash of the token in the confirmation link. */
  confirmationTokenHash: string;
  confirmationExpiresAt: Date;
}

/** A new confirmation link for an account that hasn't confirmed its email yet (US-E1-03). */
export interface ConfirmationTokenReplacement {
  /** Already normalized (see normalizeEmail in the domain). */
  email: string;
  /** Hash of the token in the new link. */
  tokenHash: string;
  expiresAt: Date;
  /**
   * The current token is replaced only if it expires at or before this time, that is, if it was sent
   * long enough ago. This is how "at most one email per minute" is kept, even for two requests at once.
   */
  replaceIfExpiresBy: Date;
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

  /**
   * Gives an unconfirmed account a new confirmation token, which replaces the old one (so the old link stops working).
   * Returns true if it did, so a new email must be sent. Returns false, and changes nothing, if the email has
   * no account, the account is already confirmed, or the current token is too recent (see replaceIfExpiresBy).
   */
  replaceConfirmationToken(replacement: ConfirmationTokenReplacement): Promise<boolean>;
}
