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
 * The answer to a confirmation link (US-E1-02). "invalid" covers a link already used, replaced or malformed.
 * "failed" means the server could not be reached or had a problem.
 */
export type ConfirmEmailAnswer = 'confirmed' | 'expired' | 'invalid' | 'failed';

/**
 * The answer to a login (US-E1-04). "invalid" is the same for a wrong password and an unknown email.
 * "failed" means the server could not be reached or had a problem.
 */
export type LogInAnswer = { kind: 'logged-in'; email: string } | { kind: 'invalid' } | { kind: 'not-confirmed' } | { kind: 'failed' };

const CONFIRM_EMAIL_ANSWERS: Record<number, ConfirmEmailAnswer> = { 200: 'confirmed', 410: 'expired', 400: 'invalid' };

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

  /** Confirms an email with the token from the link (US-E1-02). Never throws: problems come back as "failed". */
  async confirmEmail(token: string): Promise<ConfirmEmailAnswer> {
    try {
      const response = await this.fetchFn('/api/email-confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return CONFIRM_EMAIL_ANSWERS[response.status] ?? 'failed';
    } catch {
      return 'failed';
    }
  }

  /** Logs in (US-E1-04). The server sets the session cookie; the page never sees it. Never throws. */
  async logIn(email: string, password: string): Promise<LogInAnswer> {
    try {
      const response = await this.fetchFn('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 401) return { kind: 'invalid' };
      if (response.status === 403) return { kind: 'not-confirmed' };
      if (response.ok) {
        const email = await emailIn(response);
        if (email) return { kind: 'logged-in', email };
      }
      return { kind: 'failed' };
    } catch {
      return { kind: 'failed' };
    }
  }

  /** The email of the logged-in user, or null for a guest. If the server can't be reached, we treat the player as a guest. */
  async currentUser(): Promise<string | null> {
    try {
      const response = await this.fetchFn('/api/session');
      return response.ok ? await emailIn(response) : null;
    } catch {
      return null;
    }
  }

  /** Logs out on this device (US-E1-05). Returns false if the server could not be reached. */
  async logOut(): Promise<boolean> {
    try {
      const response = await this.fetchFn('/api/session', { method: 'DELETE' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/** The "email" field of a JSON answer, or null if it is missing. */
async function emailIn(response: Response): Promise<string | null> {
  const body: unknown = await response.json();
  const email = (body as { email?: unknown } | null)?.email;
  return typeof email === 'string' ? email : null;
}
