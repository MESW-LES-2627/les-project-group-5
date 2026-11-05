/** What the health check says: whether the server answers, and whether the server can reach its database. */
export interface HealthStatus {
  server: boolean;
  database: boolean;
}

const OFFLINE: HealthStatus = { server: false, database: false };

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
}
