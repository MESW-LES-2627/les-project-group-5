/**
 * The only way the browser talks to the server (enforced by ESLint: `fetch` is not allowed anywhere else).
 * Every server call gets one method here, so pages never deal with URLs or HTTP details.
 */
export class ApiClient {
  constructor(private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init)) {}

  /** True if the server answers its health check. Never throws: a network error just means "offline". */
  async isServerOnline(): Promise<boolean> {
    try {
      const response = await this.fetchFn('/api/health');
      if (!response.ok) return false;
      const body: unknown = await response.json();
      return typeof body === 'object' && body !== null && (body as { status?: unknown }).status === 'ok';
    } catch {
      return false;
    }
  }
}
