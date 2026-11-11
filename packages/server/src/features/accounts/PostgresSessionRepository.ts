import type pg from 'pg';
import type { AccountForLogin, SessionRepository, SessionUser } from './SessionRepository';

/** Stores sessions in Postgres (tables from migrations/001_create_account_tables.sql). */
export class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly pool: pg.Pool) {}

  async findAccountForLogin(email: string): Promise<AccountForLogin | null> {
    const result = await this.pool.query<{ id: string; password_hash: string; email_confirmed: boolean }>(
      'SELECT id, password_hash, email_confirmed_at IS NOT NULL AS email_confirmed FROM users WHERE email = $1',
      [email],
    );
    const row = result.rows[0];
    return row ? { userId: row.id, passwordHash: row.password_hash, emailConfirmed: row.email_confirmed } : null;
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
      tokenHash,
      userId,
      expiresAt,
    ]);
  }

  async findSessionUser(tokenHash: string, now: Date): Promise<SessionUser | null> {
    const result = await this.pool.query<{ user_id: string; email: string }>(
      `SELECT sessions.user_id, users.email
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > $2`,
      [tokenHash, now],
    );
    const row = result.rows[0];
    return row ? { userId: row.user_id, email: row.email } : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
  }
}
