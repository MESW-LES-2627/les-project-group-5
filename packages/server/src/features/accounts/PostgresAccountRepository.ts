import type pg from 'pg';
import type {
  AccountRepository,
  ConfirmationTokenReplacement,
  NewAccount,
  StoredConfirmationToken,
} from './AccountRepository';

/** Stores accounts in Postgres (tables from migrations/001_create_account_tables.sql). */
export class PostgresAccountRepository implements AccountRepository {
  constructor(private readonly pool: pg.Pool) {}

  async createUnconfirmed(account: NewAccount): Promise<boolean> {
    // A transaction needs one connection for all its queries, so we take one from the pool.
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // ON CONFLICT DO NOTHING: if the email already exists, no row comes back and nothing fails.
      // This also covers two sign-ups with the same email at the same moment: only one of them inserts.
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [account.email, account.passwordHash],
      );
      const userId = inserted.rows[0]?.id;
      if (!userId) {
        await client.query('ROLLBACK');
        return false;
      }
      await client.query(
        `INSERT INTO email_confirmation_tokens (token_hash, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [account.confirmationTokenHash, userId, account.confirmationExpiresAt],
      );
      await client.query('COMMIT');
      return true;
    } catch (error) {
      // Undo the half-done work, so we never keep an account without its confirmation token.
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findConfirmationToken(tokenHash: string): Promise<StoredConfirmationToken | null> {
    const result = await this.pool.query<{ user_id: string; expires_at: Date }>(
      'SELECT user_id, expires_at FROM email_confirmation_tokens WHERE token_hash = $1',
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? { userId: row.user_id, expiresAt: row.expires_at } : null;
  }

  async confirmEmail(tokenHash: string, confirmedAt: Date): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Deleting the token is what makes the link work only once. If two clicks arrive together,
      // only one of them gets the row back, and only that one confirms.
      const deleted = await client.query<{ user_id: string }>(
        'DELETE FROM email_confirmation_tokens WHERE token_hash = $1 RETURNING user_id',
        [tokenHash],
      );
      const userId = deleted.rows[0]?.user_id;
      if (!userId) {
        await client.query('ROLLBACK');
        return false;
      }
      // COALESCE keeps the first confirmation date if the account was somehow already confirmed.
      await client.query('UPDATE users SET email_confirmed_at = COALESCE(email_confirmed_at, $2) WHERE id = $1', [
        userId,
        confirmedAt,
      ]);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async replaceConfirmationToken(replacement: ConfirmationTokenReplacement): Promise<boolean> {
    // One statement, so two requests at the same moment can't both replace the token and both send an email.
    // - The SELECT finds the account only if it exists and is not confirmed yet.
    // - Each account has at most one token (user_id is UNIQUE), so ON CONFLICT replaces it: the old link stops working.
    // - The WHERE of the update skips the replacement while the current token is less than a minute old.
    // A row comes back only when a token was inserted or replaced.
    const result = await this.pool.query<{ user_id: string }>(
      `INSERT INTO email_confirmation_tokens (token_hash, user_id, expires_at)
       SELECT $2, id, $3 FROM users WHERE email = $1 AND email_confirmed_at IS NULL
       ON CONFLICT (user_id) DO UPDATE
         SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at
         WHERE email_confirmation_tokens.expires_at <= $4
       RETURNING user_id`,
      [replacement.email, replacement.tokenHash, replacement.expiresAt, replacement.replaceIfExpiresBy],
    );
    return result.rows.length > 0;
  }
}
