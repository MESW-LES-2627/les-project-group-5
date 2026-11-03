import type { FastifyInstance } from 'fastify';
import type { DatabaseStatus } from './DatabaseStatus';

/**
 * GET /api/health: tells the browser that the server is running and whether the database answers.
 * `status` stays "ok" while the server runs, even if the database is offline: the browser uses it to know
 * the server is reachable, and `database` says separately if saved data can work.
 * It has no rules, so it needs no service; it only asks the database status.
 */
export class HealthController {
  constructor(private readonly database: DatabaseStatus) {}

  register(app: FastifyInstance): void {
    app.get(
      '/api/health',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['ok'] },
                database: { type: 'string', enum: ['online', 'offline'] }
              },
              required: ['status', 'database'],
            },
          },
        },
      },
      async () => ({
        status: 'ok' as const,
        database: (await this.database.isOnline()) ? ('online' as const) : ('offline' as const)
      }),
    );
  }
}
