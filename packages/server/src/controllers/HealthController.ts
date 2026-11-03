import type { FastifyInstance } from 'fastify';

/**
 * GET /api/health: tells the browser that the server is running.
 * It has no rules and no data, so it needs no service or repository.
 * Later controllers receive their services through the constructor and only translate HTTP to and from them.
 */
export class HealthController {
  /** Adds the health route to the Fastify app. */
  register(app: FastifyInstance): void {
    app.get(
      '/api/health',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: { status: { type: 'string', enum: ['ok'] } },
              required: ['status'],
            },
          },
        },
      },
      async () => ({ status: 'ok' as const }),
    );
  }
}
