import Fastify, { type FastifyInstance } from 'fastify';
import { HealthController } from './controllers/HealthController';

/** Builds the server with all its routes, without starting it. Tests use it directly, with no network. */
export function buildApp(options: { logger: boolean } = { logger: false }): FastifyInstance {
  const app = Fastify({ logger: options.logger });
  new HealthController().register(app);
  return app;
}
