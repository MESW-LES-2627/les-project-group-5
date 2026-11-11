import type { PasswordProblem } from '@instrument/domain';

/** What the health check says: whether the server answers, and whether the server can reach its database. */
export interface HealthStatus {
  server: boolean;
  database: boolean;
}

const OFFLINE: HealthStatus = { server: false, database: false };

/** Which sign-up fields the server rejected, and why (same words as the domain rules). */
export interface SignUpErrors {
  email?: 'invalid-format';
  password?: PasswordProblem;
}

/**
 * The answer to a sign-up. "sent" means: check your inbox. On purpose, it doesn't say whether an account was created.
 * "failed" means the server could not be reached or had a problem.
 */
export type SignUpAnswer = { kind: 'sent' } | { kind: 'rejected'; errors: SignUpErrors } | { kind: 'failed' };

/**
 * The only way the browser talks to the server (enforced by ESLint: `fetch` is not allowed anywhere else).
 * Every server call gets one method here, so pages never deal with URLs or HTTP details.
 */
export class ApiClient {
  constructor(private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init)) {}

  /**
   * Asks the server's health check. Never throws: a network error just means "offline".
   * If the server can't be reached, we can't know about the database either, so both are reported offline.
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await this.fetchFn('/api/health');
      if (!response.ok) return OFFLINE;
      const body: unknown = await response.json();
      if (typeof body !== 'object' || body === null) return OFFLINE;
      const { status, database } = body as { status?: unknown; database?: unknown };
      if (status !== 'ok') return OFFLINE;
      return { server: true, database: database === 'online' };
    } catch {
      return OFFLINE;
    }
  }

  /** Creates an account (US-E1-01). Never throws: problems come back as "failed". */
  async signUp(email: string, password: string): Promise<SignUpAnswer> {
    try {
      const response = await this.fetchFn('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 202) return { kind: 'sent' };
      if (response.status === 400) {
        const body: unknown = await response.json();
        const errors = (body as { errors?: unknown } | null)?.errors;
        // A 400 without field errors (for example a malformed request) is our bug, not the user's: report it as failed.
        if (typeof errors === 'object' && errors !== null) return { kind: 'rejected', errors: errors as SignUpErrors };
      }
      return { kind: 'failed' };
    } catch {
      return { kind: 'failed' };
    }
  }
}
