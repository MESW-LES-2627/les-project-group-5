import Fastify, { type FastifyInstance } from 'fastify';
import { HealthController } from './controllers/HealthController';
import type { DatabaseStatus } from './database/DatabaseStatus';

export interface AppDependencies {
  logger: boolean;
  database: DatabaseStatus;
}

/** Builds the server with all its routes, without starting it. Tests use it directly, with no network. */
export function buildApp(dependencies: AppDependencies): FastifyInstance {
  const app = Fastify({ logger: dependencies.logger });
  new HealthController(dependencies.database).register(app);
  return app;
}
