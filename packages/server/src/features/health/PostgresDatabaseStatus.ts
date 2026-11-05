import type pg from 'pg';
import type { DatabaseStatus } from './DatabaseStatus';

/** Checks the Postgres database (hosted on Supabase) by running the smallest possible query. */
export class PostgresDatabaseStatus implements DatabaseStatus {
  constructor(private readonly pool: pg.Pool) {}

  async isOnline(): Promise<boolean> {
    try {
      // Needs no table: if the database answers this, it is online. The pool's timeouts stop it from hanging.
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
