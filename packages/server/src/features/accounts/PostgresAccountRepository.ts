import type pg from 'pg';
import type { AccountRepository, NewAccount } from './AccountRepository';

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
}
