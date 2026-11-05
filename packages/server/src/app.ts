import Fastify, { type FastifyInstance } from 'fastify';
import { HealthController } from './features/health/HealthController';
import type { DatabaseStatus } from './features/health/DatabaseStatus';

export interface AppDependencies {
  logger: boolean;
  database: DatabaseStatus;
}

/** Builds the server with every feature's routes, without starting it. Tests use it directly, with no network. */
export function buildApp(dependencies: AppDependencies): FastifyInstance {
  const app = Fastify({ logger: dependencies.logger });
  new HealthController(dependencies.database).register(app);
  return app;
}
